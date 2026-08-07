import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Learning Platform',
  description: 'Unified learning platform for industry master programs. Notes, code, and practice all in one unified dashboard.',
  openGraph: {
    title: 'Learning Platform',
    description: 'Master specialized technology disciplines from fundamentals up to real-world cloud architectures.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Learning Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learning Platform',
    description: 'Master specialized technology disciplines from fundamentals up to real-world cloud architectures.',
  }
};

import { AuthProvider } from '@/features/authentication/AuthProvider';
import { IdentityProvider } from '@/features/authentication/providers/IdentityProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Viewport meta for proper mobile scaling */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* Theme color for mobile browser chrome */}
        <meta name="theme-color" content="#FFFFFF" />
        {/* Site-wide typography uses Google Sans Flex. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wdth,wght@6..144,25..100,100..900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            try{
              window.__clientErrors = window.__clientErrors || [];
              function ensureOverlay(){
                var el = document.getElementById('client-error-overlay');
                if (!el) {
                  el = document.createElement('pre');
                  el.id = 'client-error-overlay';
                  el.style.position = 'fixed';
                  el.style.zIndex = 999999;
                  el.style.left = '8px';
                  el.style.right = '8px';
                  el.style.top = '8px';
                  el.style.maxHeight = '60vh';
                  el.style.overflow = 'auto';
                  el.style.background = '#FFFFFF';
                  el.style.color = '#EF4444';
                  el.style.border = '2px solid #E5E7EB';
                  el.style.padding = '12px';
                  el.style.fontSize = '12px';
                  el.style.fontFamily = "'Google Sans Flex', sans-serif";
                  el.style.whiteSpace = 'pre-wrap';
                  el.style.display = 'none';
                  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(el); if(window.__clientErrors.length) el.style.display='block'; });
                }
                return el;
              }
              function render(){
                var el = ensureOverlay();
                el.textContent = window.__clientErrors.join(String.fromCharCode(10, 10)) || '';
                if (el.textContent) el.style.display = 'block';
              }
              function handleChunkError(msg){
                try{
                  var key = 'reloaded_for_chunk_v1';
                  var el = ensureOverlay();
                  if (sessionStorage.getItem(key)) {
                    window.__clientErrors.push('ChunkLoadError: repeated reload failed. Please hard-refresh (Ctrl+F5) or clear cache.');
                    render();
                    return;
                  }
                  sessionStorage.setItem(key, '1');
                  window.__clientErrors.push('ChunkLoadError detected: attempting one automatic reload to recover from a stale cache.');
                  render();
                  setTimeout(function(){ try{ location.reload(); }catch(e){} }, 600);
                }catch(e){}
              }
              window.addEventListener('error', function(ev){
                try{ var msg = ev && ev.message || ''; window.__clientErrors.push('Error: ' + msg + ' at ' + (ev && ev.filename) + ':' + (ev && ev.lineno) + ':' + (ev && ev.colno)); }catch(e){}
                try{ var m = ev && ev.message || ''; if(m && (m.indexOf('Loading chunk') !== -1 || m.indexOf('ChunkLoadError') !== -1)) handleChunkError(m); }catch(e){}
                render();
              });
              window.addEventListener('unhandledrejection', function(ev){
                try{ var reason = ev && ev.reason; var msg = reason && (reason.stack || reason.message) || String(reason); window.__clientErrors.push('UnhandledRejection: ' + msg); if(msg && (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('ChunkLoadError') !== -1)) handleChunkError(msg); }catch(e){}
                render();
              });
              // also capture console.error and detect chunk messages
              (function(orig){ console.error = function(){ try{ var text = Array.from(arguments).map(a=>typeof a==='string'?a: (a && a.stack) || JSON.stringify(a)).join(' '); window.__clientErrors.push(text); if(text.indexOf('Loading chunk')!==-1 || text.indexOf('ChunkLoadError')!==-1) handleChunkError(text); }catch(e){} orig.apply(console,arguments); render(); }; })(console.error.bind(console));
            }catch(e){}
          })();
        `}} />
        <AuthProvider>
          <IdentityProvider>{children}</IdentityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
