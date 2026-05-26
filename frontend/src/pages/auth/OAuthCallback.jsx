import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = async () => {
      try {
        // Wait for Supabase to process the hash and establish session
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !session) throw new Error('Could not establish session');

        const pendingRef = localStorage.getItem('panelng_pending_ref') || undefined;
        if (pendingRef) localStorage.removeItem('panelng_pending_ref');

        const res = await api.post('/auth/supabase-sync', {
          access_token: session.access_token,
          ...(pendingRef && { pending_referral_code: pendingRef }),
        });

        const { user, token } = res.data;
        localStorage.setItem('panelng_token', token);
        localStorage.setItem('panelng_user', JSON.stringify(user));
        updateUser(user);
        navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      } catch (err) {
        console.error('[oauth-callback]:', err.message);
        setError('Sign in failed. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    };
    handle();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7F4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Epilogue, sans-serif', gap: 16 }}>
      {error ? (
        <p style={{ fontSize: 14, color: '#DC2626' }}>{error}</p>
      ) : (
        <>
          <div style={{ width: 32, height: 32, border: '3px solid #E5E2D9', borderTopColor: '#1C1C1A', borderRadius: '50%', animation: 'oac-spin 0.7s linear infinite' }} />
          <style>{`@keyframes oac-spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 14, color: '#6B6860' }}>Signing you in…</p>
        </>
      )}
    </div>
  );
}
