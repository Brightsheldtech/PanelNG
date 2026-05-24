import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', background: '#06080F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ background: '#111620', border: '1px solid #EF4351', borderRadius: 12, padding: 36, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <AlertTriangle size={40} color="#EF4351" style={{ marginBottom: 16 }} />
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: '#DCE3F0', marginBottom: 10 }}>
            Something crashed
          </h2>
          <p style={{ fontSize: 13, color: '#5A6880', marginBottom: 20, lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <code style={{ display: 'block', background: '#06080F', border: '1px solid #1A2035', borderRadius: 6, padding: 12, fontSize: 11, color: '#5A6880', textAlign: 'left', marginBottom: 24, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.stack?.split('\n').slice(0, 4).join('\n')}
          </code>
          <button
            onClick={() => window.location.reload()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#F0A500', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
          >
            <RefreshCw size={14} /> Reload Page
          </button>
        </div>
      </div>
    );
  }
}
