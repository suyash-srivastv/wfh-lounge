import React from 'react';

function EventsTab({ events, city, rsvp }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Upcoming meetups</div><div className="page-sub">{events.length} events · {city}</div></div>
        <button className="btn-primary"><i className="ti ti-plus"/>Host event</button>
      </div>
      <div className="grid3">
        {events.map(ev=>(
          <div key={ev.id} className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span className={"badge "+(ev.type==="IRL"?"badge-irl":"badge-virtual")}>{ev.type==="IRL"?"📍 IRL":"🌐 Virtual"}</span>
              <span style={{fontSize:11,color:"#888780"}}>{ev.city}</span>
            </div>
            <div style={{fontWeight:600,fontSize:14,lineHeight:1.3,marginBottom:6}}>{ev.title}</div>
            <div style={{fontSize:12,color:"#888780",display:"flex",alignItems:"center",gap:4,marginBottom:8}}>
              <i className="ti ti-map-pin" style={{fontSize:13}}/>{ev.location}
            </div>
            <div style={{display:"flex",gap:12,fontSize:12,color:"#555550",marginBottom:8}}>
              <span><i className="ti ti-calendar" style={{fontSize:12,verticalAlign:-1}}/> {ev.date}</span>
              <span><i className="ti ti-clock" style={{fontSize:12,verticalAlign:-1}}/> {ev.time}</span>
            </div>
            <div style={{marginBottom:10}}>{ev.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
            <hr className="divider"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:"#888780"}}><i className="ti ti-users" style={{fontSize:12,verticalAlign:-1}}/> {ev.attendees} going</div>
              <button className={"rsvp-btn"+(ev.going?" going":"")} onClick={()=>rsvp(ev.id)}>{ev.going?"✓ Going":"RSVP"}</button>
            </div>
          </div>
        ))}
        {events.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>No events in {city} yet — be the first to host one!</div>}
      </div>
    </div>
  );
}

export default EventsTab;
