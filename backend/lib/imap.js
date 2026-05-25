const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const supabase = require('./supabase');
const { getEmailConfig } = require('./mailer');

// Strip quoted reply text from email body
// Handles Gmail, Outlook, Apple Mail, and most common clients
function extractReplyText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const out = [];
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (
      trimmed.startsWith('>') ||                          // quoted lines
      /^On .{10,} wrote:$/i.test(trimmed) ||             // Gmail/Apple "On X wrote:"
      /^[-_]{3,}/.test(trimmed) ||                       // separators --- ___
      /^From:\s/i.test(trimmed) ||                       // forwarded header
      /^Sent:\s/i.test(trimmed) ||                       // Outlook sent line
      /^To:\s/i.test(trimmed) && out.length > 0 ||       // Outlook To: (not first)
      /^Subject:\s/i.test(trimmed) && out.length > 0     // Outlook Subject:
    ) break;
    out.push(line);
  }
  return out.join('\n').trim();
}

// Convert 32-char hex (no dashes) back to UUID format
function hexToUuid(hex) {
  return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join('-');
}

async function pollEmailReplies() {
  let cfg;
  try {
    cfg = await getEmailConfig();
  } catch (err) {
    console.error('[imap] Could not load email config:', err.message);
    return;
  }

  if (!cfg.gmailUser || !cfg.gmailPass) return;

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: cfg.gmailUser, pass: cfg.gmailPass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Only fetch unread emails addressed to our support alias pattern
      const uids = await client.search({ seen: false, to: '+support-' });
      if (!uids.length) return;

      for await (const msg of client.fetch(uids, { source: true, uid: true })) {
        try {
          const parsed = await simpleParser(msg.source);
          const toText = parsed.to?.text || '';

          // Extract conv ID from the +support-{32hex} alias
          const match = toText.match(/\+support-([a-f0-9]{32})/i);
          if (!match) continue;

          const convId = hexToUuid(match[1].toLowerCase());

          // Verify conversation exists and is open
          const { data: conv } = await supabase
            .from('support_conversations')
            .select('id, status')
            .eq('id', convId)
            .maybeSingle();

          if (!conv || conv.status !== 'open') {
            // Mark read so we don't keep seeing it
            await client.messageFlagsAdd(String(msg.uid), ['\\Seen'], { uid: true });
            continue;
          }

          // Get plain text body and strip quoted text
          const bodyText = parsed.text || '';
          const replyText = extractReplyText(bodyText);

          if (replyText.length < 2) {
            await client.messageFlagsAdd(String(msg.uid), ['\\Seen'], { uid: true });
            continue;
          }

          // Save as admin message
          await supabase.from('support_messages').insert({
            conversation_id: convId,
            sender_type: 'admin',
            body: replyText,
          });

          await supabase
            .from('support_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId);

          // Mark email as read
          await client.messageFlagsAdd(String(msg.uid), ['\\Seen'], { uid: true });

          console.log(`[imap] Email reply saved → conv ${convId.slice(0, 8)}`);
        } catch (msgErr) {
          console.error('[imap] Error processing message:', msgErr.message);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error('[imap] Poll failed:', err.message);
    try { await client.logout(); } catch (_) {}
  }
}

const POLL_INTERVAL_MS = 60_000; // 1 minute

function startImapPoller() {
  // Initial poll after 10s (let server fully start first)
  setTimeout(async () => {
    await pollEmailReplies();
    setInterval(pollEmailReplies, POLL_INTERVAL_MS);
  }, 10_000);

  console.log('[imap] Email reply poller scheduled (every 60s)');
}

module.exports = { startImapPoller, pollEmailReplies };
