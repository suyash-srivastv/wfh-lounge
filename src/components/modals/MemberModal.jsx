import Avatar from '../Avatar';

function MemberModal({ member, onClose, onConnect, onMessage, currentUserId }) {
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

        {member.vibe && <div style={{marginBottom:10}}><span className="vibe-chip">{member.vibe}</span></div>}
        {member.status && (
          <div style={{marginBottom:12}}>
            <span style={{fontSize:12,fontWeight:500,padding:'3px 10px',borderRadius:20,background:'var(--accent-bg)',color:'var(--accent-tc)'}}>
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
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',gap:8}}>
              <button className={"connect-btn" + (member.connected ? " connected" : "") + " member-modal-connect"} onClick={onConnect}>
                {member.connected ? "✓ Connected" : "Connect"}
              </button>
              <button className="dm-btn" disabled={!member.connected} onClick={() => onMessage(member)}
                title={!member.connected ? 'Connect first to send a message' : undefined}>
                <i className="ti ti-message"/>Message
              </button>
            </div>
            {!member.connected && (
              <p style={{fontSize:11,color:'var(--text-3)',textAlign:'center',margin:0}}>
                Connect with {member.name.split(' ')[0]} to unlock messaging
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberModal;
