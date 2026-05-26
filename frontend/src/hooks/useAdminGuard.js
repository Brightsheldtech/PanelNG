import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useAdminGuard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (user.role !== 'admin') { navigate('/dashboard', { replace: true }); return; }
    setIsAdmin(true);
  }, [user, loading]);

  return isAdmin;
}
