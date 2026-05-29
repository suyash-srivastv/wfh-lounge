import React from 'react';

function HostEventModal({ open, onClose, newEvent, setNewEvent, submitEvent }){
  if(!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Host an event</div>
        <div className="modal-type-toggle">
          <button className={"modal-type-btn"+(newEvent.type==="IRL"?" active":"")} onClick={()=>setNewEvent(p=>({...p,type:"IRL"}))}>📍 IRL</button>
          <button className={"modal-type-btn"+(newEvent.type==="Virtual"?" active":"")} onClick={()=>setNewEvent(p=>({...p,type:"Virtual"}))}>🌐 Virtual</button>
        </div>
        <input className="modal-input" placeholder="Event title…" value={newEvent.title} onChange={e=>setNewEvent(p=>({...p,title:e.target.value}))}/>
        <input className="modal-input" placeholder={newEvent.type==="IRL"?"Venue / café / coworking space…":"Zoom, Google Meet link…"} value={newEvent.location} onChange={e=>setNewEvent(p=>({...p,location:e.target.value}))}/>
        <div style={{display:"flex",gap:8}}>
          <input className="modal-input" type="date" style={{flex:1}} value={newEvent.date} onChange={e=>setNewEvent(p=>({...p,date:e.target.value}))}/>
          <input className="modal-input" type="time" style={{flex:1}} value={newEvent.time} onChange={e=>setNewEvent(p=>({...p,time:e.target.value}))}/>
        </div>
        <input className="modal-input" placeholder="Tags — cowork, casual, startup… (comma separated)" value={newEvent.tags} onChange={e=>setNewEvent(p=>({...p,tags:e.target.value}))}/>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submitEvent} disabled={!newEvent.title.trim()||!newEvent.location.trim()}>Create event</button>
        </div>
      </div>
    </div>
  );
}

export default HostEventModal;
