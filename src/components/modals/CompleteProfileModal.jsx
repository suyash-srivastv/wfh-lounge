import { useState } from 'react';
import { CitySearch } from '../OnboardingScreen';
import { ROLES } from '../../constants';

// Shown after sign-up / login while your profile has no city. Without one you
// don't show up in "People nearby" and the app can't open on your city's
// events. "Later" hides it for this visit only; it asks again next time.
function CompleteProfileModal({ user, onSave, onLater }) {
  const [city, setCity] = useState('');
  const [role, setRole] = useState(user.role || '');
  const [bio, setBio]   = useState(user.bio || '');
  const [loc, setLoc]   = useState('idle'); // idle | detecting | failed
  const [saving, setSaving] = useState(false);
  const [err, setErr]   = useState('');
  const askRole = !user.role, askBio = !user.bio;

  function detect() {
    if (!navigator.geolocation) { setLoc('failed'); return; }
    setLoc('detecting');
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords;
        const res  = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const data = await res.json();
        const name = data.city || data.locality || data.principalSubdivision || null;
        if (name) { setCity(name); setLoc('idle'); } else setLoc('failed');
      } catch { setLoc('failed'); }
    }, () => setLoc('failed'), { timeout: 8000 });
  }

  async function save() {
    setSaving(true); setErr('');
    try { await onSave({ city, role, bio: bio.trim() }); }
    catch { setErr("Couldn't save. Check your connection and try again."); setSaving(false); }
  }

  return (
    <div className="overlay">
      <div className="modal cp-modal" role="dialog" aria-labelledby="cp-title">
        <div className="cp-icon"><i className="ti ti-map-pin"/></div>
        <div className="modal-title" id="cp-title">Where are you based?</div>
        <p className="np-sub">Add your city so people nearby can find you, and so we can show you what's on around you.</p>

        <label className="auth-label">Your city</label>
        <CitySearch value={city} onChange={setCity}/>
        {!city && (
          <button type="button" className="loc-ask" onClick={detect} disabled={loc === 'detecting'}>
            <i className={'ti ' + (loc === 'detecting' ? 'ti-loader-2' : 'ti-current-location')} style={loc === 'detecting' ? { animation: 'spin 1s linear infinite' } : {}}/>
            <span>
              <b>{loc === 'detecting' ? 'Finding your city…' : 'Use my location'}</b>
              <span>{loc === 'failed' ? "Couldn't detect it — just search above instead." : 'We only save your city, never your exact location.'}</span>
            </span>
          </button>
        )}

        {askRole && <>
          <label className="auth-label" style={{ marginTop: 14 }}>What do you do?</label>
          <select className="auth-input auth-select" value={role} onChange={e => setRole(e.target.value)}>
            <option value="">Select role…</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </>}

        {askBio && <>
          <label className="auth-label" style={{ marginTop: 14 }}>A line about you <span className="auth-opt">(optional)</span></label>
          <input className="auth-input" maxLength={160} placeholder="e.g. Designer, chai over coffee, always up for a walk"
            value={bio} onChange={e => setBio(e.target.value)}/>
        </>}

        {err && <div className="auth-error" style={{ marginTop: 12 }}><i className="ti ti-alert-circle"/>{err}</div>}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onLater}>Later</button>
          <button className="btn-primary" onClick={save} disabled={!city || (askRole && !role) || saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default CompleteProfileModal;
