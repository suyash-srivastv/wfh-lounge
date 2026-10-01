import { useEffect } from 'react';
import Avatar from '../Avatar';
import MsgDelete from '../MsgDelete';
import { useProfiles } from '../../hooks/useFirestoreListeners';
import { dateParts, niceTime, calendarLink, isLink, mapsLink } from '../../eventFormat';

const NOT_A_PERSON = new Set(['seed', 'stillroom-team']);

// Full details for one event: when, where (with maps / join link), host,
// description, who's going, RSVP and add-to-calendar.
function EventDetailModal({ ev, userId, isAdmin, onClose, rsvp, onViewProfile, deleteEvent }) {
  const goingIds = Object.keys(ev?.rsvps || {});
  const people = useProfiles(ev ? { uid: userId } : null, goingIds);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!ev) return null;
  const d = dateParts(ev.date);
  const going = !!ev.rsvps?.[userId];
  const cal = calendarLink(ev);
  const online = ev.type !== 'IRL';
  const hostIsPerson = ev.hostId && !NOT_A_PERSON.has(ev.hostId);
  const open = uid => { onClose(); onViewProfile(uid); };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal ed" onClick={e => e.stopPropagation()} role="dialog" aria-label={ev.title}>
        <button className="ed-close" onClick={onClose} aria-label="Close"><i className="ti ti-x"/></button>

        <div className="ed-head">
          <div className={'ev-date' + (d ? '' : ' tbd')}>
            {d ? <><span className="ev-mon">{d.mon}</span><span className="ev-day">{d.day}</span><span className="ev-wd">{d.wd}</span></> : <span className="ev-mon">TBD</span>}
          </div>
          <div>
            <div className="ed-kind">{online ? '🌐 Online' : '📍 In person'}{ev.city && ev.city !== 'All' ? ` · ${ev.city}` : ''}</div>
            <h2 className="ed-title">{ev.title}</h2>
          </div>
        </div>

        <div className="ed-rows">
          <div className="ed-row"><i className="ti ti-calendar"/><span>{d ? d.long : 'Date to be decided'} · {niceTime(ev.time)}</span></div>
          <div className="ed-row"><i className={'ti ' + (online ? 'ti-video' : 'ti-map-pin')}/>
            <span className="ed-where">{isLink(ev.location) ? 'Online meeting link' : ev.location}</span>
          </div>
        </div>

        <div className="ed-links">
          {isLink(ev.location)
            ? <a className="connect-btn" href={ev.location} target="_blank" rel="noopener noreferrer"><i className="ti ti-external-link"/> Join online</a>
            : !online && <a className="connect-btn" href={mapsLink(ev)} target="_blank" rel="noopener noreferrer"><i className="ti ti-map-2"/> Open in Google Maps</a>}
          {cal && <a className="connect-btn" href={cal} target="_blank" rel="noopener noreferrer"><i className="ti ti-calendar-plus"/> Add to Google Calendar</a>}
        </div>

        <div className="ed-section">
          <div className="ed-label">Hosted by</div>
          {hostIsPerson
            ? <button className="ed-person" onClick={() => open(ev.hostId)}>
                <Avatar user={people.items.find(p => p.id === ev.hostId) || { id: ev.hostId, name: ev.host, initials: (ev.host || '?').slice(0, 2).toUpperCase() }} size={36}/>
                <span><b>{ev.host}</b><span>View profile</span></span><i className="ti ti-chevron-right"/>
              </button>
            : <div className="ed-person static"><span><b>{ev.host || 'The Stillroom'}</b></span></div>}
        </div>

        {ev.desc && (
          <div className="ed-section">
            <div className="ed-label">About this event</div>
            <p className="ed-desc">{ev.desc}</p>
          </div>
        )}

        {ev.tags?.length > 0 && <div className="ev-tags">{ev.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}

        <div className="ed-section">
          <div className="ed-label">Going · {ev.attendeeCount || goingIds.length}</div>
          <div className="ed-going">
            {people.items.filter(p => goingIds.includes(p.id)).map(p => (
              <button key={p.id} className="ed-chip" onClick={() => p.id === userId ? null : open(p.id)} disabled={p.id === userId}>
                <Avatar user={p} size={26}/><span>{p.id === userId ? 'You' : p.name.split(' ')[0]}</span>
              </button>
            ))}
            {people.loading && <span className="ed-muted">Loading…</span>}
            {!people.loading && goingIds.length === 0 && <span className="ed-muted">No one yet — be the first.</span>}
          </div>
        </div>

        <div className="ed-foot">
          {(ev.hostId === userId || isAdmin) && (
            <MsgDelete visible title="Delete event" onDelete={async () => { await deleteEvent(ev.id); onClose(); }}/>
          )}
          <button className={'rsvp-btn ed-rsvp' + (going ? ' going' : '')} onClick={() => rsvp(ev.id)}>{going ? '✓ Going' : 'RSVP'}</button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailModal;
