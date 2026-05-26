import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Epilogue:wght@400;500;600&display=swap');

  .ve-page {
    position: fixed; inset: 0; overflow-y: auto; overflow-x: hidden;
    -webkit-overflow-scrolling: touch; overscroll-behavior: none;
    background: #F8F7F4; font-family: 'Epilogue', sans-serif;
    scroll-behavior: smooth;
  }
  .ve-inner {
    min-height: 100%; display: flex; flex-direction: column;
    align-items: center; padding: 40px 20px;
  }
  .ve-card {
    background: white; width: 100%; max-width: 440px; padding: 40px 36px;
    border-radius: 20px; border: 1px solid #E5E2D9;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06); box-sizing: border-box; text-align: center;
  }
  .ve-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 32px; text-decoration: none; }
  .ve-logo-box { width: 32px; height: 32px; background: #1C1C1A; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900; font-size: 15px; color: #F5A623; flex-shrink: 0; }
  .ve-logo-word { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 18px; color: #111110; letter-spacing: -0.3px; }
  .ve-icon { width: 64px; height: 64px; margin: 0 auto 20px; }
  .ve-circle { fill: none; stroke-width: 2; stroke-dasharray: 220; stroke-dashoffset: 220; animation: ve-draw 0.6s ease forwards; }
  .ve-check { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 50; stroke-dashoffset: 50; animation: ve-draw 0.4s ease 0.5s forwards; }
  .ve-x { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: 50; stroke-dashoffset: 50; animation: ve-draw 0.4s ease 0.3s forwards; }
  @keyframes ve-draw { to { stroke-dashoffset: 0; } }
  .ve-spin { width: 40px; height: 40px; border: 3px solid #E5E2D9; border-top-color: #C9620A; border-radius: 50%; animation: ve-spin 0.8s linear infinite; margin: 0 auto 24px; }
  @keyframes ve-spin { to { transform: rotate(360deg); } }
  .ve-heading { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 22px; color: #111110; margin: 0 0 8px; }
  .ve-sub { font-size: 14px; color: #6B6860; line-height: 1.6; margin: 0 0 24px; }
  .ve-btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border-radius: 12px; background: #1C1C1A; color: white; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px; border: none; cursor: pointer; text-decoration: none; transition: background 0.12s, transform 0.1s; width: 100%; box-sizing: border-box; }
  .ve-btn:hover { background: #111110; }
  .ve-btn:active { transform: scale(0.98); }
  .ve-btn-outline { background: transparent; border: 1px solid #E5E2D9; color: #6B6860; }
  .ve-btn-outline:hover { background: #F8F7F4; }
  .ve-resend { display: block; margin-top: 12px; font-size: 13px; color: #C9620A; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; }
  .ve-resend:disabled { opacity: 0.5; pointer-events: none; }
  @media (max-width: 500px) {
    .ve-inner { padding: 0; }
    .ve-card { border-radius: 0; border: none; box-shadow: none; padding: 32px 20px 60px; min-height: 100vh; }
  }
`;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();

  const [state, setState] = useState('loading'); // loading | success | error | expired
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);
  const [expiredEmail, setExpiredEmail] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setState('error');
      setErrorMsg('No verification token found in this link.');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(({ data }) => {
        localStorage.setItem('panelng_token', data.token);
        localStorage.setItem('panelng_user', JSON.stringify(data.user));
        updateUser(data.user);
        setState('success');
      })
      .catch((err) => {
        const code = err.response?.data?.code;
        const msg = err.response?.data?.error || 'Verification failed.';
        if (code === 'TOKEN_EXPIRED') {
          setExpiredEmail(err.response?.data?.email || '');
          setState('expired');
        } else {
          setErrorMsg(msg);
          setState('error');
        }
      });
  }, []);

  const handleResend = async () => {
    const email = expiredEmail;
    if (!email) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setState('resent');
    } catch {
      // ignore — backend always returns 200
      setState('resent');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="ve-page">
        <div className="ve-inner">
          <div className="ve-card">
            <Link to="/" className="ve-logo">
              <div className="ve-logo-box">P</div>
              <span className="ve-logo-word">PanelNG</span>
            </Link>

            {state === 'loading' && (
              <>
                <div className="ve-spin" />
                <h1 className="ve-heading">Verifying your email…</h1>
                <p className="ve-sub">Please wait a moment.</p>
              </>
            )}

            {state === 'success' && (
              <>
                <svg className="ve-icon" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" className="ve-circle" stroke="#16A34A" />
                  <polyline points="20 33 29 42 44 26" className="ve-check" stroke="#16A34A" />
                </svg>
                <h1 className="ve-heading">Email verified!</h1>
                <p className="ve-sub">Your account is now active. You're ready to start using PanelNG.</p>
                <button className="ve-btn" onClick={() => navigate('/dashboard')}>Go to Dashboard →</button>
              </>
            )}

            {state === 'error' && (
              <>
                <svg className="ve-icon" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" className="ve-circle" stroke="#DC2626" />
                  <line x1="22" y1="22" x2="42" y2="42" className="ve-x" stroke="#DC2626" />
                  <line x1="42" y1="22" x2="22" y2="42" className="ve-x" stroke="#DC2626" />
                </svg>
                <h1 className="ve-heading">Verification failed</h1>
                <p className="ve-sub">{errorMsg} The link may be invalid or already used.</p>
                <Link to="/register" className="ve-btn ve-btn-outline" style={{ marginBottom: 0 }}>Back to Sign Up</Link>
              </>
            )}

            {state === 'expired' && (
              <>
                <svg className="ve-icon" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" className="ve-circle" stroke="#F5A623" />
                  <line x1="32" y1="20" x2="32" y2="34" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="32" cy="42" r="1.5" fill="#F5A623" />
                </svg>
                <h1 className="ve-heading">Link expired</h1>
                <p className="ve-sub">This verification link has expired. Request a new one and check your inbox.</p>
                <button className="ve-btn" onClick={handleResend} disabled={resending}>
                  {resending ? 'Sending…' : 'Resend verification email'}
                </button>
              </>
            )}

            {state === 'resent' && (
              <>
                <svg className="ve-icon" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" className="ve-circle" stroke="#16A34A" />
                  <polyline points="20 33 29 42 44 26" className="ve-check" stroke="#16A34A" />
                </svg>
                <h1 className="ve-heading">New link sent!</h1>
                <p className="ve-sub">Check your inbox for a fresh verification email. It expires in 24 hours.</p>
                <Link to="/login" className="ve-btn ve-btn-outline">Back to Login</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
