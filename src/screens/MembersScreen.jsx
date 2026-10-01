import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import LoadMore from '../components/LoadMore';

const STATUS_COLORS = {
  'Open to work':            { bg: '#EAF3DE', tc: '#27500A' },
  'Building something':      { bg: '#EEEDFE', tc: '#3C3489' },
  'Available for freelance': { bg: '#E1F5EE', tc: '#085041' },
  'Looking for co-founder':  { bg: '#FAEEDA', tc: '#633806' },
  'Not available':           { bg: '#F1EFE8', tc: 'var(--text-2)' },
};

function ConnectBtn({ id, userId, userConnections, sentRequests, receivedRequests, onSendRequest, onCancelRequest, onAcceptRequest }) {
  if (id === userId) return <span style={{fontSize:11,color:'var(--text-3)'}}>You</span>;

  const connected = !!(userConnections[id]);
  const sent      = !!(sentRequests[id]);
  const received  = !!(receivedRequests[id]);

  if (connected) return <button className="connect-btn connected" disabled>✓ Connected</button>;
  if (received)  return <button className="connect-btn connect-btn-accept" onClick={e=>{e.stopPropagation();onAcceptRequest(id);}}>Accept ✓</button>;
  if (sent)      return <button className="connect-btn connect-btn-pending" onClick={e=>{e.stopPropagation();onCancelRequest(id);}}>Pending…</button>;
  return <button className="connect-btn" onClick={e=>{e.stopPropagation();onSendRequest(id);}}>Connect</button>;
}

function MembersScreen({ members, hasMore, onLoadMore, loading, city, userId, userConnections, sentRequests, receivedRequests, onSendRequest, onCancelRequest, onAcceptRequest, onSelect, onInvite }) {
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">People nearby</div><div className="page-sub">{members.length}{hasMore ? '+' : ''} {members.length === 1 && !hasMore ? 'member' : 'members'} · {city} · real people, not leads</div></div>
        <button className="btn-primary" onClick={onInvite}><i className="ti ti-user-plus"/>Invite someone</button>
      </div>
      <div className="grid2">
        {members.map(m => (
          <div key={m.id} className="card" style={{cursor:'pointer'}} onClick={() => onSelect(m)}>
            <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:10}}>
              <Avatar user={m} size={44}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                <div style={{fontSize:12,color:'var(--text-2)'}}>{m.role}{m.yearsExp ? ` · ${m.yearsExp}y exp` : ''}</div>
              </div>
            </div>
            {m.vibe && <div style={{marginBottom:6}}><span className="vibe-chip">{m.vibe}</span></div>}
            {m.status && (
              <div style={{marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:20,...(STATUS_COLORS[m.status]||{bg:'var(--border-sub)',tc:'var(--text-2)'})}}>
                  {m.status}
                </span>
              </div>
            )}
            <div style={{fontSize:12,color:'var(--text-dim)',display:'flex',alignItems:'center',gap:4,marginBottom:m.skills?.length?8:0}}>
              {m.city && <><i className="ti ti-map-pin" style={{fontSize:12}}/>{m.city}</>}
            </div>
            {m.skills?.length > 0 && <div style={{marginBottom:10}}>{m.skills.map(s => <span key={s} className="tag">{s}</span>)}</div>}
            <hr className="divider"/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:11,color:'var(--text-2)'}}>{m.conn||0} {m.conn === 1 ? 'connection' : 'connections'}</div>
              <ConnectBtn id={m.id} userId={userId}
                userConnections={userConnections} sentRequests={sentRequests} receivedRequests={receivedRequests}
                onSendRequest={onSendRequest} onCancelRequest={onCancelRequest} onAcceptRequest={onAcceptRequest}/>
            </div>
          </div>
        ))}
        {members.length === 0 && (loading
          ? <div className="empty" style={{gridColumn:'1/-1'}}>Finding your people…</div>
          : <EmptyState style={{gridColumn:'1/-1'}} title={`Nobody from ${city} yet`} line="Invite a friend who needs to get out more."
              action={<button className="btn-primary" onClick={onInvite}><i className="ti ti-user-plus"/>Invite someone</button>}/>)}
      </div>
      <LoadMore hasMore={hasMore} onLoadMore={onLoadMore} loading={loading}/>
    </div>
  );
}

export default MembersScreen;
