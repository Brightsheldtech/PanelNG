import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return children;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  return <Navigate to={isMobile ? '/login' : '/'} replace />;
}
