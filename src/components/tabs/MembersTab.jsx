import React from 'react';

function MembersTab({ members, city, connect }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Member network</div><div className="page-sub">{members.length} members · {city}</div></div>
        <button className="btn-primary"><i className="ti ti-user-plus"/>Invite someone</button>
      </div>
      <div className="grid2">
        {members.map(m=>(
          <div key={m.id} className="card">
            <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:m.bg,color:m.tc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{m.ini}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                <div style={{fontSize:12,color:"#888780"}}>{m.role}</div>
              </div>
              <span className={m.online?"dot-online":"dot-offline"}/>
            </div>
            <div style={{fontSize:12,color:"#555550",display:"flex",alignItems:"center",gap:4,marginBottom:9}}>
              <i className="ti ti-map-pin" style={{fontSize:12}}/>{m.city}
            </div>
            <div style={{marginBottom:12}}>{m.skills.map(s=><span key={s} className="tag">{s}</span>)}</div>
            <hr className="divider"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:"#888780"}}>{m.conn} connections · {m.events} events</div>
              <button className={"connect-btn"+(m.connected?" connected":"")} onClick={()=>connect(m.id)}>{m.connected?"✓ Connected":"Connect"}</button>
            </div>
          </div>
        ))}
        {members.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>No members in {city} yet.</div>}
      </div>
    </div>
  );
}

export default MembersTab;
