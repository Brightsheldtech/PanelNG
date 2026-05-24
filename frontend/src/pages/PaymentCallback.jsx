import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | success | failed
  const [amount, setAmount] = useState(0);
  const [newBalance, setNewBalance] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found in the URL.');
      return;
    }

    api
      .get(`/payment/verify/${reference}`)
      .then((res) => {
        setStatus('success');
        setAmount(res.data.amount);
        setNewBalance(res.data.new_balance);
        updateUser({ wallet_balance: res.data.new_balance });
      })
      .catch((err) => {
        const msg = err.response?.data?.error;
        if (msg?.includes('already')) {
          setStatus('success');
          setMessage('This payment was already processed.');
        } else {
          setStatus('failed');
          setMessage(msg || 'Could not verify payment. Please contact support.');
        }
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <Loader size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: 20, marginBottom: 8 }}>Verifying payment…</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Checking with Paystack. Please wait.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} color="var(--green)" style={{ marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: 22, marginBottom: 8, color: 'var(--green)' }}>
              Payment Confirmed
            </h2>
            {amount > 0 && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>
              {message || 'Your wallet has been credited.'}
            </p>
            {newBalance > 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                New balance: <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  ₦{newBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </p>
            )}
            <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link to="/dashboard/overview" className="btn btn-primary">Go to Dashboard</Link>
              <Link to="/dashboard/new-order" className="btn btn-outline">Place Order</Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle size={48} color="var(--red)" style={{ marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: 22, marginBottom: 8, color: 'var(--red)' }}>
              Payment Failed
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              {message || 'Something went wrong with your payment.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link to="/dashboard/add-funds" className="btn btn-primary">Try Again</Link>
              <Link to="/dashboard" className="btn btn-outline">Dashboard</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
