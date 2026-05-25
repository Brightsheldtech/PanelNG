const nodemailer = require('nodemailer');
const supabase = require('./supabase');

async function getEmailConfig() {
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['admin_email', 'gmail_user']);

  const s = {};
  (data || []).forEach((row) => { s[row.key] = row.value; });

  return {
    adminEmail: s.admin_email || process.env.ADMIN_EMAIL,
    gmailUser:  s.gmail_user  || process.env.GMAIL_USER,
    gmailPass:  process.env.GMAIL_APP_PASSWORD,
  };
}

async function sendPaymentNotification({ fullName, email, amount, reference, createdAt }) {
  try {
    const cfg = await getEmailConfig();

    if (!cfg.adminEmail || !cfg.gmailUser || !cfg.gmailPass) {
      console.warn('[mailer] Email not configured — skipping admin notification');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: cfg.gmailUser, pass: cfg.gmailPass },
    });

    const timeStr = new Date(createdAt).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Lagos',
    });

    const amountFmt = Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    await transporter.sendMail({
      from: `PanelNG <${cfg.gmailUser}>`,
      to: cfg.adminEmail,
      subject: `[PanelNG] New Payment Request — ${reference}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#06080F;color:#E8E8F0;padding:32px;border-radius:10px;">
          <div style="border-bottom:2px solid #F0A500;padding-bottom:14px;margin-bottom:24px;">
            <span style="font-size:20px;font-weight:800;color:#F0A500;letter-spacing:-0.02em;">PanelNG</span>
            <span style="font-size:13px;color:#A0A0B8;margin-left:10px;">New Payment Request</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:10px 0;color:#A0A0B8;width:150px;">Customer</td><td style="padding:10px 0;font-weight:700;">${fullName}</td></tr>
            <tr><td style="padding:10px 0;color:#A0A0B8;">Email</td><td style="padding:10px 0;">${email}</td></tr>
            <tr>
              <td style="padding:10px 0;color:#A0A0B8;">Amount</td>
              <td style="padding:10px 0;font-family:monospace;font-size:22px;font-weight:800;color:#F0A500;">₦${amountFmt}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#A0A0B8;">Reference</td>
              <td style="padding:10px 0;font-family:monospace;font-size:17px;font-weight:700;color:#0EC97F;letter-spacing:0.06em;">${reference}</td>
            </tr>
            <tr><td style="padding:10px 0;color:#A0A0B8;">Time</td><td style="padding:10px 0;">${timeStr}</td></tr>
          </table>
          <div style="margin-top:24px;padding:14px 18px;background:#0B0E18;border-radius:6px;font-size:13px;color:#A0A0B8;border:1px solid #1A1D2E;">
            Log in to your admin dashboard → <strong style="color:#E8E8F0;">Payment Requests</strong> to confirm this deposit and credit the customer's wallet.
          </div>
        </div>
      `,
    });

    console.log(`[mailer] Notification sent for ${reference}`);
  } catch (err) {
    console.error('[mailer] Failed to send notification:', err.message);
  }
}

function formatAccountsText(accounts) {
  if (!accounts) return 'No account data returned.';
  // String already formatted
  if (typeof accounts === 'string') return accounts;
  const list = Array.isArray(accounts) ? accounts : [accounts];
  return list.map((acc, i) => {
    const header = `Account ${i + 1}`;
    if (typeof acc === 'string') return `${header}:\n  ${acc}`;
    return `${header}:\n${Object.entries(acc).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`;
  }).join('\n\n');
}

async function sendOrderDelivery({ toEmail, toName, productName, quantity, totalNGN, orderId, deliveredAt, accounts }) {
  try {
    const cfg = await getEmailConfig();
    if (!cfg.gmailUser || !cfg.gmailPass) {
      console.warn('[mailer] Email not configured — skipping order delivery email');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: cfg.gmailUser, pass: cfg.gmailPass },
    });

    const amountFmt = Number(totalNGN).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const dateStr = new Date(deliveredAt).toLocaleString('en-NG', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos',
    });

    const accountList = Array.isArray(accounts) ? accounts : (accounts ? [accounts] : []);
    const hasStructured = accountList.length > 0 && typeof accountList[0] === 'object';

    const accountRows = accountList.map((acc, i) => {
      const fields = typeof acc === 'string'
        ? [['credentials', acc]]
        : Object.entries(acc);
      return `
        <div style="background:#0B0E18;border:1px solid #1A1D2E;border-radius:8px;padding:14px 18px;margin-bottom:10px;">
          <div style="font-size:11px;font-weight:700;color:#F0A500;letter-spacing:0.08em;margin-bottom:10px;text-transform:uppercase;">Account ${i + 1}</div>
          ${fields.map(([k, v]) => `
            <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1A1D2E;font-size:13px;">
              <span style="color:#A0A0B8;min-width:100px;">${k}</span>
              <span style="font-family:monospace;color:#E8E8F0;word-break:break-all;">${v}</span>
            </div>`).join('')}
        </div>`;
    }).join('');

    const noAccounts = accountList.length === 0;

    await transporter.sendMail({
      from: `PanelNG <${cfg.gmailUser}>`,
      to: toEmail,
      subject: `Your Order is Ready — ${productName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#06080F;color:#E8E8F0;padding:32px;border-radius:10px;">
          <div style="border-bottom:2px solid #F0A500;padding-bottom:14px;margin-bottom:24px;">
            <span style="font-size:22px;font-weight:800;color:#F0A500;letter-spacing:-0.02em;">PanelNG</span>
            <span style="font-size:13px;color:#A0A0B8;margin-left:10px;">Order Delivery</span>
          </div>

          <p style="font-size:15px;margin:0 0 20px;">Hi <strong>${toName || 'there'}</strong>, your order has been delivered!</p>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#A0A0B8;width:130px;">Product</td><td style="padding:8px 0;font-weight:600;">${productName}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Quantity</td><td style="padding:8px 0;">${quantity} account${quantity !== 1 ? 's' : ''}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Total Charged</td><td style="padding:8px 0;font-family:monospace;font-size:16px;font-weight:700;color:#F0A500;">₦${amountFmt}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Order ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px;color:#0EC97F;">${orderId}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Date</td><td style="padding:8px 0;">${dateStr}</td></tr>
          </table>

          <div style="background:#2A1A00;border:1px solid #F0A500;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#F0A500;">
            ⚠ Save these credentials now and store them securely. Do not share them.
          </div>

          <div style="margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;color:#A0A0B8;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:12px;">Your Account Credentials</div>
            ${noAccounts
              ? '<p style="color:#A0A0B8;font-size:13px;">Your order was processed. Please check your order history in the dashboard for full details.</p>'
              : accountRows}
          </div>

          <div style="background:#0B0E18;border:1px solid #1A1D2E;border-radius:8px;padding:14px 18px;font-size:12px;color:#A0A0B8;line-height:1.7;">
            PanelNG acts solely as a reseller of third-party digital accounts. We are not responsible for how purchased accounts are used after delivery. Accounts suspended due to policy violations are not eligible for refund.
          </div>
        </div>
      `,
    });

    console.log(`[mailer] Order delivery email sent to ${toEmail} for order ${orderId}`);
  } catch (err) {
    console.error('[mailer] Failed to send order delivery email:', err.message);
  }
}

module.exports = { sendPaymentNotification, sendOrderDelivery };
