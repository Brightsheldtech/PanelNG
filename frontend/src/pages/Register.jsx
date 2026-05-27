import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, UserPlus, CheckCircle, Wallet, ShoppingCart, Phone, ArrowRight } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', referral_code: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [welcome, setWelcome] = useState(null); // holds { name } after success

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form.email, form.full_name, form.password, form.referral_code.trim());
      setWelcome({ name: user?.full_name || form.full_name });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (welcome) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: 24,
      }}>
        {/* Ambient glow */}
        <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'rgba(240,165,0,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center',
          position: 'relative', zIndex: 1,
        }}>
          {/* Logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, background: 'var(--primary)', color: '#000', fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>P</div>
            <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: 20 }}>PanelNG</span>
          </div>

          {/* Check icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(14,201,127,0.12)', border: '1px solid rgba(14,201,127,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={30} color="var(--green)" />
            </div>
          </div>

          <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Welcome, {welcome.name.split(' ')[0]}!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
            Your PanelNG account is ready. You're now part of Nigeria's fastest-growing SMM network.
          </p>

          {/* What you can do */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 20px', marginBottom: 28, textAlign: 'left' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>What you can do now</p>
            {[
              { icon: <Wallet size={14} />, text: 'Fund your wallet with Paystack' },
              { icon: <ShoppingCart size={14} />, text: 'Order SMM services instantly' },
              { icon: <Phone size={14} />, text: 'Buy virtual numbers for SMS verification' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--primary)', display: 'flex' }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary btn-full btn-lg"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            Go to Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      {/* Left panel */}
      <div className="auth-panel-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
          <div style={{ width: 32, height: 32, background: 'var(--primary)', color: '#000', fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>P</div>
          <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: 18 }}>PanelNG</span>
        </div>
        <h2 style={{ fontSize: 30, fontFamily: 'var(--font-brand)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>
          Join thousands of<br />Nigerian operators.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40, maxWidth: 360 }}>
          Create a free account. No monthly fee. Fund your wallet when you're ready and start ordering in seconds.
        </p>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>PanelNG is free to join</div>
          {['No registration fee', 'No monthly subscription', 'Pay only per order', 'Instant wallet activation'].map((item) => (
            <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 40, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'var(--green-muted)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      </div>

      {/* Right — form */}
      <div className="auth-panel-right">
        <div className="auth-form-box">
          <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Chuka Obi"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Referral Code <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ABC123"
                value={form.referral_code}
                onChange={(e) => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 6 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating…</> : <><UserPlus size={16} /> Create Free Account</>}
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
              By registering, you agree to PanelNG's terms of service.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
