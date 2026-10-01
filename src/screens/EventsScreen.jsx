import EmptyState from '../components/EmptyState';
import MsgDelete from '../components/MsgDelete';
import WarRoom from '../components/WarRoom';
import HomeHero from '../components/HomeHero';
import LoadMore from '../components/LoadMore';

function EventsScreen({ events, hasMore, onLoadMore, city, userId, userName, rsvp, deleteEvent, onHostEvent, isAdmin }){
  return (
    <div>
      <HomeHero name={userName} city={city} count={events.length}/>
      <div className="page-header">
        <div><div className="page-title">What's on</div><div className="page-sub">{events.length}{hasMore ? '+' : ''} {events.length === 1 && !hasMore ? 'event' : 'events'} · {city} · small plans, real people</div></div>
        <button className="btn-primary" onClick={onHostEvent}><i className="ti ti-plus"/>Host event</button>
      </div>
      <WarRoom city={city}/>
      <div className="grid3" style={{marginTop:16}}>
        {events.map(ev=>(
          <div key={ev.id} className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span className={"badge "+(ev.type==="IRL"?"badge-irl":"badge-virtual")}>{ev.type==="IRL"?"📍 IRL":"🌐 Virtual"}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:11,color:"var(--text-2)"}}>{ev.city}</span>
                {ev.hostId===userId&&<button className="delete-btn" title="Delete event" onClick={e=>{e.stopPropagation();deleteEvent(ev.id);}}><i className="ti ti-trash"/></button>}
                {ev.hostId!==userId&&isAdmin&&<MsgDelete visible title="Delete event (admin)" onDelete={()=>deleteEvent(ev.id)}/>}
              </div>
            </div>
            <div style={{fontWeight:600,fontSize:14,lineHeight:1.3,marginBottom:6}}>{ev.title}</div>
            <div style={{fontSize:12,color:"var(--text-2)",display:"flex",alignItems:"center",gap:4,marginBottom:8}}>
              <i className="ti ti-map-pin" style={{fontSize:13}}/>{ev.location}
            </div>
            <div style={{display:"flex",gap:12,fontSize:12,color:"var(--text-dim)",marginBottom:8}}>
              <span><i className="ti ti-calendar" style={{fontSize:12,verticalAlign:-1}}/> {ev.date}</span>
              <span><i className="ti ti-clock" style={{fontSize:12,verticalAlign:-1}}/> {ev.time}</span>
            </div>
            <div style={{marginBottom:10}}>{ev.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
            <hr className="divider"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:"var(--text-2)"}}><i className="ti ti-users" style={{fontSize:12,verticalAlign:-1}}/> {ev.attendeeCount||0} going</div>
              <button className={"rsvp-btn"+(!!(ev.rsvps?.[userId])?" going":"")} onClick={()=>rsvp(ev.id)}>
                {!!(ev.rsvps?.[userId])?"✓ Going":"RSVP"}
              </button>
            </div>
          </div>
        ))}
        {events.length===0&&<EmptyState style={{gridColumn:"1/-1"}} title={`Nothing planned in ${city} yet`} line="Host the first coffee — someone's been waiting for an excuse."
          action={<button className="btn-primary" onClick={onHostEvent}><i className="ti ti-plus"/>Host an event</button>}/>}
      </div>
      <LoadMore hasMore={hasMore} onLoadMore={onLoadMore}/>
    </div>
  );
}

export default EventsScreen;
