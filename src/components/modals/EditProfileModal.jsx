import { useState, useRef, useEffect } from 'react';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ROLES, STATUSES } from '../../constants';

function EditProfileModal({ open, user, onClose, onSave }) {
  const [form,       setForm]       = useState({ name: '', city: '', role: '', bio: '', yearsExp: '', status: '' });
  const [cityQ,      setCityQ]      = useState('');
  const [cityR,      setCityR]      = useState([]);
  const [cityOpen,   setCityOpen]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [preview,    setPreview]    = useState(null);
  const cityRef  = useRef(null);
  const fileRef  = useRef(null);

  useEffect(() => {
    if (open && user) {
      setForm({
        name:     user.name     || '',
        city:     user.city     || '',
        role:     user.role     || '',
        bio:      user.bio      || '',
        yearsExp: user.yearsExp != null ? String(user.yearsExp) : '',
        status:   user.status   || '',
      });
      setCityQ(user.city || '');
      setPreview(user.photoURL || null);
    }
  }, [open, user?.uid]);

  useEffect(() => {
    function outside(e) { if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false); }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  useEffect(() => {
    const q = cityQ.trim();
    if (!q || form.city) { setCityR([]); return; }
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&layer=city&lang=en`);
        const data = await res.json();
        setCityR((data.features || []).filter(f => f.properties?.name).map(f => ({
          name: f.properties.name,
          full: [f.properties.name, f.properties.state, f.properties.country].filter(Boolean).join(', '),
        })));
      } catch { setCityR([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [cityQ, form.city]);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm(p => ({ ...p, photoURL: url }));
    } finally { setUploading(false); }
  }

  if (!open) return null;

  const { bg, tc } = { bg: '#EEEDFE', tc: '#3C3489' };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">Edit profile</div>

        {/* Photo upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {preview
              ? <img src={preview} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}/>
              : <div style={{ width: 64, height: 64, borderRadius: '50%', background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>{user?.initials}</div>
            }
            <button type="button" className="photo-edit-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }}/> : <i className="ti ti-camera"/>}
            </button>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Profile photo</div>
            <div style={{ fontSize: 12, color: '#888780' }}>JPG or PNG, max 5MB</div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange}/>
        </div>

        <div className="auth-field" style={{ marginBottom: 10 }}>
          <label className="auth-label">Display name</label>
          <input className="modal-input" placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/>
        </div>

        <div className="auth-field" style={{ marginBottom: 10 }}>
          <label className="auth-label">Bio</label>
          <textarea className="modal-input" rows={2} style={{ resize: 'none' }} maxLength={160} placeholder="A few words about what you do…" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}/>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div className="auth-field" style={{ flex: 1 }}>
            <label className="auth-label">Role</label>
            <select className="modal-input auth-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="">Select role…</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="auth-field" style={{ width: 90 }}>
            <label className="auth-label">Years exp.</label>
            <input className="modal-input" type="number" min={0} max={60} placeholder="0" value={form.yearsExp} onChange={e => setForm(p => ({ ...p, yearsExp: e.target.value }))}/>
          </div>
        </div>

        <div className="auth-field" style={{ marginBottom: 10 }}>
          <label className="auth-label">Status</label>
          <select className="modal-input auth-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="">No status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="auth-field" style={{ marginBottom: 16, position: 'relative' }} ref={cityRef}>
          <label className="auth-label">City</label>
          <div className="auth-input-icon" style={{ background: '#F7F6F2', borderRadius: 9, border: '1px solid #E8E6DF' }}>
            <i className="ti ti-map-pin" style={{ fontSize: 14, color: '#B4B2A9' }}/>
            <input className="auth-input-inner" placeholder="Search your city…"
              value={form.city || cityQ}
              onFocus={() => { if (form.city) { setForm(p => ({ ...p, city: '' })); setCityQ(''); } setCityOpen(true); }}
              onChange={e => { setCityQ(e.target.value); setForm(p => ({ ...p, city: '' })); setCityOpen(true); }}
            />
          </div>
          {cityOpen && cityR.length > 0 && (
            <div className="auth-city-drop">
              {cityR.map(r => (
                <button type="button" key={r.full} className="city-drop-item"
                  onClick={() => { setForm(p => ({ ...p, city: r.name })); setCityQ(r.name); setCityOpen(false); }}>
                  <span>{r.name}</span>
                  <span className="city-drop-sub">{r.full.split(',').slice(1).join(',').trim()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
