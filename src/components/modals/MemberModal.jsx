import Avatar from '../Avatar';

function MemberModal({ member, onClose, onConnect, currentUserId }) {
  if (!member) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal member-modal" onClick={e => e.stopPropagation()}>
        <button className="member-modal-close" onClick={onClose}><i className="ti ti-x"/></button>
        <div className="member-modal-header">
          <Avatar user={member} size={56}/>
          <div>
            <div className="member-modal-name">{member.name}</div>
            {member.username && <div className="member-modal-handle">@{member.username}</div>}
            <div className="member-modal-meta">
              {member.role && <span>{member.role}</span>}
              {member.yearsExp != null && member.yearsExp !== '' && <><span style={{color:'#D3D1C7'}}>·</span><span>{member.yearsExp} yrs</span></>}
              {member.city && <><span style={{color:'#D3D1C7'}}>·</span><span><i className="ti ti-map-pin" style={{fontSize:11,verticalAlign:-1,marginRight:2}}/>{member.city}</span></>}
            </div>
          </div>
        </div>

        {member.status && (
          <div style={{marginBottom:12}}>
            <span style={{fontSize:12,fontWeight:500,padding:'3px 10px',borderRadius:20,background:'#EEEDFE',color:'#3C3489'}}>
              {member.status}
            </span>
          </div>
        )}

        {member.bio && <p className="member-modal-bio">{member.bio}</p>}

        {member.skills?.length > 0 && (
          <div className="member-modal-section">
            <div className="member-modal-label">Skills</div>
            <div>{member.skills.map(s => <span key={s} className="tag">{s}</span>)}</div>
          </div>
        )}

        <div className="member-modal-stats">
          <div className="member-modal-stat"><span>{member.conn || 0}</span>connections</div>
          <div className="member-modal-stat-divider"/>
          <div className="member-modal-stat"><span>{member.yearsExp || '—'}</span>yrs exp</div>
        </div>

        {member.id !== currentUserId && (
          <button className={"connect-btn" + (member.connected ? " connected" : "") + " member-modal-connect"} onClick={onConnect}>
            {member.connected ? "✓ Connected" : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}

export default MemberModal;
