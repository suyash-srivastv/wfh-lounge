import Avatar from '../components/Avatar';

const STATUS_COLORS = {
  'Open to work':         { bg: '#EAF3DE', tc: '#27500A' },
  'Building something':   { bg: '#EEEDFE', tc: '#3C3489' },
  'Available for freelance': { bg: '#E1F5EE', tc: '#085041' },
  'Looking for co-founder':  { bg: '#FAEEDA', tc: '#633806' },
  'Not available':        { bg: '#F1EFE8', tc: '#888780' },
};

function MembersScreen({ members, city, userId, userConnections, connect, onSelect, onInvite }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Member network</div><div className="page-sub">{members.length} members · {city}</div></div>
        <button className="btn-primary" onClick={onInvite}><i className="ti ti-user-plus"/>Invite someone</button>
      </div>
      <div className="grid2">
        {members.map(m=>(
          <div key={m.id} className="card" style={{cursor:"pointer"}} onClick={()=>onSelect(m)}>
            <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}>
              <Avatar user={m} size={44}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                <div style={{fontSize:12,color:"#888780"}}>{m.role}{m.yearsExp ? ` · ${m.yearsExp}y exp` : ''}</div>
              </div>
            </div>
            {m.status && (
              <div style={{marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:20,...(STATUS_COLORS[m.status]||{bg:'#F1EFE8',tc:'#888780'})}}>
                  {m.status}
                </span>
              </div>
            )}
            <div style={{fontSize:12,color:"#555550",display:"flex",alignItems:"center",gap:4,marginBottom:m.skills?.length?8:0}}>
              {m.city&&<><i className="ti ti-map-pin" style={{fontSize:12}}/>{m.city}</>}
            </div>
            {m.skills?.length>0&&<div style={{marginBottom:10}}>{m.skills.map(s=><span key={s} className="tag">{s}</span>)}</div>}
            <hr className="divider"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:"#888780"}}>{m.conn||0} connections</div>
              {m.id!==userId&&(
                <button className={"connect-btn"+(!!(userConnections[m.id])?" connected":"")} onClick={e=>{e.stopPropagation();connect(m.id);}}>
                  {!!(userConnections[m.id])?"✓ Connected":"Connect"}
                </button>
              )}
              {m.id===userId&&<span style={{fontSize:11,color:"#B4B2A9"}}>You</span>}
            </div>
          </div>
        ))}
        {members.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>No members in {city} yet.</div>}
      </div>
    </div>
  );
}

export default MembersScreen;
