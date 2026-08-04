import React from 'react';
import { useAuth } from '@/features/authentication/AuthProvider';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function Login() {
  const { loginWithGoogle, loading, signingIn, authError } = useAuth();
  const busy = loading || signingIn;

  return (
    <div className="aurora-auth-page">
      <div className="aurora-noise" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-one" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-two" aria-hidden="true" />
      <div className="aurora-orb aurora-orb-three" aria-hidden="true" />

      <div className="aurora-shell">
        <aside className="aurora-story" aria-label="Developer Academy overview">
          <div className="aurora-kicker"><span className="kicker-dot" /> DAILY SYSTEM / 01</div>
          <div className="story-copy">
            <p className="story-eyebrow">Build your edge</p>
            <h2>Small gains.<br /><span>Serious momentum.</span></h2>
            <p className="story-description">A focused space for developers who turn consistent practice into uncommon progress.</p>
          </div>
          <div className="signal-card">
            <div className="signal-header"><span>Consistency signal</span><strong>+01%</strong></div>
            <div className="signal-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="signal-footer"><span>YOUR NEXT REP STARTS HERE</span><span className="signal-live">LIVE</span></div>
          </div>
          <div className="story-orbit" aria-hidden="true"><span className="orbit-ring orbit-ring-one" /><span className="orbit-ring orbit-ring-two" /><span className="orbit-core">1%</span><span className="orbit-star star-one" /><span className="orbit-star star-two" /></div>
        </aside>

        <main className="aurora-card" aria-labelledby="login-title">
          <div className="card-topline"><span className="card-status" /> SECURE ACCESS <span className="card-line" /></div>
          <div className="aurora-logo" aria-hidden="true"><span>1</span><small>%</small></div>
          <div className="aurora-intro">
            <p className="intro-label">Welcome back, builder</p>
            <h1 id="login-title">Developer<br /><em>Academy</em></h1>
            <p className="aurora-subtitle">Master IT &amp; Cloud. Track your daily consistency.</p>
          </div>

          <button onClick={loginWithGoogle} disabled={busy} className="aurora-submit" aria-label={busy ? 'Signing in with Google, please wait' : 'Sign in with your Google account'} aria-busy={busy} aria-describedby={authError ? 'login-error' : undefined}>
            {!busy && <GoogleIcon />}
            <span>{busy ? 'Connecting...' : 'Continue with Google'}</span>
            {!busy && <span className="button-arrow" aria-hidden="true">↗</span>}
          </button>

          {authError && <div id="login-error" className="aurora-error" role="alert" aria-live="assertive">{authError}</div>}
          <div className="aurora-trust"><span className="trust-lock">⌁</span><span>Progress synced across devices</span><span className="trust-separator">·</span><span>Free forever</span></div>
        </main>
      </div>

      <div className="aurora-footer"><span>ONE PERCENT BETTER / EVERY DAY</span><span>© 2026 DEVELOPER ACADEMY</span></div>

      <style jsx>{`
        .aurora-auth-page{position:relative;display:flex;align-items:center;justify-content:center;min-height:100vh;overflow:hidden;padding:36px 28px;background:#FFFFFF;color:#1F2937;font-family:var(--font-ui);isolation:isolate}
        .aurora-noise{position:absolute;inset:0;z-index:-1;opacity:.16;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E")}
        .aurora-auth-page:before{content:'';position:absolute;inset:0;z-index:-2;background:linear-gradient(125deg,#FFFFFF 0%,#FFFFFF 48%,#FFFFFF 100%)}
        .aurora-auth-page:after{content:'';position:absolute;inset:0;z-index:-1;opacity:.28;background-image:linear-gradient(rgba(130,154,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(130,154,255,.08) 1px,transparent 1px);background-size:64px 64px;mask-image:linear-gradient(to bottom,transparent,#1F2937 28%,#1F2937 70%,transparent)}
        .aurora-orb{position:absolute;border-radius:50%;filter:blur(1px);pointer-events:none;z-index:-1;animation:auroraFloat 12s ease-in-out infinite}
        .aurora-orb-one{width:480px;height:480px;top:-260px;left:-120px;background:radial-gradient(circle at 65% 65%,rgba(255,105,75,.5),transparent 68%);filter:blur(28px)}
        .aurora-orb-two{width:620px;height:620px;right:-260px;bottom:-280px;background:radial-gradient(circle at 35% 35%,rgba(106,92,255,.46),transparent 68%);filter:blur(34px);animation-delay:-4s}
        .aurora-orb-three{width:260px;height:260px;top:36%;right:26%;background:radial-gradient(circle,rgba(52,217,201,.18),transparent 70%);filter:blur(20px);animation-delay:-8s}
        .aurora-shell{display:grid;grid-template-columns:minmax(300px,390px) minmax(360px,460px);align-items:stretch;gap:0;width:min(850px,100%);min-height:550px;animation:authIn .75s cubic-bezier(.22,1,.36,1) both}
        .aurora-story{position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:38px 34px;border:1px solid rgba(255,255,255,.13);border-right:0;border-radius:26px 0 0 26px;background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.035));box-shadow:inset 1px 1px 0 rgba(255,255,255,.12),0 30px 80px rgba(0,0,0,.16);overflow:hidden}
        .aurora-kicker,.card-topline{display:flex;align-items:center;gap:9px;color:#6B7280;font-family:var(--font-mono);font-size:.62rem;letter-spacing:.16em;font-weight:700}.kicker-dot,.card-status{width:6px;height:6px;border-radius:50%;background:#F98012;box-shadow:0 0 13px #F98012}.story-copy{margin-top:auto;margin-bottom:26px}.story-eyebrow,.intro-label{margin:0 0 12px;color:#F98012;font-family:var(--font-mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase}.story-copy h2{margin:0;font-size:clamp(2.05rem,4vw,3.3rem);line-height:.98;letter-spacing:-.075em;font-weight:500}.story-copy h2 span{color:#F98012}.story-description{max-width:270px;margin:20px 0 0;color:#6B7280;font-size:.88rem;line-height:1.65}.signal-card{padding:16px;border:1px solid rgba(255,255,255,.13);border-radius:15px;background:rgba(9,15,30,.28);backdrop-filter:blur(12px)}.signal-header,.signal-footer{display:flex;align-items:center;justify-content:space-between;color:#abb6d3;font-family:var(--font-mono);font-size:.6rem;letter-spacing:.1em}.signal-header strong{color:#F98012;font-size:.8rem}.signal-bars{display:flex;align-items:end;gap:5px;height:50px;margin:15px 0 12px}.signal-bars i{display:block;flex:1;border-radius:4px 4px 1px 1px;background:linear-gradient(to top,#F59E0B,#F98012);opacity:.72}.signal-bars i:nth-child(1){height:28%}.signal-bars i:nth-child(2){height:39%}.signal-bars i:nth-child(3){height:32%}.signal-bars i:nth-child(4){height:54%}.signal-bars i:nth-child(5){height:47%}.signal-bars i:nth-child(6){height:65%}.signal-bars i:nth-child(7){height:58%}.signal-bars i:nth-child(8){height:77%}.signal-bars i:nth-child(9){height:68%}.signal-bars i:nth-child(10){height:85%}.signal-bars i:nth-child(11){height:78%}.signal-bars i:nth-child(12){height:100%}.signal-footer{font-size:.52rem;color:#6B7280}.signal-live{color:#F98012}.story-orbit{position:absolute;top:84px;right:-43px;width:150px;height:150px}.orbit-ring{position:absolute;inset:0;border:1px solid rgba(153,164,255,.28);border-radius:50%;transform:rotate(-27deg) skewX(-18deg)}.orbit-ring-two{inset:16px;transform:rotate(54deg) skewX(16deg);border-color:rgba(104,232,210,.25)}.orbit-core{position:absolute;inset:53px;display:grid;place-items:center;border-radius:50%;background:#FFFFFF;border:1px solid rgba(255,255,255,.3);color:#fff;font-weight:900;font-size:1.1rem;box-shadow:0 0 25px rgba(104,232,210,.15)}.orbit-star{position:absolute;width:6px;height:6px;border-radius:50%;background:#ff8a74;box-shadow:0 0 12px #ff8a74}.star-one{top:17px;right:27px}.star-two{bottom:23px;left:18px;background:#F98012;box-shadow:0 0 12px #F98012}
        .aurora-card{position:relative;display:flex;flex-direction:column;justify-content:center;padding:45px 52px;border:1px solid rgba(255,255,255,.26);border-radius:0 26px 26px 0;background:linear-gradient(145deg,rgba(255,255,255,.2),rgba(255,255,255,.08));box-shadow:inset 1px 1px 0 rgba(255,255,255,.23),0 30px 80px rgba(0,0,0,.24);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}.card-topline{position:absolute;top:28px;left:52px;right:52px;font-size:.57rem}.card-line{height:1px;flex:1;background:rgba(255,255,255,.18)}.aurora-logo{display:flex;align-items:baseline;justify-content:center;width:64px;height:64px;margin:0 auto 25px;border:1px solid rgba(255,255,255,.42);border-radius:20px 20px 20px 6px;background:linear-gradient(135deg,#F98012,#F59E0B);box-shadow:0 12px 28px rgba(255,97,110,.28),inset 1px 1px 0 rgba(255,255,255,.4);transform:rotate(-5deg);font-weight:900}.aurora-logo span{font-size:1.8rem}.aurora-logo small{font-size:1rem}.aurora-intro{text-align:center}.intro-label{margin-bottom:11px;color:#6B7280;font-size:.61rem}.aurora-intro h1{margin:0;color:#1F2937;font-size:2.55rem;line-height:.96;letter-spacing:-.075em;font-weight:600}.aurora-intro h1 em{color:#F98012;font-style:normal}.aurora-subtitle{margin:18px auto 31px;color:#6B7280;font-size:.88rem;line-height:1.5}.aurora-submit{position:relative;display:flex;align-items:center;justify-content:center;gap:11px;width:100%;min-height:56px;border:1px solid rgba(255,255,255,.28);border-radius:14px;background:linear-gradient(110deg,#ff6f55,#f45673);color:#fff;box-shadow:0 14px 30px rgba(240,82,103,.23),inset 1px 1px 0 rgba(255,255,255,.3);font-family:var(--font-ui);font-size:.9rem;font-weight:800;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease,filter .2s ease}.aurora-submit:hover:not(:disabled){transform:translateY(-3px);filter:saturate(1.1);box-shadow:0 19px 34px rgba(240,82,103,.34),inset 1px 1px 0 rgba(255,255,255,.35)}.aurora-submit:active:not(:disabled){transform:translateY(-1px)}.aurora-submit:disabled{cursor:wait;opacity:.65;filter:grayscale(.18)}.aurora-submit:focus-visible{outline:3px solid #F98012;outline-offset:4px}.button-arrow{position:absolute;right:18px;font-size:1.2rem}.aurora-error{margin-top:14px;padding:11px 13px;border:1px solid rgba(255,190,115,.55);border-radius:10px;background:rgba(132,83,36,.3);color:#ffe0ac;font-size:.76rem;line-height:1.45;text-align:left}.aurora-trust{display:flex;justify-content:center;align-items:center;gap:7px;margin-top:24px;color:#6B7280;font-family:var(--font-mono);font-size:.55rem;letter-spacing:.04em}.trust-lock{color:#F98012;font-size:.9rem}.trust-separator{color:#9CA3AF}.aurora-footer{position:absolute;right:32px;bottom:20px;left:32px;display:flex;justify-content:space-between;color:#6B7280;font-family:var(--font-mono);font-size:.52rem;letter-spacing:.12em}
        @keyframes authIn{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes auroraFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(12px,-18px,0)}}@media(max-width:720px){.aurora-auth-page{padding:24px 16px}.aurora-shell{display:block;min-height:0}.aurora-story{display:none}.aurora-card{min-height:550px;border-radius:26px;padding:44px 28px}.card-topline{left:28px;right:28px}.aurora-footer{right:18px;bottom:12px;left:18px;font-size:.44rem}.aurora-footer span:last-child{display:none}}@media(prefers-reduced-motion:reduce){.aurora-shell,.aurora-orb{animation:none}.aurora-submit{transition:none}}
      `}</style>
    </div>
  );
}
