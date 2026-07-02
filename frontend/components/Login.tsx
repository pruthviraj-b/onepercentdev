import React from 'react';
import { useAuth } from './AuthProvider';

export function Login() {
  const { loginWithGoogle, loading, signingIn, authError } = useAuth();
  const busy = loading || signingIn;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f4f1ea',
      backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1.5px, transparent 1.5px)',
      backgroundSize: '16px 16px',
      fontFamily: 'var(--font-ui)',
      padding: '20px'
    }}>
      <main style={{
        background: '#ffffff',
        border: '3px solid #000000',
        boxShadow: '8px 8px 0px #000000',
        padding: '48px 40px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }} aria-labelledby="login-title">

        {/* Logo */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'inline-block',
            background: '#000000',
            color: '#f1be3e',
            fontFamily: 'var(--font-ui)',
            fontSize: '1.2rem',
            fontWeight: 900,
            padding: '6px 18px',
            border: '3px solid #000',
            marginBottom: '16px',
            letterSpacing: '0.05em',
          }} aria-hidden="true">1%</div>
          <h1 id="login-title" style={{
            fontSize: '1.8rem',
            fontWeight: 900,
            marginBottom: '8px',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
          }}>
            Developer Academy
          </h1>
          <p style={{
            fontFamily: 'var(--font-content)',
            fontSize: '0.95rem',
            color: '#555',
            lineHeight: 1.5,
          }}>
            Master IT &amp; Cloud. Track your daily consistency.
          </p>
        </div>
        
        <button
          onClick={loginWithGoogle}
          disabled={busy}
          style={{
            background: busy ? '#e0d9cc' : '#000000',
            color: busy ? '#888' : '#f1be3e',
            border: '2px solid #000000',
            boxShadow: busy ? 'none' : '4px 4px 0px #000000',
            padding: '14px 24px',
            fontSize: '1rem',
            fontWeight: 800,
            fontFamily: 'var(--font-ui)',
            cursor: busy ? 'wait' : 'pointer',
            width: '100%',
            transition: 'transform 0.1s, box-shadow 0.1s, background 0.1s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
          aria-label={busy ? 'Signing in with Google, please wait' : 'Sign in with your Google account'}
          aria-busy={busy}
          onMouseDown={(e) => {
            if (!busy) {
              e.currentTarget.style.transform = 'translate(4px, 4px)';
              e.currentTarget.style.boxShadow = '0px 0px 0px #000000';
            }
          }}
          onMouseUp={(e) => {
            if (!busy) {
              e.currentTarget.style.transform = 'translate(0px, 0px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #000000';
            }
          }}
          onMouseLeave={(e) => {
            if (!busy) {
              e.currentTarget.style.transform = 'translate(0px, 0px)';
              e.currentTarget.style.boxShadow = '4px 4px 0px #000000';
            }
          }}
        >
          {!busy && (
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {busy ? 'Connecting...' : 'Sign in with Google'}
        </button>
        {authError && (
          <div role="alert" style={{
            marginTop: '14px',
            background: '#fff7d6',
            border: '2px solid #000',
            padding: '10px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#000',
            lineHeight: 1.45,
          }}>
            {authError}
          </div>
        )}
        <p style={{
          marginTop: '24px',
          fontSize: '0.75rem',
          color: '#888',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.6,
        }}>
          Progress synced across devices. Free forever.
        </p>
      </main>
    </div>
  );
}
