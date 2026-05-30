import { useState, useRef, useEffect } from 'react';

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('wfh-theme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : '';
    localStorage.setItem('wfh-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark];
}

const NAV = [
  { id: 'events',  icon: 'ti-calendar-event', label: 'Events'  },
  { id: 'chat',    icon: 'ti-message-circle', label: 'Chat'    },
  { id: 'members', icon: 'ti-users',          label: 'Members' },
  { id: 'ideas',   icon: 'ti-bulb',           label: 'Ideas'   },
  { id: 'threads', icon: 'ti-messages',       label: 'Forums'  },
];

function Nav({ tab, onTabChange, city, setCity, locStatus, detectedCity, user, showProfile, setShowProfile, openEdit, onLogout, crown, dmUnread, onDmToggle }) {
  const [dark, setDark] = useDarkMode();
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [citySearch,     setCitySearch]     = useState('');
  const [cityResults,    setCityResults]    = useState([]);
  const [cityLoading,    setCityLoading]    = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const cityPickerRef = useRef(null);
  const citySearchRef = useRef(null);
  const profileRef    = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (cityPickerRef.current && !cityPickerRef.current.contains(e.target)) {
        setCityPickerOpen(false); setCitySearch(''); setCityResults([]);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (cityPickerOpen) setTimeout(() => citySearchRef.current?.focus(), 50);
  }, [cityPickerOpen]);

  useEffect(() => {
    const q = citySearch.trim();
    if (!q) { setCityResults([]); setCityLoading(false); return; }
    setCityLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&layer=city&lang=en`);
        const data = await res.json();
        setCityResults((data.features || []).filter(f => f.properties?.name).map(f => ({
          name: f.properties.name,
          full: [f.properties.name, f.properties.state, f.properties.country].filter(Boolean).join(', '),
        })));
      } catch { setCityResults([]); }
      finally { setCityLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [citySearch]);

  function pickCity(c) { setCity(c); setCityPickerOpen(false); setCitySearch(''); }

  return (
    <>
      <div className="nav">
        <div className="nav-logo">
          <div className={'logo-icon' + (crown ? ' logo-crown' : '')}><i className="ti ti-coffee"/></div>
          WFH Lounge
        </div>
        <div className="nav-tabs">
          {NAV.map(n => (
            <button key={n.id} className={'nav-tab' + (tab === n.id && !showProfile ? ' active' : '')}
              onClick={() => onTabChange(n.id)}>
              <i className={'ti ' + n.icon}/>{n.label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <button className="dm-trigger" onClick={onDmToggle} title="Messages">
            <i className="ti ti-message-circle"/>
            {dmUnread > 0 && <span className="dm-trigger-badge">{dmUnread > 99 ? '99+' : dmUnread}</span>}
          </button>
          <button className="theme-toggle" onClick={() => setDark(d => !d)} title={dark ? 'Light mode' : 'Dark mode'}>
            <i className={'ti ' + (dark ? 'ti-sun' : 'ti-moon')}/>
          </button>
          <div className="city-picker-wrap" ref={cityPickerRef}>
            <button className="city-pill" onClick={() => setCityPickerOpen(p => !p)}>
              <i className={'ti ' + (locStatus === 'detecting' ? 'ti-loader-2' : 'ti-map-pin')}
                style={locStatus === 'detecting' ? { animation: 'spin 1s linear infinite' } : {}}/>
              <span>{locStatus === 'detecting' ? 'Detecting…' : city}</span>
              <i className="ti ti-chevron-down" style={{ fontSize: 10, color: '#B4B2A9' }}/>
            </button>
            {cityPickerOpen && (
              <div className="city-dropdown">
                <div className="city-search-wrap">
                  <i className="ti ti-search city-search-icon"/>
                  <input ref={citySearchRef} className="city-search-input" placeholder="Search any city…"
                    value={citySearch} onChange={e => setCitySearch(e.target.value)}/>
                  {cityLoading && <i className="ti ti-loader-2 city-search-spin"/>}
                </div>
                {!citySearch && (
                  <button className={'city-drop-item' + (city === 'All cities' ? ' active' : '')} onClick={() => pickCity('All cities')}>
                    <span>All cities</span>
                    {city === 'All cities' && <i className="ti ti-check" style={{ fontSize: 13, color: '#7F77DD' }}/>}
                  </button>
                )}
                {!citySearch && detectedCity && (
                  <button className={'city-drop-item' + (city === detectedCity ? ' active' : '')} onClick={() => pickCity(detectedCity)}>
                    <span>{detectedCity}</span>
                    <span className="city-auto-tag"><i className="ti ti-navigation"/>auto</span>
                  </button>
                )}
                {cityResults.map(r => (
                  <button key={r.full} className={'city-drop-item' + (city === r.name ? ' active' : '')} onClick={() => pickCity(r.name)}>
                    <span>{r.name}</span>
                    <span className="city-drop-sub">{r.full.split(',').slice(1).join(',').trim()}</span>
                  </button>
                ))}
                {citySearch && !cityLoading && cityResults.length === 0 && (
                  <div className="city-drop-empty">No results for "{citySearch}"</div>
                )}
              </div>
            )}
          </div>
          <div className="profile-wrap" ref={profileRef}>
            <button className="avatar" onClick={() => setProfileOpen(p => !p)} style={{padding:0,overflow:'hidden'}}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                : user.initials}
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <div className="profile-avatar-lg" style={{overflow:'hidden',padding:0}}>
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      : user.initials}
                  </div>
                  <div>
                    <div className="profile-name">{user.name}</div>
                    {user.role && <div className="profile-meta">{user.role}</div>}
                    {user.city && <div className="profile-meta"><i className="ti ti-map-pin" style={{ fontSize: 11 }}/>{user.city}</div>}
                  </div>
                </div>
                <div className="profile-divider"/>
                <button className="profile-item" onClick={() => { setShowProfile(true); setProfileOpen(false); }}><i className="ti ti-user"/>View profile</button>
                <button className="profile-item" onClick={() => { openEdit(); setProfileOpen(false); }}><i className="ti ti-user-edit"/>Edit profile</button>
                <button className="profile-item profile-item-danger" onClick={onLogout}><i className="ti ti-logout"/>Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="mobile-nav">
        {NAV.map(n => (
          <button key={n.id} className={'mobile-nav-btn' + (tab === n.id && !showProfile ? ' active' : '')}
            onClick={() => onTabChange(n.id)}>
            <i className={'ti ' + n.icon}/>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

export default Nav;
