import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import PanelNG from './pages/PanelNG';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import PaymentCallback from './pages/PaymentCallback';
import TermsOfService from './pages/TermsOfService';

// Auth pages (new design)
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import OAuthCallback from './pages/auth/OAuthCallback';

import DashboardLayout from './components/DashboardLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminTransactions from './pages/admin/AdminTransactions';
import ServicesManager from './pages/admin/ServicesManager';
import SmsManager from './pages/admin/SmsManager';
import PaymentRequests from './pages/admin/PaymentRequests';
import BankSettings from './pages/admin/BankSettings';
import AccszoneManager from './pages/admin/AccszoneManager';
import SupportManager from './pages/admin/SupportManager';
import SiteSettings from './pages/admin/SiteSettings';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/manage" element={user?.role === 'admin' ? <Navigate to="/admin/overview" replace /> : <AdminLogin />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />

      {/* User Dashboard */}
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <PanelNG />
          </PrivateRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="payment-requests" element={<PaymentRequests />} />
        <Route path="bank-settings" element={<BankSettings />} />
        <Route path="services" element={<ServicesManager />} />
        <Route path="sms-manager" element={<SmsManager />} />
        <Route path="accszone" element={<AccszoneManager />} />
        <Route path="support" element={<SupportManager />} />
        <Route path="site-settings" element={<SiteSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
