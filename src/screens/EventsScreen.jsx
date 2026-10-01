import { dateParts, niceTime } from '../eventFormat';
import EmptyState from '../components/EmptyState';
import MsgDelete from '../components/MsgDelete';
import WarRoom from '../components/WarRoom';
import HomeHero from '../components/HomeHero';
import LoadMore from '../components/LoadMore';
import Avatar from '../components/Avatar';
import { useProfiles } from '../hooks/useFirestoreListeners';

const NOT_A_PERSON = ['seed', 'stillroom-team'];
const first = name => (name || '').trim().split(/\s+/)[0] || 'someone';
const FACES = 4; // faces shown per card; one profile fetch covers every card

// Up to FACES attendees per event, you first.
function goingIds(ev, userId) {
  const ids = Object.keys(ev.rsvps || {});
  return [...ids.filter(id => id === userId), ...ids.filter(id => id !== userId).sort()].slice(0, FACES);
}

function whoGoing(ev, people, userId) {
  const total = ev.attendeeCount || Object.keys(ev.rsvps || {}).length;
  if (!total) return 'No one yet — be the first';
  const names = goingIds(ev, userId).map(id => id === userId ? 'You' : people[id]?.name.split(' ')[0]).filter(Boolean).slice(0, 2);
  if (!names.length) return `${total} going`;
  const rest = total - names.length;
  return `${names.join(', ')}${rest > 0 ? ` +${rest}` : ''} going`;
}

function EventsScreen({ events, hasMore, onLoadMore, city, userId, userName, rsvp, deleteEvent, onHostEvent, isAdmin, onOpenEvent, onViewProfile }){
  const ids = [...new Set(events.flatMap(ev => goingIds(ev, userId)))];
  const loaded = useProfiles(userId ? { uid: userId } : null, ids);
  const people = Object.fromEntries(loaded.items.map(p => [p.id, p]));
  return (
    <div>
      <HomeHero name={userName} city={city} count={events.length}/>
      <div className="page-header">
        <div><div className="page-title">What's on</div><div className="page-sub">{events.length}{hasMore ? '+' : ''} {events.length === 1 && !hasMore ? 'event' : 'events'} · {city}<span className="sub-extra"> · small plans, real people</span></div></div>
        <button className="btn-primary" onClick={onHostEvent}><i className="ti ti-plus"/>Host event</button>
      </div>
      <WarRoom city={city}/>
      <div className="grid3" style={{marginTop:16}}>
        {events.map(ev=>{
          const going = !!(ev.rsvps?.[userId]);
          const d = dateParts(ev.date);
          return (
            <div key={ev.id} className="card ev-card" role="button" tabIndex={0}
              onClick={() => onOpenEvent(ev.id)} onKeyDown={e => { if (e.key === 'Enter') onOpenEvent(ev.id); }}>
              <div className="ev-top">
                <div className={'ev-date' + (d ? '' : ' tbd')}>
                  {d ? <><span className="ev-mon">{d.mon}</span><span className="ev-day">{d.day}</span><span className="ev-wd">{d.wd}</span></> : <span className="ev-mon">TBD</span>}
                </div>
                <div className="ev-main">
                  <div className="ev-title">{ev.title}</div>
                  <div className="ev-meta"><i className="ti ti-clock"/><span>{niceTime(ev.time)} · {ev.type === 'IRL' ? 'In person' : 'Online'}</span></div>
                  <div className="ev-meta"><i className={'ti ' + (ev.type === 'IRL' ? 'ti-map-pin' : 'ti-video')}/><span className="wrap">{/^https?:\/\//i.test(ev.location || '') ? 'Online link' : ev.location}</span></div>
                  {ev.host && <div className="ev-meta"><i className="ti ti-user"/><span>Hosted by{' '}
                    {ev.hostId && !NOT_A_PERSON.includes(ev.hostId)
                      ? <button className="ev-host-link" onClick={e => { e.stopPropagation(); ev.hostId === userId ? onOpenEvent(ev.id) : onViewProfile(ev.hostId); }}>{ev.hostId === userId ? 'you' : first(ev.host)}</button>
                      : <b>{first(ev.host)}</b>}</span></div>}
                </div>
                {ev.hostId===userId&&<button className="delete-btn" title="Delete event" onClick={e=>{e.stopPropagation();deleteEvent(ev.id);}}><i className="ti ti-trash"/></button>}
                {ev.hostId!==userId&&isAdmin&&<span onClick={e=>e.stopPropagation()}><MsgDelete visible title="Delete event (admin)" onDelete={()=>deleteEvent(ev.id)}/></span>}
              </div>
              <div className="ev-foot">
                <div className="ev-going">
                  {goingIds(ev, userId).some(id => people[id]) && <span className="ev-faces">
                    {goingIds(ev, userId).filter(id => people[id]).map(id => <Avatar key={id} user={people[id]} size={24} className="ev-face"/>)}
                  </span>}
                  <span className="ev-who">{whoGoing(ev, people, userId)}</span>
                </div>
                <button className={"rsvp-btn"+(going?" going":"")} onClick={e=>{e.stopPropagation();rsvp(ev.id);}}>{going?"✓ Going":"RSVP"}</button>
              </div>
            </div>
          );
        })}
        {events.length===0&&<EmptyState style={{gridColumn:"1/-1"}} title={`Nothing planned in ${city} yet`} line="Host the first coffee — someone's been waiting for an excuse."
          action={<button className="btn-primary" onClick={onHostEvent}><i className="ti ti-plus"/>Host an event</button>}/>}
      </div>
      <LoadMore hasMore={hasMore} onLoadMore={onLoadMore}/>
    </div>
  );
}

export default EventsScreen;
