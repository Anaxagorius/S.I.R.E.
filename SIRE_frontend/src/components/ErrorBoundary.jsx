import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[SIRE] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
          padding: '2rem',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚨 S.I.R.E.</h1>
            <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Configuration Error</h2>
            <p style={{ color: '#1f2937', marginBottom: '1rem' }}>
              The application could not connect to the backend.
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
              Ensure <code>VITE_API_BASE_URL</code> and <code>VITE_API_KEY</code> are
              set in the Render environment variables for this static site and
              redeploy.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
