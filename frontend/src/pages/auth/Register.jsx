import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function Icon({ name, size = 16, color = '#A8A49C' }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', display: 'block', flexShrink: 0 };
  switch (name) {
    case 'user': return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'at': return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>;
    case 'mail': return <svg {...props}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
    case 'phone': return <svg {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
    case 'gift': return <svg {...props}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case 'lock': return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'eye': return <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off': return <svg {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
    case 'check': return <svg {...props}><polyline points="20 6 9 17 4 12"/></svg>;
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

const COUNTRY_CODES = [
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Senegal' },
  { code: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+244', flag: '🇦🇴', name: 'Angola' },
  { code: '+243', flag: '🇨🇩', name: 'DR Congo' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: '+264', flag: '🇳🇦', name: 'Namibia' },
  { code: '+249', flag: '🇸🇩', name: 'Sudan' },
  { code: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: '+229', flag: '🇧🇯', name: 'Benin' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+257', flag: '🇧🇮', name: 'Burundi' },
  { code: '+235', flag: '🇹🇩', name: 'Chad' },
  { code: '+269', flag: '🇰🇲', name: 'Comoros' },
  { code: '+253', flag: '🇩🇯', name: 'Djibouti' },
  { code: '+240', flag: '🇬🇶', name: 'Eq. Guinea' },
  { code: '+291', flag: '🇪🇷', name: 'Eritrea' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+220', flag: '🇬🇲', name: 'Gambia' },
  { code: '+224', flag: '🇬🇳', name: 'Guinea' },
  { code: '+245', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+231', flag: '🇱🇷', name: 'Liberia' },
  { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+222', flag: '🇲🇷', name: 'Mauritania' },
  { code: '+230', flag: '🇲🇺', name: 'Mauritius' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+232', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: '+252', flag: '🇸🇴', name: 'Somalia' },
  { code: '+268', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
];

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#F87171', '#FB923C', '#F5A623', '#16A34A'];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@700;800;900&family=Epilogue:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  html { scroll-behavior: smooth; }

  .ar-page {
    position: fixed; inset: 0; overflow-y: auto; overflow-x: hidden;
    -webkit-overflow-scrolling: touch; overscroll-behavior: none;
    background: #F8F7F4; font-family: 'Epilogue', sans-serif;
    scroll-behavior: smooth;
  }
  .ar-inner {
    min-height: 100%; display: flex; flex-direction: column;
    align-items: center; padding: 40px 20px;
  }
  .ar-card { background: white; width: 100%; max-width: 440px; padding: 40px 36px; border-radius: 20px; border: 1px solid #E5E2D9; box-shadow: 0 4px 24px rgba(0,0,0,0.06); box-sizing: border-box; }
  .ar-logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 28px; text-decoration: none; }
  .ar-logo-box { width: 32px; height: 32px; background: #1C1C1A; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900; font-size: 15px; color: #F5A623; flex-shrink: 0; }
  .ar-logo-word { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 800; font-size: 18px; color: #111110; letter-spacing: -0.3px; }
  .ar-heading { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 22px; color: #111110; margin: 0 0 6px; }
  .ar-sub { font-size: 14px; color: #6B6860; margin: 0 0 28px; }
  .ar-sub a { color: #C9620A; font-weight: 600; text-decoration: none; }
  .ar-google-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 13px 20px; border-radius: 12px; background: white; border: 1px solid #E5E2D9; font-family: 'Epilogue', sans-serif; font-weight: 600; font-size: 14px; color: #111110; cursor: pointer; transition: background 0.15s, border-color 0.15s, transform 0.1s; margin-bottom: 20px; box-sizing: border-box; }
  .ar-google-btn:hover { background: #F8F7F4; border-color: #CCC9C0; }
  .ar-google-btn:active { transform: scale(0.98); }
  .ar-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .ar-divider-line { flex: 1; height: 1px; background: #E5E2D9; }
  .ar-divider-text { font-size: 12px; color: #A8A49C; }
  .ar-fields { display: flex; flex-direction: column; gap: 14px; }
  .ar-field label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #6B6860; margin-bottom: 5px; }
  .ar-input-wrap { position: relative; display: flex; align-items: center; }
  .ar-input-icon { position: absolute; left: 14px; pointer-events: none; }
  .ar-input {
    width: 100%; padding: 12px 14px 12px 42px; border-radius: 11px; border: 1px solid #E5E2D9;
    background: #FAFAF8; font-family: 'Epilogue', sans-serif; font-size: 16px; color: #111110;
    outline: none; transition: border-color 0.15s, background 0.15s; box-sizing: border-box;
    -webkit-appearance: none; appearance: none; max-width: 100%;
  }
  .ar-input::placeholder { color: #A8A49C; }
  .ar-input:focus { border-color: #C9620A; background: white; }
  .ar-input.has-error { border-color: #DC2626 !important; }
  .ar-input-right { position: absolute; right: 14px; cursor: pointer; background: none; border: none; padding: 0; display: flex; color: #A8A49C; }
  .ar-note { font-size: 11px; color: #A8A49C; margin-top: 4px; }
  .ar-field-error { font-size: 12px; color: #DC2626; margin-top: 4px; }
  .ar-strength-bars { display: flex; gap: 4px; margin-top: 6px; }
  .ar-strength-bar { flex: 1; height: 3px; border-radius: 2px; background: #E5E2D9; transition: background 0.2s; }
  .ar-strength-label { font-size: 11px; margin-top: 3px; }
  .ar-terms { display: flex; align-items: flex-start; gap: 10px; margin-top: 4px; }
  .ar-checkbox { width: 18px; height: 18px; border-radius: 5px; border: 1px solid #E5E2D9; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.15s, border-color 0.15s; }
  .ar-checkbox.checked { background: #1C1C1A; border-color: #1C1C1A; }
  .ar-terms-text { font-size: 13px; color: #6B6860; line-height: 1.5; }
  .ar-terms-text a { color: #C9620A; font-weight: 600; text-decoration: underline; }
  .ar-submit { margin-top: 20px; width: 100%; padding: 14px; border-radius: 12px; background: #1C1C1A; color: white; font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 15px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.12s, transform 0.1s; box-sizing: border-box; }
  .ar-submit:hover:not(:disabled) { background: #111110; }
  .ar-submit:active:not(:disabled) { transform: scale(0.98); }
  .ar-submit:disabled { opacity: 0.5; pointer-events: none; }
  .ar-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: ar-spin 0.7s linear infinite; flex-shrink: 0; }
  @keyframes ar-spin { to { transform: rotate(360deg); } }
  .ar-error-banner { margin-top: 12px; padding: 12px 14px; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.15); border-radius: 10px; font-size: 13px; color: #DC2626; line-height: 1.5; }
  .ar-phone-wrap { display: flex; gap: 8px; }
  .ar-phone-code {
    flex-shrink: 0; width: 108px; padding: 12px 26px 12px 10px; border-radius: 11px;
    border: 1px solid #E5E2D9; background: #FAFAF8 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A8A49C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 8px center;
    font-family: 'Epilogue', sans-serif; font-size: 13px; color: #111110;
    outline: none; cursor: pointer; box-sizing: border-box; -webkit-appearance: none; appearance: none;
    transition: border-color 0.15s, background-color 0.15s;
  }
  .ar-phone-code:focus { border-color: #C9620A; background-color: white; }
  .ar-phone-code.has-error { border-color: #DC2626 !important; }
  .ar-phone-num {
    flex: 1; padding: 12px 14px; border-radius: 11px; border: 1px solid #E5E2D9;
    background: #FAFAF8; font-family: 'Epilogue', sans-serif; font-size: 16px; color: #111110;
    outline: none; transition: border-color 0.15s, background 0.15s; box-sizing: border-box;
    -webkit-appearance: none; appearance: none;
  }
  .ar-phone-num::placeholder { color: #A8A49C; }
  .ar-phone-num:focus { border-color: #C9620A; background: white; }
  .ar-phone-num.has-error { border-color: #DC2626 !important; }
  .ar-applied-pill { background: rgba(22,163,74,0.1); color: #16A34A; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 100px; font-family: 'Epilogue', sans-serif; }
  .ar-pending { text-align: center; }
  .ar-env-icon { width: 64px; height: 64px; margin: 0 auto 20px; display: block; }
  .ar-pending-heading { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 700; font-size: 22px; color: #111110; margin: 0 0 10px; }
  .ar-pending-text { font-size: 14px; color: #6B6860; line-height: 1.6; margin: 0 0 20px; }
  .ar-pending-text strong { color: #111110; }
  .ar-resend-btn { font-size: 13px; color: #C9620A; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; }
  .ar-resend-btn:disabled { opacity: 0.5; pointer-events: none; }
  @media (max-width: 500px) {
    .ar-inner { padding: 0; }
    .ar-card { border-radius: 0; border: none; box-shadow: none; padding: 32px 20px 60px; }
  }
`;

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [form, setForm] = useState({ fullName: '', username: '', email: '', countryCode: '+234', phoneNumber: '', referralCode: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [welcome, setWelcome] = useState(null);
  const [refAutoApplied, setRefAutoApplied] = useState(false);
  const [resending, setResending] = useState(false);
  const usernameTimer = useRef(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setForm(f => ({ ...f, referralCode: ref }));
      setRefAutoApplied(true);
    }
  }, [location.search]);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
    setServerError('');
  };

  useEffect(() => {
    const u = form.username.trim();
    if (!u || u.length < 3) return;
    clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const res = await api.get(`/auth/check-username/${u}`);
        if (!res.data.available) setErrors(er => ({ ...er, username: 'Username is already taken' }));
        else setErrors(er => ({ ...er, username: '' }));
      } catch { /* ignore */ }
      setUsernameChecking(false);
    }, 500);
  }, [form.username]);

  const handleInputFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = 'Full name must be at least 2 characters';
    if (!form.username.trim() || form.username.length < 3 || form.username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(form.username))
      e.username = 'Username: 3–20 characters, letters/numbers/underscores only';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.phoneNumber || form.phoneNumber.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreed) e.terms = 'You must agree to the Terms of Service';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');
    try {
      const res = await api.post('/auth/register', {
        full_name: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        phone: `${form.countryCode}${form.phoneNumber.replace(/\s/g, '')}`,
        referral_code: form.referralCode.trim() || undefined,
        password: form.password,
      });
      setSession({ user: res.data.user, token: res.data.token });
      setWelcome({ name: res.data.user?.full_name || form.fullName });
    } catch (err) {
      console.error('Registration error:', err);
      setServerError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!supabase) { alert('Google sign-in is not configured yet.'); return; }
    if (form.referralCode) localStorage.setItem('panelng_pending_ref', form.referralCode);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleResend = async () => {
    setResending(true);
    try { await api.post('/auth/resend-verification', { email: pendingEmail }); } catch { /* ignore */ }
    setResending(false);
  };

  const pwScore = passwordStrength(form.password);

  const isFormValid = form.fullName.trim().length >= 2 && form.username.length >= 3 && form.email.includes('@') &&
    form.phoneNumber.replace(/\D/g, '').length >= 7 && form.password.length >= 8 && form.password === form.confirmPassword && agreed;

  if (welcome) {
    return (
      <>
        <style>{css}</style>
        <div className="ar-page">
          <div className="ar-inner">
            <div className="ar-card" style={{ textAlign: 'center' }}>
              <Link to="/" className="ar-logo">
                <div className="ar-logo-box">P</div>
                <span className="ar-logo-word">PanelNG</span>
              </Link>

              {/* Green check circle */}
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Icon name="check" size={28} color="#16A34A" />
              </div>

              <h1 className="ar-heading" style={{ textAlign: 'center', marginBottom: 8 }}>
                Welcome, {welcome.name.split(' ')[0]}!
              </h1>
              <p style={{ fontSize: 14, color: '#6B6860', lineHeight: 1.7, marginBottom: 28 }}>
                Your PanelNG account is ready. You're now part of Nigeria's fastest-growing SMM network.
              </p>

              <div style={{ background: '#FAFAF8', border: '1px solid #E5E2D9', borderRadius: 10, padding: '16px 18px', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#A8A49C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>What you can do now</div>
                {[
                  'Fund your wallet with Paystack',
                  'Order 500+ SMM services instantly',
                  'Buy virtual numbers for SMS verification',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6B6860', marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9620A', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>

              <button
                className="ar-submit"
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: 0 }}
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (pendingEmail) {
    return (
      <>
        <style>{css}</style>
        <div className="ar-page">
          <div className="ar-inner">
            <div className="ar-card">
              <Link to="/" className="ar-logo">
                <div className="ar-logo-box">P</div>
                <span className="ar-logo-word">PanelNG</span>
              </Link>
              <div className="ar-pending">
                <svg className="ar-env-icon" viewBox="0 0 64 64" fill="none">
                  <rect x="4" y="12" width="56" height="40" rx="4" stroke="#C9620A" strokeWidth="2.5"/>
                  <path d="M4 16l28 20 28-20" stroke="#C9620A" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <h1 className="ar-pending-heading">Check your email</h1>
                <p className="ar-pending-text">
                  We sent a confirmation link to <strong>{pendingEmail}</strong>. Click it to activate your account. Check your spam folder if you don't see it.
                </p>
                <button className="ar-resend-btn" onClick={handleResend} disabled={resending}>
                  {resending ? 'Sending…' : 'Resend email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="ar-page">
        <div className="ar-inner">
          <div className="ar-card">
            <Link to="/" className="ar-logo">
              <div className="ar-logo-box">P</div>
              <span className="ar-logo-word">PanelNG</span>
            </Link>

            <h1 className="ar-heading">Create your account</h1>
            <p className="ar-sub">Already have an account? <Link to="/login">Sign in</Link></p>

            <button className="ar-google-btn" type="button" onClick={handleGoogle}>
              <GoogleIcon /> Continue with Google
            </button>

            <div className="ar-divider">
              <div className="ar-divider-line" />
              <span className="ar-divider-text">or</span>
              <div className="ar-divider-line" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="ar-fields">
                <div className="ar-field">
                  <label>Full Name</label>
                  <div className="ar-input-wrap">
                    <span className="ar-input-icon"><Icon name="user" /></span>
                    <input className={`ar-input${errors.fullName ? ' has-error' : ''}`} type="text" placeholder="Enter your full name" value={form.fullName} onChange={set('fullName')} onFocus={handleInputFocus} autoComplete="name" />
                  </div>
                  {errors.fullName && <div className="ar-field-error">{errors.fullName}</div>}
                </div>

                <div className="ar-field">
                  <label>Username {usernameChecking && <span style={{ fontSize: 10, color: '#A8A49C' }}>checking…</span>}</label>
                  <div className="ar-input-wrap">
                    <span className="ar-input-icon"><Icon name="at" /></span>
                    <input className={`ar-input${errors.username ? ' has-error' : ''}`} type="text" placeholder="Choose a username" value={form.username} onChange={set('username')} onFocus={handleInputFocus} autoComplete="username" />
                  </div>
                  <div className="ar-note">Letters, numbers and underscores only. No spaces.</div>
                  {errors.username && <div className="ar-field-error">{errors.username}</div>}
                </div>

                <div className="ar-field">
                  <label>Email Address</label>
                  <div className="ar-input-wrap">
                    <span className="ar-input-icon"><Icon name="mail" /></span>
                    <input className={`ar-input${errors.email ? ' has-error' : ''}`} type="email" placeholder="Enter your email address" value={form.email} onChange={set('email')} onFocus={handleInputFocus} autoComplete="email" />
                  </div>
                  {errors.email && <div className="ar-field-error">{errors.email}</div>}
                </div>

                <div className="ar-field">
                  <label><Icon name="phone" size={13} color="#6B6860" /> Phone Number</label>
                  <div className="ar-phone-wrap">
                    <select
                      className={`ar-phone-code${errors.phone ? ' has-error' : ''}`}
                      value={form.countryCode}
                      onChange={set('countryCode')}
                      onFocus={handleInputFocus}
                    >
                      {COUNTRY_CODES.map(({ code, flag, name }) => (
                        <option key={code + name} value={code}>{flag} {code}</option>
                      ))}
                    </select>
                    <input
                      className={`ar-phone-num${errors.phone ? ' has-error' : ''}`}
                      type="tel"
                      placeholder="8012345678"
                      value={form.phoneNumber}
                      onChange={set('phoneNumber')}
                      onFocus={handleInputFocus}
                      autoComplete="tel-national"
                    />
                  </div>
                  {errors.phone && <div className="ar-field-error">{errors.phone}</div>}
                </div>

                <div className="ar-field">
                  <label>
                    Referral Code (optional)
                    {refAutoApplied && <span className="ar-applied-pill">Applied</span>}
                  </label>
                  <div className="ar-input-wrap">
                    <span className="ar-input-icon"><Icon name="gift" /></span>
                    <input
                      className="ar-input"
                      type="text"
                      placeholder="Enter referral code (optional)"
                      value={form.referralCode}
                      onChange={refAutoApplied ? undefined : set('referralCode')}
                      onFocus={handleInputFocus}
                      readOnly={refAutoApplied}
                      style={refAutoApplied ? { background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.3)', color: '#16A34A' } : {}}
                    />
                  </div>
                </div>

                <div className="ar-field">
                  <label>Password</label>
                  <div className="ar-input-wrap">
                    <span className="ar-input-icon"><Icon name="lock" /></span>
                    <input
                      className={`ar-input${errors.password ? ' has-error' : ''}`}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={form.password}
                      onChange={set('password')}
                      onFocus={handleInputFocus}
                      style={{ paddingRight: 42 }}
                      autoComplete="new-password"
                    />
                    <button type="button" className="ar-input-right" onClick={() => setShowPw(v => !v)}>
                      <Icon name={showPw ? 'eye-off' : 'eye'} />
                    </button>
                  </div>
                  {form.password && (
                    <>
                      <div className="ar-strength-bars">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="ar-strength-bar" style={{ background: i <= pwScore ? strengthColor[pwScore] : '#E5E2D9' }} />
                        ))}
                      </div>
                      <div className="ar-strength-label" style={{ color: strengthColor[pwScore] }}>{strengthLabel[pwScore]}</div>
                    </>
                  )}
                  {errors.password && <div className="ar-field-error">{errors.password}</div>}
                </div>

                <div className="ar-field">
                  <label>Confirm Password</label>
                  <div className="ar-input-wrap">
                    <span className="ar-input-icon"><Icon name="lock" /></span>
                    <input
                      className={`ar-input${errors.confirmPassword ? ' has-error' : ''}`}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      onFocus={handleInputFocus}
                      style={{ paddingRight: 42 }}
                      autoComplete="new-password"
                    />
                    <button type="button" className="ar-input-right" onClick={() => setShowConfirm(v => !v)}>
                      <Icon name={showConfirm ? 'eye-off' : 'eye'} />
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <div className="ar-field-error">Passwords do not match</div>
                  )}
                  {errors.confirmPassword && form.password === form.confirmPassword && (
                    <div className="ar-field-error">{errors.confirmPassword}</div>
                  )}
                </div>
              </div>

              <div className="ar-terms" style={{ marginTop: 16 }}>
                <div className={`ar-checkbox${agreed ? ' checked' : ''}`} onClick={() => { setAgreed(v => !v); setErrors(er => ({ ...er, terms: '' })); }} role="checkbox" aria-checked={agreed}>
                  {agreed && <Icon name="check" size={11} color="white" />}
                </div>
                <span className="ar-terms-text">
                  I agree to the <Link to="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link>
                </span>
              </div>
              {errors.terms && <div className="ar-field-error" style={{ marginTop: 4 }}>{errors.terms}</div>}

              <button type="submit" className="ar-submit" disabled={loading || !isFormValid}>
                {loading ? <><span className="ar-spinner" /> Creating account…</> : 'Sign Up'}
              </button>

              {serverError && <div className="ar-error-banner">{serverError}</div>}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
