import { useEffect, useRef, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { timeAgo } from '../constants';

// 🔔 in the top bar: the latest 20 notifications, live. Tapping one marks it
// read and jumps to the right place (handled by the parent via onOpen).
const LOOK = {
  friend_request:   { icon: 'ti-user-plus',      text: n => <><b>{n.fromName}</b> sent you a friend request</> },
  request_accepted: { icon: 'ti-user-check',     text: n => <><b>{n.fromName}</b> accepted your request — say hi!</> },
  reply:            { icon: 'ti-message-circle', text: n => <><b>{n.fromName}</b> replied to “{n.title || 'your post'}”</> },
  event_rsvp:       { icon: 'ti-calendar-check', text: n => <><b>{n.fromName}</b> is going to “{n.title || 'your event'}”</> },
};

function NotificationBell({ userId, onOpen }) {
  const [items, setItems] = useState([]);
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'notifications', userId, 'items'), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(q, s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(n => LOOK[n.type])),
      e => console.error('Loading notifications failed:', e));
  }, [userId]);

  useEffect(() => {
    const outside = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const unread = items.filter(n => !n.read).length;

  function tap(n) {
    if (!n.read) updateDoc(doc(db, 'notifications', userId, 'items', n.id), { read: true }).catch(() => {});
    setOpen(false);
    onOpen(n);
  }

  function markAll() {
    const b = writeBatch(db);
    items.filter(n => !n.read).forEach(n => b.update(doc(db, 'notifications', userId, 'items', n.id), { read: true }));
    b.commit().catch(() => {});
  }

  return (
    <div className="nb-wrap" ref={ref}>
      <button className="dm-trigger" onClick={() => setOpen(o => !o)} title="Notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <i className="ti ti-bell"/>
        {unread > 0 && <span className="dm-trigger-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="nb-panel">
          <div className="nb-head">
            <span>Notifications</span>
            {unread > 0 && <button className="tn-link" onClick={markAll}>Mark all read</button>}
          </div>
          {items.length === 0 ? (
            <div className="nb-empty">Nothing yet. Say hi to someone — things happen fast.</div>
          ) : (
            <div className="nb-list">
              {items.map(n => (
                <button key={n.id} className={'nb-item' + (n.read ? '' : ' unread')} onClick={() => tap(n)}>
                  <span className="nb-icon"><i className={'ti ' + LOOK[n.type].icon}/></span>
                  <span className="nb-text">
                    <span>{LOOK[n.type].text(n)}</span>
                    <span className="nb-time">{timeAgo(n.createdAt?.toDate())}</span>
                  </span>
                  {!n.read && <span className="nb-dot" aria-hidden="true"/>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
