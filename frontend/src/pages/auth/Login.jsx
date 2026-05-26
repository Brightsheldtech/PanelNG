import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';

function Icon({ name, size = 16, color = '#A8A49C' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', display: 'block', flexShrink: 0 };
  switch (name) {
    case 'user': return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'lock': return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'eye': return <svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off': return <svg {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
    case 'check': return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
    default: return null;
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Epilogue:wght@400;500;600&display=swap');

  html { scroll-behavior: smooth; }

  .al-page {
    position: fixed; inset: 0; overflow-y: auto; overflow-x: hidden;
    -webkit-overflow-scrolling: touch; overscroll-behavior: none;
    background: #F8F7F4; font-family: 'Epilogue', sans-serif;
    scroll-behavior: smooth;
  }
  .al-inner {
    min-height: 100%; display: flex; flex-direction: column;
    align-items: center; padding: 40px 20px;
  }
  .al-card { background: white; width: 100%; max-width: 440px; padding: 40px 36px; border-radius: 20px; border: 1px solid #E5E2D9; box-shadow: 0 4px 24px rgba(0,0,0,0.06); box-sizing: border-box; }
  .al-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 28px; text-decoration: none; }
  .al-logo-box { width: 32px; height: 32px; background: #1C1C1A; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900; font-size: 15px; color: #F5A623; flex-shrink: 0; }
  .al-logo-word { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 18px; color: #111110; letter-spacing: -0.3px; }
  .al-heading { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 22px; color: #111110; margin: 0 0 6px; }
  .al-sub { font-size: 14px; color: #6B6860; margin: 0 0 28px; }
  .al-sub a { color: #C9620A; font-weight: 600; text-decoration: none; }
  .al-google-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 13px 20px; border-radius: 12px; background: white; border: 1px solid #E5E2D9; font-family: 'Epilogue', sans-serif; font-weight: 600; font-size: 14px; color: #111110; cursor: pointer; transition: background 0.15s, border-color 0.15s, transform 0.1s; margin-bottom: 20px; box-sizing: border-box; }
  .al-google-btn:hover { background: #F8F7F4; border-color: #CCC9C0; }
  .al-google-btn:active { transform: scale(0.98); }
  .al-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .al-divider-line { flex: 1; height: 1px; background: #E5E2D9; }
  .al-divider-text { font-size: 12px; color: #A8A49C; }
  .al-fields { display: flex; flex-direction: column; gap: 14px; }
  .al-field label { display: block; font-size: 12px; font-weight: 500; color: #6B6860; margin-bottom: 5px; }
  .al-input-wrap { position: relative; display: flex; align-items: center; }
  .al-input-icon { position: absolute; left: 14px; pointer-events: none; }
  .al-input {
    width: 100%; padding: 12px 14px 12px 42px; border-radius: 11px; border: 1px solid #E5E2D9;
    background: #FAFAF8; font-family: 'Epilogue', sans-serif; font-size: 16px; color: #111110;
    outline: none; transition: border-color 0.15s, background 0.15s; box-sizing: border-box;
    -webkit-appearance: none; appearance: none; max-width: 100%;
  }
  .al-input::placeholder { color: #A8A49C; }
  .al-input:focus { border-color: #C9620A; background: white; }
  .al-input-right { position: absolute; right: 14px; cursor: pointer; background: none; border: none; padding: 0; display: flex; color: #A8A49C; }
  .al-row { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
  .al-remember { display: flex; align-items: center; gap: 8px; }
  .al-checkbox { width: 18px; height: 18px; border-radius: 5px; border: 1px solid #E5E2D9; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.15s, border-color 0.15s; }
  .al-checkbox.checked { background: #1C1C1A; border-color: #1C1C1A; }
  .al-remember-text { font-size: 13px; color: #6B6860; }
  .al-forgot { font-size: 13px; color: #C9620A; font-weight: 600; cursor: pointer; text-decoration: none; background: none; border: none; padding: 0; }
  .al-submit { margin-top: 20px; width: 100%; padding: 14px; border-radius: 12px; background: #1C1C1A; color: white; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.12s, transform 0.1s; box-sizing: border-box; }
  .al-submit:hover:not(:disabled) { background: #111110; }
  .al-submit:active:not(:disabled) { transform: scale(0.98); }
  .al-submit:disabled { opacity: 0.5; pointer-events: none; }
  .al-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: al-spin 0.7s linear infinite; flex-shrink: 0; }
  @keyframes al-spin { to { transform: rotate(360deg); } }
  .al-error-banner { margin-top: 12px; padding: 12px 14px; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 10px; font-size: 13px; color: #DC2626; line-height: 1.5; }
  .al-resend-link { display: block; margin-top: 8px; font-size: 13px; color: #C9620A; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; }
  .al-resend-link:disabled { opacity: 0.5; pointer-events: none; }
  @media (max-width: 500px) {
    .al-inner { padding: 0; }
    .al-card { border-radius: 0; border: none; box-shadow: none; padding: 32px 20px 60px; min-height: 100vh; }
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const handleInputFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setLoading(true);
    setError('');
    setErrorCode('');
    setUnverifiedEmail('');
    try {
      const user = await login(identifier.trim(), password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const code = err.response?.data?.code || '';
      const msg = err.response?.data?.error || '';
      setErrorCode(code);
      if (code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(err.response?.data?.email || identifier.trim());
        setError('Please verify your email before logging in.');
      } else if (code === 'ACCOUNT_SUSPENDED') {
        setError('Your account has been suspended. Contact support.');
      } else if (msg.includes('Invalid') || msg.includes('incorrect')) {
        setError('Email/username or password is incorrect.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabase) { alert('Google sign-in is not configured yet.'); return; }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try { await api.post('/auth/resend-verification', { email: unverifiedEmail }); } catch { /* ignore */ }
    setResending(false);
    setError('Verification email sent! Check your inbox.');
    setErrorCode('');
  };

  const isValid = identifier.trim().length > 0 && password.length > 0;

  return (
    <>
      <style>{css}</style>
      <div className="al-page">
        <div className="al-inner">
          <div className="al-card">
            <Link to="/" className="al-logo">
              <div className="al-logo-box">P</div>
              <span className="al-logo-word">PanelNG</span>
            </Link>

            <h1 className="al-heading">Welcome back</h1>
            <p className="al-sub">Don't have an account? <Link to="/register">Sign up</Link></p>

            <button className="al-google-btn" type="button" onClick={handleGoogle}>
              <GoogleIcon /> Continue with Google
            </button>

            <div className="al-divider">
              <div className="al-divider-line" />
              <span className="al-divider-text">or</span>
              <div className="al-divider-line" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="al-fields">
                <div className="al-field">
                  <label>Email or Username</label>
                  <div className="al-input-wrap">
                    <span className="al-input-icon"><Icon name="user" /></span>
                    <input className="al-input" type="text" placeholder="Email address or username" value={identifier} onChange={e => { setIdentifier(e.target.value); setError(''); setErrorCode(''); }} onFocus={handleInputFocus} autoComplete="username" autoFocus />
                  </div>
                </div>

                <div className="al-field">
                  <label>Password</label>
                  <div className="al-input-wrap">
                    <span className="al-input-icon"><Icon name="lock" /></span>
                    <input className="al-input" type={showPw ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => { setPassword(e.target.value); setError(''); setErrorCode(''); }} onFocus={handleInputFocus} style={{ paddingRight: 42 }} autoComplete="current-password" />
                    <button type="button" className="al-input-right" onClick={() => setShowPw(v => !v)}>
                      <Icon name={showPw ? 'eye-off' : 'eye'} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="al-row">
                <div className="al-remember">
                  <div className={`al-checkbox${remember ? ' checked' : ''}`} onClick={() => setRemember(v => !v)} role="checkbox" aria-checked={remember}>
                    {remember && <Icon name="check" size={11} color="white" />}
                  </div>
                  <span className="al-remember-text">Remember me</span>
                </div>
                <Link to="/forgot-password" className="al-forgot">Forgot password?</Link>
              </div>

              <button type="submit" className="al-submit" disabled={loading || !isValid}>
                {loading ? <><span className="al-spinner" /> Signing in…</> : 'Sign In'}
              </button>

              {error && (
                <div className="al-error-banner">
                  {error}
                  {errorCode === 'EMAIL_NOT_VERIFIED' && (
                    <button className="al-resend-link" type="button" onClick={handleResendVerification} disabled={resending}>
                      {resending ? 'Sending…' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
