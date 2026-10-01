import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import AuthShell from './AuthShell';
import { TAGLINE } from '../constants';

// Email/password accounts must verify their email before using the app
// (the security rules refuse reads and writes until they do).
function VerifyEmailScreen({ email, onVerified }) {
  const [state, setState] = useState('idle'); // idle | sending | sent | checking | notyet | error

  async function resend() {
    setState('sending');
    try { await sendEmailVerification(auth.currentUser); setState('sent'); }
    catch (e) { setState(e.code === 'auth/too-many-requests' ? 'sent' : 'error'); }
  }

  async function check() {
    setState('checking');
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        await auth.currentUser.getIdToken(true);   // refresh so the database sees "verified"
        onVerified();
      } else setState('notyet');
    } catch { setState('error'); }
  }

  const note = {
    sent:   'Sent. Check your inbox (and spam).',
    notyet: "We can't see it yet — open the link in the email, then try again.",
    error:  'Something went wrong. Try again in a minute.',
  }[state];

  return (
    <AuthShell line="One quick check. We keep the room real.">
      <div className="auth-card">
        <div className="auth-logo"><div className="logo-icon"><i className="ti ti-coffee"/></div>The Stillroom</div>
        <div className="brand-tagline">{TAGLINE}</div>
        <p className="auth-tagline">Verify your email — we keep the room real.</p>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-dim)', margin: '0 0 18px' }}>
          We sent a link to <b>{email}</b>. Open it, then come back here. This keeps fake accounts out of the community.
        </p>
        <button className="auth-submit" onClick={check} disabled={state === 'checking'} style={{ width: '100%' }}>
          {state === 'checking' ? 'Checking…' : "I've verified my email"}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 13 }}>
          <button className="tn-link" onClick={resend} disabled={state === 'sending'}>Resend email</button>
          <button className="tn-link" onClick={() => signOut(auth)}>Log out</button>
        </div>
        {note && <div style={{ marginTop: 12, fontSize: 12, color: state === 'error' ? '#c0392b' : 'var(--text-2)' }}>{note}</div>}
      </div>
    </AuthShell>
  );
}

export default VerifyEmailScreen;
