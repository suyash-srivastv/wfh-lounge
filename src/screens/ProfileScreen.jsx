import { useState, useRef, useEffect } from 'react';
import { timeAgo, STATUSES } from '../constants';
import Avatar from '../components/Avatar';
import { MyBadge } from '../badges';

const STATUS_DOT = {
  'Open to work':            '#1D9E75',
  'Building something':      'var(--accent)',
  'Available for freelance': '#0ea5e9',
  'Looking for co-founder':  '#f59e0b',
  'Not available':           'var(--scrollbar)',
};

function StatusPicker({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  function pick(s) { onChange(s); setOpen(false); }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="status-chip" onClick={() => setOpen(p => !p)}>
        {current ? (
          <>
            <span className="status-dot" style={{ background: STATUS_DOT[current] || 'var(--scrollbar)' }}/>
            <span>{current}</span>
          </>
        ) : (
          <>
            <span className="status-dot" style={{ background: 'var(--scrollbar)', opacity: 0.5 }}/>
            <span style={{ color: 'var(--text-3)' }}>Set a status</span>
          </>
        )}
        <i className="ti ti-chevron-down" style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2 }}/>
      </button>

      {open && (
        <div className="status-dropdown">
          {STATUSES.map(s => (
            <button key={s} className={'status-drop-item' + (current === s ? ' active' : '')} onClick={() => pick(s)}>
              <span className="status-dot" style={{ background: STATUS_DOT[s] }}/>
              <span>{s}</span>
              {current === s && <i className="ti ti-check" style={{ fontSize: 12, color: 'var(--accent)', marginLeft: 'auto' }}/>}
            </button>
          ))}
          {current && (
            <>
              <div style={{ height: 1, background: 'var(--border-sub)', margin: '4px 0' }}/>
              <button className="status-drop-item" onClick={() => pick('')} style={{ color: 'var(--text-2)' }}>
                <span className="status-dot" style={{ background: 'var(--scrollbar)', opacity: 0.5 }}/>
                <span>Clear status</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ user, stats, userPosts, openEdit, setShowProfile, deleteThread, onNewPost, onStatusChange }){
  return (
    <div className="profile-page">
      <button className="profile-back" onClick={() => setShowProfile(false)}>
        <i className="ti ti-arrow-left"/>Back
      </button>

      {/* Profile card */}
      <div className="profile-page-header">

        {/* Top row: avatar + info + edit */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Avatar user={user} size={68} style={{ flexShrink: 0, marginTop: 2 }}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-page-name">{user.name}</div>
            {user.username && (
              <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 1, marginBottom: 6 }}>@{user.username}</div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px 8px', marginBottom: 10 }}>
              {user.role && <span>{user.role}</span>}
              {user.yearsExp != null && user.yearsExp !== '' && (
                <><span style={{ color: 'var(--scrollbar)' }}>·</span><span>{user.yearsExp} yrs exp</span></>
              )}
              {user.city && (
                <><span style={{ color: 'var(--scrollbar)' }}>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 11 }}/>{user.city}
                </span></>
              )}
            </div>
            <StatusPicker current={user.status} onChange={onStatusChange}/>
            <MyBadge user={user}/>
          </div>
          <button className="btn-primary" style={{ flexShrink: 0 }} onClick={openEdit}>
            <i className="ti ti-edit"/>Edit
          </button>
        </div>

        {/* Bio at bottom of card */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-sub)' }}>
          {user.bio?.trim() ? (
            <p style={{ margin: 0, fontSize: 13, color: '#444441', lineHeight: 1.75 }}>{user.bio.trim()}</p>
          ) : (
            <button onClick={openEdit} style={{ border: 'none', background: 'none', padding: 0, fontSize: 13, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-pencil" style={{ fontSize: 13 }}/>Add a bio
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat"><div className="profile-stat-val">{userPosts.length}</div><div className="profile-stat-label">Posts</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{stats.liked}</div><div className="profile-stat-label">Liked</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{stats.going}</div><div className="profile-stat-label">RSVPs</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{Object.keys(user.connections || {}).length}</div><div className="profile-stat-label">Connected</div></div>
      </div>

      {/* My posts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="page-title">My posts</div>
        <button className="btn-primary" onClick={onNewPost}><i className="ti ti-plus"/>Add post</button>
      </div>

      {userPosts.length === 0 ? (
        <div className="empty" style={{ paddingTop: 24 }}>
          No posts yet —{' '}
          <button onClick={onNewPost} style={{ border: 'none', background: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>
            write your first post
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {userPosts.map(t => (
            <div key={t.id} className="thread-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4, flex: 1 }}>{t.title}</div>
                <button className="delete-btn" title="Delete post" onClick={() => deleteThread(t.id)}><i className="ti ti-trash"/></button>
              </div>
              {t.body && <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 8 }}>{t.body}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-2)' }}>
                <span>{timeAgo(t.createdAt?.toDate())}</span>
                <span><i className="ti ti-message" style={{ fontSize: 12, verticalAlign: -1 }}/> {t.replyCount || 0}</span>
                <span><i className="ti ti-heart" style={{ fontSize: 12, verticalAlign: -1 }}/> {t.likeCount || 0}</span>
                {t.city !== 'All' && <span className="tag">{t.city}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfileScreen;
