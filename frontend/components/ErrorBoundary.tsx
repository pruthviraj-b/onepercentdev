'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string; // for labelling which section crashed
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? ` — ${this.props.name}` : ''}]`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          padding: '32px 24px',
          background: '#f4f1ea',
          fontFamily: 'var(--font-ui)',
        }}>
          <div style={{
            background: '#ffffff',
            border: '3px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
          }}>
            <div style={{
              background: '#ff4444',
              borderBottom: '2px solid #000',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚠ Something went wrong
              </span>
              {this.props.name && (
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)' }}>
                  [{this.props.name}]
                </span>
              )}
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '0.88rem', color: '#333', marginBottom: '12px', lineHeight: 1.6 }}>
                This section crashed unexpectedly. Your progress and data are safe.
              </p>
              {this.state.error && (
                <div style={{
                  background: '#f4f1ea',
                  border: '2px solid #000',
                  padding: '8px 12px',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#cc0000',
                  overflowX: 'auto',
                  maxHeight: '80px',
                  overflow: 'auto',
                }}>
                  {this.state.error.message}
                </div>
              )}
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#000000',
                  color: '#f1be3e',
                  border: '2px solid #000',
                  boxShadow: '3px 3px 0px #000',
                  padding: '8px 20px',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                ↺ Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
