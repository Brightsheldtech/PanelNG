const { Resend } = require('resend');
const supabase = require('./supabase');

const FROM = 'PanelNG <onboarding@resend.dev>';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function getEmailConfig() {
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['admin_email']);

  const s = {};
  (data || []).forEach((row) => { s[row.key] = row.value; });

  return {
    adminEmail: s.admin_email || process.env.ADMIN_EMAIL,
  };
}

async function sendPaymentNotification({ fullName, email, amount, reference, createdAt }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[mailer] RESEND_API_KEY not set — skipping admin notification');
      return;
    }
    const cfg = await getEmailConfig();
    if (!cfg.adminEmail) {
      console.warn('[mailer] admin_email not configured — skipping admin notification');
      return;
    }

    const resend = getResend();
    const timeStr = new Date(createdAt).toLocaleString('en-NG', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos',
    });
    const amountFmt = Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    await resend.emails.send({
      from: FROM,
      to: [cfg.adminEmail],
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
    if (!process.env.RESEND_API_KEY) return;
    const resend = getResend();
    const amountFmt = Number(totalNGN).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const dateStr = new Date(deliveredAt).toLocaleString('en-NG', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos',
    });
    const accountList = Array.isArray(accounts) ? accounts : (accounts ? [accounts] : []);

    const accountRows = accountList.map((acc, i) => {
      const fields = typeof acc === 'string' ? [['credentials', acc]] : Object.entries(acc);
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

    await resend.emails.send({
      from: FROM,
      to: [toEmail],
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
            Save these credentials now and store them securely. Do not share them.
          </div>
          <div style="margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;color:#A0A0B8;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:12px;">Your Account Credentials</div>
            ${accountList.length === 0
              ? '<p style="color:#A0A0B8;font-size:13px;">Your order was processed. Please check your order history in the dashboard for full details.</p>'
              : accountRows}
          </div>
          <div style="background:#0B0E18;border:1px solid #1A1D2E;border-radius:8px;padding:14px 18px;font-size:12px;color:#A0A0B8;line-height:1.7;">
            PanelNG acts solely as a reseller of third-party digital accounts. We are not responsible for how purchased accounts are used after delivery.
          </div>
        </div>
      `,
    });
    console.log(`[mailer] Order delivery email sent to ${toEmail} for order ${orderId}`);
  } catch (err) {
    console.error('[mailer] Failed to send order delivery email:', err.message);
  }
}

async function sendPaymentConfirmed({ toEmail, toName, amount, reference, confirmedAt }) {
  try {
    if (!process.env.RESEND_API_KEY) return;
    const resend = getResend();
    const amountFmt = Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const timeStr = new Date(confirmedAt).toLocaleString('en-NG', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos',
    });

    await resend.emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Wallet Credited — ₦${amountFmt} | PanelNG`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#06080F;color:#E8E8F0;padding:32px;border-radius:10px;">
          <div style="border-bottom:2px solid #F0A500;padding-bottom:14px;margin-bottom:24px;">
            <span style="font-size:20px;font-weight:800;color:#F0A500;letter-spacing:-0.02em;">PanelNG</span>
            <span style="font-size:13px;color:#A0A0B8;margin-left:10px;">Payment Confirmed</span>
          </div>
          <p style="font-size:15px;margin:0 0 20px;">Hi <strong>${toName || 'there'}</strong>, your wallet has been credited!</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:10px 0;color:#A0A0B8;width:150px;">Reference</td><td style="padding:10px 0;font-family:monospace;font-size:15px;font-weight:700;color:#0EC97F;">${reference}</td></tr>
            <tr>
              <td style="padding:10px 0;color:#A0A0B8;">Amount Credited</td>
              <td style="padding:10px 0;font-family:monospace;font-size:22px;font-weight:800;color:#0EC97F;">₦${amountFmt}</td>
            </tr>
            <tr><td style="padding:10px 0;color:#A0A0B8;">Confirmed At</td><td style="padding:10px 0;">${timeStr}</td></tr>
          </table>
          <div style="margin-top:20px;padding:14px 18px;background:#0B0E18;border-radius:6px;font-size:13px;color:#A0A0B8;border:1px solid #1A1D2E;">
            Your wallet balance has been updated. Log in to start placing orders.
          </div>
        </div>
      `,
    });
    console.log(`[mailer] Payment confirmed email sent to ${toEmail} for ${reference}`);
  } catch (err) {
    console.error('[mailer] Failed to send payment confirmed email:', err.message);
  }
}

async function sendPaymentRejected({ toEmail, toName, amount, reference, reason }) {
  try {
    if (!process.env.RESEND_API_KEY) return;
    const resend = getResend();
    const amountFmt = Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    await resend.emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Payment Request Rejected — ${reference} | PanelNG`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#06080F;color:#E8E8F0;padding:32px;border-radius:10px;">
          <div style="border-bottom:2px solid #F87171;padding-bottom:14px;margin-bottom:24px;">
            <span style="font-size:20px;font-weight:800;color:#F0A500;letter-spacing:-0.02em;">PanelNG</span>
            <span style="font-size:13px;color:#A0A0B8;margin-left:10px;">Payment Not Confirmed</span>
          </div>
          <p style="font-size:15px;margin:0 0 20px;">Hi <strong>${toName || 'there'}</strong>, your payment request could not be confirmed.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:10px 0;color:#A0A0B8;width:150px;">Reference</td><td style="padding:10px 0;font-family:monospace;font-size:15px;font-weight:700;color:#F87171;">${reference}</td></tr>
            <tr><td style="padding:10px 0;color:#A0A0B8;">Amount</td><td style="padding:10px 0;font-family:monospace;font-size:18px;font-weight:700;color:#E8E8F0;">₦${amountFmt}</td></tr>
            ${reason ? `<tr><td style="padding:10px 0;color:#A0A0B8;vertical-align:top;">Reason</td><td style="padding:10px 0;color:#F87171;">${reason}</td></tr>` : ''}
          </table>
          <div style="margin-top:20px;padding:14px 18px;background:#2A0A0A;border-radius:6px;font-size:13px;color:#F87171;border:1px solid rgba(248,113,113,.2);">
            If you believe this is an error, contact support with your transfer receipt and reference code.
          </div>
        </div>
      `,
    });
    console.log(`[mailer] Payment rejected email sent to ${toEmail} for ${reference}`);
  } catch (err) {
    console.error('[mailer] Failed to send payment rejected email:', err.message);
  }
}

async function sendRefundNotification({ toEmail, toName, amount, reason }) {
  try {
    if (!process.env.RESEND_API_KEY) return;
    const resend = getResend();
    const amountFmt = Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    await resend.emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Refund Processed — ₦${amountFmt} | PanelNG`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#06080F;color:#E8E8F0;padding:32px;border-radius:10px;">
          <div style="border-bottom:2px solid #F0A500;padding-bottom:14px;margin-bottom:24px;">
            <span style="font-size:20px;font-weight:800;color:#F0A500;letter-spacing:-0.02em;">PanelNG</span>
            <span style="font-size:13px;color:#A0A0B8;margin-left:10px;">Refund Processed</span>
          </div>
          <p style="font-size:15px;margin:0 0 20px;">Hi <strong>${toName || 'there'}</strong>, a refund has been credited to your wallet.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;color:#A0A0B8;width:150px;">Amount Refunded</td>
              <td style="padding:10px 0;font-family:monospace;font-size:22px;font-weight:800;color:#0EC97F;">₦${amountFmt}</td>
            </tr>
            ${reason ? `<tr><td style="padding:10px 0;color:#A0A0B8;vertical-align:top;">Reason</td><td style="padding:10px 0;">${reason}</td></tr>` : ''}
          </table>
          <div style="margin-top:20px;padding:14px 18px;background:#0B0E18;border-radius:6px;font-size:13px;color:#A0A0B8;border:1px solid #1A1D2E;">
            Your wallet balance has been updated. Log in to use your credit on a new order.
          </div>
        </div>
      `,
    });
    console.log(`[mailer] Refund notification sent to ${toEmail}`);
  } catch (err) {
    console.error('[mailer] Failed to send refund notification:', err.message);
  }
}

async function sendSupportNotification({ adminEmail, convId, customerName, customerEmail, message, dashboardUrl }) {
  try {
    if (!process.env.RESEND_API_KEY || !adminEmail) return;
    const resend = getResend();
    const shortId = convId.slice(0, 8).toUpperCase();
    const preview = message.length > 120 ? message.slice(0, 120) + '…' : message;

    await resend.emails.send({
      from: FROM,
      to: [adminEmail],
      subject: `[Support #${shortId}] ${customerName}: ${preview}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#06080F;color:#E8E8F0;padding:32px;border-radius:10px;">
          <div style="border-bottom:2px solid #F0A500;padding-bottom:14px;margin-bottom:24px;">
            <span style="font-size:20px;font-weight:800;color:#F0A500;letter-spacing:-0.02em;">PanelNG</span>
            <span style="font-size:13px;color:#A0A0B8;margin-left:10px;">Support Message</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <tr><td style="padding:8px 0;color:#A0A0B8;width:130px;">Customer</td><td style="padding:8px 0;font-weight:600;">${customerName}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Email</td><td style="padding:8px 0;">${customerEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#A0A0B8;">Ref</td><td style="padding:8px 0;font-family:monospace;font-size:12px;color:#0EC97F;">#${shortId}</td></tr>
          </table>
          <div style="background:#0F1520;border:1px solid #1A1D2E;border-left:3px solid #F0A500;border-radius:6px;padding:16px 18px;font-size:14px;line-height:1.7;color:#E8E8F0;margin-bottom:22px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          ${dashboardUrl ? `<a href="${dashboardUrl}" style="display:inline-block;padding:10px 20px;background:#F0A500;color:#06080F;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">Open in Dashboard</a>` : ''}
        </div>
      `,
    });
    console.log(`[mailer] Support notification sent for conv ${convId}`);
  } catch (err) {
    console.error('[mailer] Failed to send support notification:', err.message);
  }
}

module.exports = {
  getEmailConfig,
  sendPaymentNotification,
  sendOrderDelivery,
  sendPaymentConfirmed,
  sendPaymentRejected,
  sendRefundNotification,
  sendSupportNotification,
};
