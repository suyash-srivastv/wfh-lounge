import EmptyState from '../components/EmptyState';
import MsgDelete from '../components/MsgDelete';
import WarRoom from '../components/WarRoom';
import HomeHero from '../components/HomeHero';
import LoadMore from '../components/LoadMore';

// "2026-10-02" → { mon: 'Oct', day: '02', wd: 'Fri' }; anything else (e.g. TBD) → null
function dateParts(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return { mon: d.toLocaleString('en', { month: 'short' }), day: m[3], wd: d.toLocaleString('en', { weekday: 'short' }) };
}
// "15:30" → "3:30 pm"; anything else is shown as-is ("Time TBD")
function niceTime(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || '');
  if (!m) return t && t !== 'TBD' ? t : 'Time TBD';
  const h = +m[1];
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'am' : 'pm'}`;
}

function EventsScreen({ events, hasMore, onLoadMore, city, userId, userName, rsvp, deleteEvent, onHostEvent, isAdmin }){
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
            <div key={ev.id} className="card ev-card">
              <div className="ev-top">
                <div className={'ev-date' + (d ? '' : ' tbd')}>
                  {d ? <><span className="ev-mon">{d.mon}</span><span className="ev-day">{d.day}</span><span className="ev-wd">{d.wd}</span></> : <span className="ev-mon">TBD</span>}
                </div>
                <div className="ev-main">
                  <div className="ev-title">{ev.title}</div>
                  <div className="ev-meta"><i className="ti ti-map-pin"/>{ev.location}</div>
                  <div className="ev-meta">
                    <i className="ti ti-clock"/>{niceTime(ev.time)}
                    <span className="ev-dot">·</span>{ev.type === 'IRL' ? 'In person' : 'Online'}
                  </div>
                </div>
                {ev.hostId===userId&&<button className="delete-btn" title="Delete event" onClick={e=>{e.stopPropagation();deleteEvent(ev.id);}}><i className="ti ti-trash"/></button>}
                {ev.hostId!==userId&&isAdmin&&<MsgDelete visible title="Delete event (admin)" onDelete={()=>deleteEvent(ev.id)}/>}
              </div>
              {ev.tags?.length > 0 && <div className="ev-tags">{ev.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>}
              <div className="ev-foot">
                <div className="ev-going"><i className="ti ti-users"/>{ev.attendeeCount||0} going</div>
                <button className={"rsvp-btn"+(going?" going":"")} onClick={()=>rsvp(ev.id)}>{going?"✓ Going":"RSVP"}</button>
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
