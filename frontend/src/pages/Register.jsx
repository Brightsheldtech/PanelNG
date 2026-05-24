import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.full_name, form.password);
      toast.success('Account created! Welcome to PanelNG');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
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
