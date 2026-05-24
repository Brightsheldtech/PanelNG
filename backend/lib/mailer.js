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

module.exports = { sendPaymentNotification };
