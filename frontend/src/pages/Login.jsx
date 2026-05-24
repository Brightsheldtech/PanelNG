import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, BarChart2, MessageSquare, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Left panel */}
      <div className="auth-panel-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
          <div style={{ width: 32, height: 32, background: 'var(--primary)', color: '#000', fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>P</div>
          <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: 18 }}>PanelNG</span>
        </div>
        <h2 style={{ fontSize: 30, fontFamily: 'var(--font-brand)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>
          Nigeria's sharpest<br />SMM & SMS panel.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 40 }}>
          500+ SMM services, instant SMS verification, and a naira wallet — all in one dashboard.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: BarChart2, label: '500+ social media services', color: 'var(--primary)' },
            { icon: MessageSquare, label: 'SMS numbers for any platform', color: 'var(--green)' },
            { icon: Wallet, label: 'Fund in naira via Paystack', color: 'var(--blue)' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
        {/* BG decoration */}
        <div style={{ position: 'absolute', bottom: 40, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'var(--primary-muted)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      </div>

      {/* Right panel — form */}
      <div className="auth-panel-right">
        <div className="auth-form-box">
          <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Sign in</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one free</Link>
          </p>

          {error && (
            <div className="alert alert-error mb-4" style={{ marginBottom: 16 }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
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
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
