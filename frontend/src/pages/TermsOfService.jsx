import { useNavigate, Link } from 'react-router-dom';

function Icon({ name, size = 16, color = '#A8A49C' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', display: 'block', flexShrink: 0 };
  switch (name) {
    case 'chevron-left': return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    case 'arrow-right': return <svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    default: return null;
  }
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Epilogue:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  .tos-page { background: #F8F7F4; min-height: 100vh; font-family: 'Epilogue', sans-serif; }
  .tos-inner { max-width: 720px; margin: 0 auto; padding: 80px 40px; }
  .tos-back { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 32px; text-decoration: none; }
  .tos-back-text { font-size: 13px; color: #6B6860; }
  .tos-header { background: white; border-radius: 16px; padding: 32px; margin-bottom: 40px; border: 1px solid #E5E2D9; }
  .tos-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9620A; margin-bottom: 8px; font-family: 'Epilogue', sans-serif; }
  .tos-title { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: clamp(28px, 5vw, 40px); letter-spacing: -1px; color: #111110; margin: 0 0 8px; }
  .tos-updated { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #A8A49C; margin: 0; }
  .tos-section-num { font-size: 13px; font-weight: 700; color: #C9620A; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10px; margin-top: 36px; }
  .tos-body { font-family: 'Epilogue', sans-serif; font-size: 15px; line-height: 1.8; color: #4A4844; margin: 0; }
  .tos-list { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 6px; }
  .tos-list li { padding-left: 20px; position: relative; font-size: 15px; line-height: 1.8; color: #4A4844; }
  .tos-list li::before { content: "—"; position: absolute; left: 0; color: #F5A623; }
  .tos-cta { background: white; border-radius: 16px; padding: 28px; text-align: center; margin-top: 48px; border: 1px solid #E5E2D9; }
  .tos-cta-text { font-size: 14px; color: #6B6860; line-height: 1.6; margin: 0 0 16px; }
  .tos-cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 12px; background: #1C1C1A; color: white; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px; text-decoration: none; transition: background 0.15s; border: none; cursor: pointer; }
  .tos-cta-btn:hover { background: #111110; }
  @media (max-width: 600px) {
    .tos-inner { padding: 40px 20px; }
  }
`;

const sections = [
  {
    num: '01 — Introduction',
    body: 'Welcome to PanelNG. These Terms of Service govern your access to and use of the PanelNG platform, including our website, mobile application and all services (collectively, the Platform). By creating an account or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use our services.',
  },
  {
    num: '02 — Eligibility',
    body: 'To use PanelNG, you must:',
    list: [
      'Be at least 18 years old, or have parental or guardian consent if you are between 13 and 17 years old.',
      'Provide accurate and complete registration information.',
      'Not be barred from using the service under applicable law.',
    ],
  },
  {
    num: '03 — Account Responsibility',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account. PanelNG is not liable for any loss or damage arising from unauthorised access to your account. You must notify us immediately at support@panelng.com if you suspect any unauthorised use.',
  },
  {
    num: '04 — Wallet and Payments',
    body: 'PanelNG operates a prepaid Naira wallet system. All transactions are processed in Nigerian Naira (NGN). Wallet funds are non-refundable except in cases of service failure on our part. Minimum top-up amount may apply. PanelNG uses Flutterwave for payment processing. By funding your wallet you agree to Flutterwave\'s terms of service. PanelNG reserves the right to freeze or suspend a wallet if fraudulent activity is suspected.',
  },
  {
    num: '05 — SMM Services',
    body: 'SMM services (followers, likes, views, comments and similar) are sourced from third-party providers. PanelNG does not guarantee specific results or permanence of delivered services. Orders cannot be cancelled once processing has begun. Refills are available for eligible services within the stated refill period. Using SMM services to violate the terms of any social media platform is your sole responsibility.',
  },
  {
    num: '06 — SMS Verification',
    body: 'Virtual numbers provided through the SMS Verify service are temporary and for one-time use. PanelNG does not guarantee OTP delivery for all platforms or countries. Automatic refunds are issued if no OTP is received within 20 minutes. Virtual numbers must not be used for illegal activities or to circumvent platform security policies.',
  },
  {
    num: '07 — Account Purchases',
    body: 'Social media accounts sold through PanelNG are sourced from third-party suppliers. PanelNG provides a replacement guarantee for accounts that become inaccessible within 24 hours of delivery, subject to verification. Accounts must not be used for spam, fraud, impersonation or any activity that violates applicable laws.',
  },
  {
    num: '08 — Referral Program',
    body: 'The PanelNG referral program allows users to earn wallet credits by referring new users. Commission rates and bonus amounts are set by PanelNG and may change at any time with reasonable notice. Referral credits have no cash value and can only be used within the Platform. Self-referral, fake account creation or any manipulation of the referral system will result in immediate account termination and forfeiture of all credits.',
  },
  {
    num: '09 — Prohibited Conduct',
    body: 'You must not use PanelNG to:',
    list: [
      'Violate any applicable law or regulation.',
      'Engage in fraud, money laundering or other financial crimes.',
      'Attempt to reverse-engineer, hack or disrupt the Platform.',
      'Create multiple accounts to abuse promotional credits or the referral system.',
      'Resell or redistribute PanelNG services without prior written permission.',
    ],
  },
  {
    num: '10 — Termination',
    body: 'PanelNG reserves the right to suspend or terminate your account at any time if you violate these Terms. On termination, your wallet balance may be forfeited if the termination was caused by a violation on your part. You may close your account at any time by contacting support@panelng.com.',
  },
  {
    num: '11 — Limitation of Liability',
    body: 'PanelNG is not liable for any indirect, incidental, consequential or punitive damages arising from your use of the Platform. Our total liability in any matter is limited to the amount in your PanelNG wallet at the time of the claim.',
  },
  {
    num: '12 — Changes to Terms',
    body: 'PanelNG may update these Terms at any time. We will notify you of significant changes via email or an in-app notice. Continued use of the Platform after changes constitutes acceptance of the new Terms.',
  },
  {
    num: '13 — Contact',
    body: 'For questions about these Terms, contact us at support@panelng.com.',
  },
];

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <>
      <style>{css}</style>
      <div className="tos-page">
        <div className="tos-inner">
          <button className="tos-back" onClick={() => navigate(-1)}>
            <Icon name="chevron-left" />
            <span className="tos-back-text">Back</span>
          </button>

          <div className="tos-header">
            <div className="tos-label">Legal</div>
            <h1 className="tos-title">Terms of Service</h1>
            <p className="tos-updated">Last updated: May 2026</p>
          </div>

          {sections.map(({ num, body, list }) => (
            <div key={num}>
              <div className="tos-section-num">{num}</div>
              <p className="tos-body">{body}</p>
              {list && (
                <ul className="tos-list">
                  {list.map(item => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}

          <div className="tos-cta">
            <p className="tos-cta-text">By creating an account on PanelNG, you confirm that you have read and agree to these Terms of Service.</p>
            <Link to="/register" className="tos-cta-btn">
              Create Free Account&nbsp;<Icon name="arrow-right" size={16} color="white" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
