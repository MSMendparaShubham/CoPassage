import React, { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F7F9E1',
          color: '#0F2A4A',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '480px',
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '2px solid rgba(15, 42, 74, 0.1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>CoPassage Commuter Network</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              The application encountered a temporary glitch. Tap below to reload.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#0F2A4A',
                color: '#CAFFA6',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '16px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

