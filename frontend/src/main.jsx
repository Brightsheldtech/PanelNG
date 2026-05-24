import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1c1c21',
                color: '#f0f0f4',
                border: '1px solid #2a2a32',
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: '14px',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#1ec97a', secondary: '#000' } },
              error:   { iconTheme: { primary: '#f04438', secondary: '#000' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
