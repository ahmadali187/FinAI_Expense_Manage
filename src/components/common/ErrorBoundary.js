import React from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled React Error Boundary Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'var(--bg-main, #0b0f19)',
          color: 'var(--text-primary, #ffffff)',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: 'var(--surface-glass, rgba(15, 23, 42, 0.9))',
            border: '1px solid var(--surface-glass-border, rgba(239, 68, 68, 0.3))',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '1.8rem'
            }}>
              <FaExclamationTriangle />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--text-primary, #ffffff)' }}>
              Something went wrong
            </h2>

            <p style={{ color: 'var(--text-secondary, #cbd5e1)', fontSize: '0.92rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              FinAI encountered an unexpected display issue. Don't worry, your financial records and account data are safe in the database.
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '12px',
                borderRadius: '10px',
                textAlign: 'left',
                fontSize: '0.8rem',
                color: '#f87171',
                fontFamily: 'monospace',
                overflowX: 'auto',
                marginBottom: '24px',
                maxHeight: '120px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                className="btn-gradient-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FaRedo /> Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'var(--surface-glass-hover, rgba(30, 41, 59, 0.8))',
                  border: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.15))',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FaHome /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
