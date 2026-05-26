import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

function Icon({ name, size = 16, color = '#A8A49C' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', display: 'block', flexShrink: 0 };
  switch (name) {
    case 'mail': return <svg {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
    case 'chevron-left': return <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>;
    default: return null;
  }
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Epilogue:wght@400;500;600&display=swap');

  .fp-page { min-height: 100vh; background: #F8F7F4; display: flex; align-items: center; justify-content: center; padding: 40px 20px; font-family: 'Epilogue', sans-serif; }
  .fp-card { background: white; width: 100%; max-width: 440px; padding: 40px 36px; border-radius: 20px; border: 1px solid #E5E2D9; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .fp-back { display: flex; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 24px; text-decoration: none; background: none; border: none; padding: 0; }
  .fp-back-text { font-size: 13px; color: #6B6860; }
  .fp-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 28px; text-decoration: none; }
  .fp-logo-box { width: 32px; height: 32px; background: #1C1C1A; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900; font-size: 15px; color: #F5A623; flex-shrink: 0; }
  .fp-logo-word { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 18px; color: #111110; letter-spacing: -0.3px; }
  .fp-heading { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 22px; color: #111110; margin: 0 0 6px; }
  .fp-sub { font-size: 14px; color: #6B6860; margin: 0 0 28px; line-height: 1.6; }
  .fp-field label { display: block; font-size: 12px; font-weight: 500; color: #6B6860; margin-bottom: 5px; }
  .fp-input-wrap { position: relative; display: flex; align-items: center; }
  .fp-input-icon { position: absolute; left: 14px; pointer-events: none; }
  .fp-input { width: 100%; padding: 12px 14px 12px 42px; border-radius: 11px; border: 1px solid #E5E2D9; background: #FAFAF8; font-family: 'Epilogue', sans-serif; font-size: 14px; color: #111110; outline: none; transition: border-color 0.15s, background 0.15s; }
  .fp-input::placeholder { color: #A8A49C; }
  .fp-input:focus { border-color: #C9620A; background: white; }
  .fp-submit { margin-top: 20px; width: 100%; padding: 14px; border-radius: 12px; background: #1C1C1A; color: white; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.12s, transform 0.1s; }
  .fp-submit:hover:not(:disabled) { background: #111110; }
  .fp-submit:disabled { opacity: 0.5; pointer-events: none; }
  .fp-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: fp-spin 0.7s linear infinite; flex-shrink: 0; }
  @keyframes fp-spin { to { transform: rotate(360deg); } }
  .fp-error { margin-top: 12px; padding: 12px 14px; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 10px; font-size: 13px; color: #DC2626; }
  .fp-success-wrap { text-align: center; }
  .fp-success-circle { width: 48px; height: 48px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
  .fp-circ { fill: none; stroke: #16A34A; stroke-width: 2; stroke-dasharray: 150; stroke-dashoffset: 150; animation: fp-draw 0.5s ease forwards; }
  .fp-chk { fill: none; stroke: #16A34A; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 30; stroke-dashoffset: 30; animation: fp-draw 0.3s ease 0.4s forwards; }
  @keyframes fp-draw { to { stroke-dashoffset: 0; } }
  .fp-success-heading { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 20px; color: #111110; margin: 0 0 8px; }
  .fp-success-text { font-size: 14px; color: #6B6860; line-height: 1.6; margin: 0 0 16px; }
  .fp-resend { font-size: 13px; color: #C9620A; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; }
  @media (max-width: 500px) {
    .fp-page { padding: 0; align-items: flex-start; }
    .fp-card { border-radius: 0; border: none; box-shadow: none; min-height: 100vh; padding: 32px 20px; }
  }
`;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    try { await api.post('/auth/forgot-password', { email: email.trim() }); } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="fp-page">
        <div className="fp-card">
          <Link to="/login" className="fp-back">
            <Icon name="chevron-left" size={16} color="#A8A49C" />
            <span className="fp-back-text">Back to login</span>
          </Link>

          <Link to="/" className="fp-logo">
            <div className="fp-logo-box">P</div>
            <span className="fp-logo-word">PanelNG</span>
          </Link>

          {!sent ? (
            <>
              <h1 className="fp-heading">Reset your password</h1>
              <p className="fp-sub">Enter your email address and we will send you a reset link.</p>
              <form onSubmit={handleSubmit} noValidate>
                <div className="fp-field">
                  <label>Email Address</label>
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon"><Icon name="mail" /></span>
                    <input className="fp-input" type="email" placeholder="Your email address" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} autoFocus />
                  </div>
                </div>
                <button type="submit" className="fp-submit" disabled={loading || !email.trim()}>
                  {loading ? <><span className="fp-spinner" /> Sending…</> : 'Send Reset Link'}
                </button>
                {error && <div className="fp-error">{error}</div>}
              </form>
            </>
          ) : (
            <div className="fp-success-wrap">
              <div className="fp-success-circle">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle className="fp-circ" cx="24" cy="24" r="22" />
                  <polyline className="fp-chk" points="13,25 20,32 35,17" />
                </svg>
              </div>
              <h2 className="fp-success-heading">Check your inbox</h2>
              <p className="fp-success-text">
                We sent a reset link to <strong>{email}</strong>. Check your spam folder if you don't see it.
              </p>
              <button className="fp-resend" onClick={resend} disabled={loading}>
                {loading ? 'Resending…' : 'Resend email'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
