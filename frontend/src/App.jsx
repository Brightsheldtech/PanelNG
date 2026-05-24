import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import PanelNG from './pages/PanelNG';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PaymentCallback from './pages/PaymentCallback';

import DashboardLayout from './components/DashboardLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import Overview from './pages/dashboard/Overview';
import NewOrder from './pages/dashboard/NewOrder';
import SmsVerification from './pages/dashboard/SmsVerification';
import OrderHistory from './pages/dashboard/OrderHistory';
import AddFunds from './pages/dashboard/AddFunds';
import Profile from './pages/dashboard/Profile';

import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminTransactions from './pages/admin/AdminTransactions';
import ServicesManager from './pages/admin/ServicesManager';
import SmsManager from './pages/admin/SmsManager';
import PaymentRequests from './pages/admin/PaymentRequests';
import BankSettings from './pages/admin/BankSettings';

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
      {/* Standalone demo — no auth */}
      <Route path="/demo" element={<PanelNG />} />

      {/* Public */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />

      {/* User Dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="new-order" element={<NewOrder />} />
        <Route path="sms" element={<SmsVerification />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route path="add-funds" element={<AddFunds />} />
        <Route path="profile" element={<Profile />} />
      </Route>

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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
