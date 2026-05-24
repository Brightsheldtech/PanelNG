import { useState } from 'react';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [nameForm, setNameForm] = useState({ full_name: user?.full_name || '' });
  const [pwForm, setPwForm] = useState({ current: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleNameSave = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      await api.patch('/auth/profile', { full_name: nameForm.full_name });
      updateUser({ full_name: nameForm.full_name });
      toast.success('Name updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSavingName(false);
    }
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.new_password.length < 6) return toast.error('Min 6 characters');
    setSavingPw(true);
    try {
      await api.patch('/auth/change-password', {
        current_password: pwForm.current,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed');
      setPwForm({ current: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const fmt = (n) => Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });

  return (
    <div className="dash-page">

      {/* Avatar card — centered */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 16, padding: '28px 20px' }}>
        {/* 64×64 gold square avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: 12,
          background: 'var(--gold)', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-brand)', fontSize: 22, fontWeight: 800, color: '#000',
        }}>
          {initials}
        </div>

        {/* Name */}
        <div style={{ fontFamily: 'var(--font-brand)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          {user?.full_name}
        </div>

        {/* Email */}
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
          {user?.email}
        </div>

        {/* Role + Balance badges */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
            background: 'var(--gold-dim)', color: 'var(--gold)',
            fontFamily: 'var(--font-body)', textTransform: 'capitalize',
          }}>
            {user?.role}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 400, padding: '4px 10px', borderRadius: 6,
            background: 'var(--green-dim)', color: 'var(--green)',
            fontFamily: 'var(--font-mono)',
          }}>
            ₦{fmt(user?.wallet_balance)}
          </span>
        </div>
      </div>

      {/* Personal Info card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <span className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <User size={12} /> Personal Info
        </span>
        <form onSubmit={handleNameSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
            }}>
              Full Name
            </label>
            <input
              type="text"
              className="form-input"
              value={nameForm.full_name}
              onChange={(e) => setNameForm({ full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
            }}>
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={user?.email}
              disabled
              style={{ opacity: 0.45 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-body)', marginTop: 4, display: 'block' }}>
              Email cannot be changed
            </span>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingName}>
            {savingName
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
              : <><Save size={13} /> Save Changes</>
            }
          </button>
        </form>
      </div>

      {/* Change Password card */}
      <div className="card">
        <span className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Lock size={12} /> Change Password
        </span>
        <form onSubmit={handlePwSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
            }}>
              Current Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Your current password"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
            }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 6 characters"
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                required
                minLength={6}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 500,
              color: 'var(--text2)', fontFamily: 'var(--font-body)', marginBottom: 6,
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Repeat new password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-outline" style={{ width: '100%' }} disabled={savingPw}>
            {savingPw
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Changing…</>
              : <><Lock size={13} /> Change Password</>
            }
          </button>
        </form>
      </div>

    </div>
  );
}
