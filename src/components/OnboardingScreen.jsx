import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, runTransaction, collection, query, limit, getDocs } from 'firebase/firestore';
import { ROLES, firebaseErrMsg } from '../constants';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function CitySearch({ value, onChange }) {
  const [input, setInput] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  useEffect(() => {
    const q = input.trim();
    if (!q || value) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&layer=city&lang=en`);
        const data = await res.json();
        setResults((data.features || []).filter(f => f.properties?.name).map(f => ({
          name: f.properties.name,
          full: [f.properties.name, f.properties.state, f.properties.country].filter(Boolean).join(', '),
        })));
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [input, value]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div className="auth-input-icon">
        <i className="ti ti-map-pin" />
        <input
          className="auth-input-inner"
          placeholder="Search your city…"
          value={value || input}
          onFocus={() => { if (value) { onChange(''); setInput(''); } setOpen(true); }}
          onChange={e => { setInput(e.target.value); onChange(''); setOpen(true); }}
        />
      </div>
      {open && results.length > 0 && (
        <div className="auth-city-drop">
          {results.map(r => (
            <button type="button" key={r.full} className="city-drop-item"
              onClick={() => { onChange(r.name); setInput(r.name); setOpen(false); setResults([]); }}>
              <span>{r.name}</span>
              <span className="city-drop-sub">{r.full.split(',').slice(1).join(',').trim()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OnboardingScreen({ user, setUser }) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user.name || '');
  const [username, setUsername]     = useState('');
  const [bio, setBio]               = useState('');
  const [role, setRole]             = useState(user.role || '');
  const [city, setCity]             = useState(user.city || '');
  const [unameStatus, setUnameStatus] = useState('idle'); // idle | checking | available | taken | invalid
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [locFailed, setLocFailed]   = useState(false);

  // Real-time username availability check
  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (!u) { setUnameStatus('idle'); return; }
    if (!USERNAME_RE.test(u)) { setUnameStatus('invalid'); return; }
    setUnameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'usernames', u));
        setUnameStatus(snap.exists() ? 'taken' : 'available');
      } catch { setUnameStatus('idle'); }
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const usernameHint = {
    idle:      null,
    invalid:   { ok: false, msg: '3–20 chars, letters/numbers/underscore only' },
    checking:  { ok: null,  msg: 'Checking…' },
    available: { ok: true,  msg: '@' + username.trim().toLowerCase() + ' is available' },
    taken:     { ok: false, msg: 'Username already taken' },
  }[unameStatus];

  function detectLocation() {
    if (!navigator.geolocation || detectingLoc) return;
    setDetectingLoc(true);
    setLocFailed(false);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          const name = data.city || data.locality || data.principalSubdivision || null;
          if (name) setCity(name);
        } catch { setLocFailed(true); }
        setDetectingLoc(false);
      },
      () => { setDetectingLoc(false); setLocFailed(true); },
      { timeout: 8000 }
    );
  }

  // Auto-detect when entering step 2 and no city set yet
  useEffect(() => {
    if (step === 2 && !city) detectLocation();
  }, [step]);

  async function finish(e) {
    e.preventDefault();
    setErr('');
    if (!displayName.trim()) { setErr('Display name is required.'); return; }
    const uname = username.trim().toLowerCase();
    if (!uname || unameStatus !== 'available') { setErr('Choose an available username.'); return; }

    setLoading(true);
    try {
      const initials = displayName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      await runTransaction(db, async tx => {
        const unameRef = doc(db, 'usernames', uname);
        const snap = await tx.get(unameRef);
        if (snap.exists()) throw new Error('Username was just taken. Try another.');
        tx.set(unameRef, { uid: user.uid });
        tx.set(doc(db, 'users', user.uid), {
          name: displayName.trim(),
          username: uname,
          bio: bio.trim(),
          role,
          city,
          initials,
        }, { merge: true });
      });
      setUser(u => ({ ...u, name: displayName.trim(), username: uname, bio: bio.trim(), role, city, initials: displayName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() }));
    } catch (e) {
      setErr(e.message || 'Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo"><div className="logo-icon"><i className="ti ti-coffee" /></div>WFH Lounge</div>
        <p className="auth-tagline">Almost there — set up your public profile.</p>

        <div className="onboard-steps">
          <div className={"onboard-step" + (step >= 1 ? ' done' : '')}><span>1</span>Identity</div>
          <div className="onboard-step-line"/>
          <div className={"onboard-step" + (step >= 2 ? ' done' : '')}><span>2</span>About you</div>
        </div>

        <form onSubmit={finish} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          {step === 1 && (
            <>
              <div className="auth-field">
                <label className="auth-label">Display name <span style={{color:'#c0392b'}}>*</span></label>
                <input className="auth-input" placeholder="How people will see you"
                  value={displayName} onChange={e => setDisplayName(e.target.value)} />
                <span style={{ fontSize: 11, color: '#B4B2A9', marginTop: 3 }}>This is shown on your posts and profile — not your legal name.</span>
              </div>

              <div className="auth-field">
                <label className="auth-label">Username <span style={{color:'#c0392b'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span className="uname-prefix">@</span>
                  <input className="auth-input" style={{ paddingLeft: 28 }}
                    placeholder="yourhandle"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  />
                </div>
                {usernameHint && (
                  <span style={{ fontSize: 11, marginTop: 3, color: usernameHint.ok === true ? '#1D9E75' : usernameHint.ok === false ? '#c0392b' : '#888780' }}>
                    {usernameHint.ok === true && <i className="ti ti-check" style={{ marginRight: 3 }} />}
                    {usernameHint.ok === false && <i className="ti ti-x" style={{ marginRight: 3 }} />}
                    {usernameHint.msg}
                  </span>
                )}
              </div>

              <button type="button" className="auth-submit"
                disabled={!displayName.trim() || unameStatus !== 'available'}
                onClick={() => setStep(2)}>
                Next →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="auth-field">
                <label className="auth-label">Bio <span className="auth-opt">(optional)</span></label>
                <textarea className="auth-input" rows={3}
                  placeholder="A few words about what you do…"
                  style={{ resize: 'vertical' }}
                  value={bio} maxLength={160}
                  onChange={e => setBio(e.target.value)} />
                <span style={{ fontSize: 11, color: '#B4B2A9', marginTop: 3, textAlign: 'right' }}>{bio.length}/160</span>
              </div>

              <div className="auth-field">
                <label className="auth-label">Role <span className="auth-opt">(optional)</span></label>
                <select className="auth-input auth-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="">Select your role…</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  Your city
                  {detectingLoc && <span className="auth-opt" style={{marginLeft:8}}><i className="ti ti-loader-2" style={{animation:'spin 1s linear infinite',marginRight:3}}/>Detecting…</span>}
                  {!detectingLoc && city && <span style={{color:'#1D9E75',fontSize:11,marginLeft:8,fontWeight:400}}><i className="ti ti-check" style={{marginRight:2}}/>Detected</span>}
                  {!detectingLoc && locFailed && !city && <button type="button" className="loc-retry-btn" onClick={detectLocation}><i className="ti ti-current-location"/>Try again</button>}
                </label>
                <CitySearch value={city} onChange={setCity} />
                {!city && !detectingLoc && !locFailed && <span style={{fontSize:11,color:'#B4B2A9',marginTop:3}}>Detecting your location automatically…</span>}
                {city && <span style={{fontSize:11,color:'#888780',marginTop:3}}>You can search for a different city above.</span>}
              </div>

              {err && <div className="auth-error"><i className="ti ti-alert-circle" />{err}</div>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-cancel" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button type="submit" className="auth-submit" disabled={loading} style={{ flex: 2 }}>
                  {loading
                    ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Saving…</>
                    : 'Finish setup →'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default OnboardingScreen;
