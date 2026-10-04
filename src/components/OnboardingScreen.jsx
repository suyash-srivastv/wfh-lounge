import AuthShell from './AuthShell';
import { track } from '../analytics';
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, runTransaction, collection, query, limit, getDocs } from 'firebase/firestore';
import { ROLES, TAGLINE, firebaseErrMsg, avatarColors, initialsOf } from '../constants';
import { photoFromFile } from '../photo';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// "new delhi" → "New Delhi", so typed cities match picked ones.
export const titleCase = s => s.trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|\s|-)\S/g, c => c.toUpperCase());

export function CitySearch({ value, onChange }) {
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
          onBlur={() => setTimeout(() => { if (input.trim().length >= 2) onChange(v => v || titleCase(input)); }, 200)}
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
  const [yearsExp, setYearsExp]     = useState('');
  const [city, setCity]             = useState(user.city || '');
  const [unameStatus, setUnameStatus] = useState('idle'); // idle | checking | available | taken | invalid | error
  const [unameErr, setUnameErr]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [locFailed, setLocFailed]   = useState(false);
  const [photo, setPhoto]           = useState(null);
  const [photoBusy, setPhotoBusy]   = useState(false);
  const [photoErr, setPhotoErr]     = useState('');
  const fileRef = useRef(null);

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoErr(''); setPhotoBusy(true);
    try { setPhoto(await photoFromFile(file)); }
    catch (err) { setPhotoErr(err.message); }
    finally { setPhotoBusy(false); }
  }

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
      } catch (e) {
        console.error('Username check failed:', e);
        setUnameErr(e.code === 'permission-denied'
          ? "Couldn't check username (permission denied). Check Firestore rules for /usernames."
          : "Couldn't check username. Check your connection and try again.");
        setUnameStatus('error');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const usernameHint = {
    idle:      null,
    invalid:   { ok: false, msg: '3–20 chars, letters/numbers/underscore only' },
    checking:  { ok: null,  msg: 'Checking…' },
    available: { ok: true,  msg: '@' + username.trim().toLowerCase() + ' is available' },
    taken:     { ok: false, msg: 'Username already taken' },
    error:     { ok: false, msg: unameErr },
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


  async function finish(e) {
    e.preventDefault();
    setErr('');
    if (!displayName.trim()) { setErr('Display name is required.'); return; }
    const uname = username.trim().toLowerCase();
    if (!uname || unameStatus !== 'available') { setErr('Choose an available username.'); return; }
    if (!role) { setErr('Pick your role.'); return; }
    if (yearsExp === '' || Number(yearsExp) < 0 || Number(yearsExp) > 60) { setErr('Add your years of experience (0 is fine).'); return; }
    if (!city) { setErr('Add your city — it decides who you see nearby.'); return; }

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
          yearsExp: yearsExp !== '' ? Number(yearsExp) : null,
          initials,
          ...(photo ? { photoURL: photo } : {}),
          ...(city && !user.seedCity ? { seedCity: city } : {}),
        }, { merge: true });
      });
      track('profile_completed', { has_city: !!city, has_photo: !!photo });
      setUser(u => ({ ...u, ...(photo ? { photoURL: photo } : {}), ...(city && !u.seedCity ? { seedCity: city } : {}), name: displayName.trim(), username: uname, bio: bio.trim(), role, city, yearsExp: yearsExp !== '' ? Number(yearsExp) : null, initials: displayName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() }));
    } catch (e) {
      setErr(e.message || 'Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <AuthShell line="Almost there. How should people know you?">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo"><div className="logo-icon"><i className="ti ti-coffee" /></div>The Stillroom</div>
        <div className="brand-tagline">{TAGLINE}</div>
        <p className="auth-tagline">Almost there — set up your public profile. Be yourself; nobody's grading.</p>

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
                <input className="auth-input" maxLength={50} placeholder="How people will see you"
                  value={displayName} onChange={e => setDisplayName(e.target.value)} />
                <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>This is shown on your posts and profile — not your legal name.</span>
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
                  <span style={{ fontSize: 11, marginTop: 3, color: usernameHint.ok === true ? '#1D9E75' : usernameHint.ok === false ? '#c0392b' : 'var(--text-2)' }}>
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
              <div className="ob-photo">
                <button type="button" className="ob-photo-pick" onClick={() => fileRef.current?.click()} disabled={photoBusy}
                  aria-label={photo ? 'Change photo' : 'Add a photo'}
                  style={photo ? undefined : { background: avatarColors(user.uid).bg, color: avatarColors(user.uid).tc }}>
                  {photo ? <img src={photo} alt=""/> : <span>{initialsOf(displayName)}</span>}
                  <span className="ob-photo-cam">
                    <i className={'ti ' + (photoBusy ? 'ti-loader-2' : 'ti-camera')} style={photoBusy ? { animation: 'spin 1s linear infinite' } : {}}/>
                  </span>
                </button>
                <div>
                  <div className="ob-photo-title">{photo ? 'Looking good' : <>Add a photo <span className="auth-opt">(optional)</span></>}</div>
                  <div className={'ob-photo-sub' + (photoErr ? ' err' : '')}>
                    {photoErr || (photo ? <button type="button" className="tn-link" onClick={() => setPhoto(null)}>Remove</button> : 'People say hi more to a face.')}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPhoto}/>
              </div>

              <div className="auth-field">
                <label className="auth-label">Bio <span className="auth-opt">(optional)</span></label>
                <textarea className="auth-input" rows={3}
                  placeholder="A few words about what you do…"
                  style={{ resize: 'vertical' }}
                  value={bio} maxLength={160}
                  onChange={e => setBio(e.target.value)} />
                <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, textAlign: 'right' }}>{bio.length}/160</span>
              </div>

              <div style={{display:'flex',gap:8}}>
                <div className="auth-field" style={{flex:1}}>
                  <label className="auth-label">Role <span style={{color:'#c0392b'}}>*</span></label>
                  <select className="auth-input auth-select" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="">Select role…</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="auth-field" style={{width:90}}>
                  <label className="auth-label">Years exp. <span style={{color:'#c0392b'}}>*</span></label>
                  <input className="auth-input" type="number" min={0} max={60} placeholder="0"
                    value={yearsExp} onChange={e => setYearsExp(e.target.value)}/>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Your city <span style={{color:'#c0392b'}}>*</span></label>
                <CitySearch value={city} onChange={setCity} />
                {!city && (
                  <button type="button" className="loc-ask" onClick={detectLocation} disabled={detectingLoc}>
                    <i className={'ti ' + (detectingLoc ? 'ti-loader-2' : 'ti-current-location')}
                      style={detectingLoc ? { animation: 'spin 1s linear infinite' } : {}}/>
                    <span>
                      <b>{detectingLoc ? 'Finding your city…' : 'Or use my location'}</b>
                      <span>{locFailed ? "Couldn't detect it — just search above instead." : 'Helps you find people and events nearby. We only save your city, never your exact location.'}</span>
                    </span>
                  </button>
                )}
                {city && <span style={{fontSize:11,color:'var(--text-2)',marginTop:3}}>You can search for a different city above.</span>}
              </div>

              {err && <div className="auth-error"><i className="ti ti-alert-circle" />{err}</div>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-cancel" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button type="submit" className="auth-submit" disabled={loading || !role || yearsExp === '' || !city} style={{ flex: 2 }}>
                  {loading
                    ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Saving…</>
                    : 'Finish setup →'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </AuthShell>
  );
}

export default OnboardingScreen;
