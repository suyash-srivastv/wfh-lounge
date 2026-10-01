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

function FriendsView({ friends, loading, receivedRequests, onAcceptRequest, onDeclineRequest, onSelect, onMessage, onFindPeople }) {
  const requests = Object.entries(receivedRequests || {});
  return (
    <>
      {requests.length > 0 && (
        <section className="fr-section">
          <h3 className="fr-heading">Requests <span>{requests.length}</span></h3>
          <div className="grid2">
            {requests.map(([uid, r]) => (
              <div key={uid} className="card fr-request">
                <div style={{display:'flex',alignItems:'center',gap:11,cursor:'pointer'}} onClick={() => onSelect({ id: uid })}>
                  <Avatar user={{ id: uid, name: r.name, photoURL: r.photoURL, initials: (r.name || '??').slice(0, 2).toUpperCase() }} size={40}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14}}>{r.name}</div>
                    <div style={{fontSize:12,color:'var(--text-2)'}}>wants to connect</div>
                  </div>
                </div>
                <div className="fr-actions">
                  <button className="connect-btn" onClick={() => onDeclineRequest(uid)}>Decline</button>
                  <button className="connect-btn connect-btn-accept" onClick={() => onAcceptRequest(uid)}>Accept ✓</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="fr-section">
        {requests.length > 0 && <h3 className="fr-heading">Friends <span>{friends.length}</span></h3>}
        {friends.length === 0 ? (
          loading ? <div className="empty">Finding your people…</div> :
          <EmptyState title="No friends here yet" line="Friendships here start with a hello. Find someone nearby and tap Connect."
            action={<button className="btn-primary" onClick={onFindPeople}><i className="ti ti-map-pin"/>Find people nearby</button>}/>
        ) : (
          <div className="grid2">
            {friends.map(m => (
              <div key={m.id} className="card" style={{cursor:'pointer'}} onClick={() => onSelect(m)}>
                <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:10}}>
                  <Avatar user={m} size={44}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                    <div style={{fontSize:12,color:'var(--text-2)'}}>{m.role}{m.yearsExp ? ` · ${m.yearsExp}y exp` : ''}</div>
                  </div>
                </div>
                {m.status && <div style={{marginBottom:8}}><span className="vibe-chip">{m.status}</span></div>}
                <hr className="divider"/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:12,color:'var(--text-dim)',display:'flex',alignItems:'center',gap:4}}>
                    {m.city && <><i className="ti ti-map-pin" style={{fontSize:12}}/>{m.city}</>}
                  </div>
                  <button className="connect-btn" onClick={e => { e.stopPropagation(); onMessage(m); }}><i className="ti ti-message"/> Message</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function MembersScreen({ members, hasMore, onLoadMore, loading, city, userId, userConnections, sentRequests, receivedRequests, onSendRequest, onCancelRequest, onAcceptRequest, onDeclineRequest, onSelect, onInvite, onMessage, view, setView, friends, friendsLoading }) {
  const requestCount = Object.keys(receivedRequests || {}).length;
  const tabs = (
    <div className="seg" role="tablist">
      <button role="tab" aria-selected={view !== 'friends'} className={'seg-btn' + (view !== 'friends' ? ' on' : '')} onClick={() => setView('nearby')}>
        <i className="ti ti-map-pin"/>People nearby
      </button>
      <button role="tab" aria-selected={view === 'friends'} className={'seg-btn' + (view === 'friends' ? ' on' : '')} onClick={() => setView('friends')}>
        <i className="ti ti-users"/>Friends <span className="seg-count">{friends.length}</span>
        {requestCount > 0 && <span className="seg-badge">{requestCount}</span>}
      </button>
    </div>
  );

  if (view === 'friends') return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Your people</div><div className="page-sub">{friends.length} {friends.length === 1 ? 'friend' : 'friends'} · any city<span className="sub-extra"> · the ones you actually talk to</span></div></div>
        <button className="btn-primary" onClick={onInvite}><i className="ti ti-user-plus"/>Invite someone</button>
      </div>
      {tabs}
      <FriendsView friends={friends} loading={friendsLoading} receivedRequests={receivedRequests}
        onAcceptRequest={onAcceptRequest} onDeclineRequest={onDeclineRequest} onSelect={onSelect} onMessage={onMessage}
        onFindPeople={() => setView('nearby')}/>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">People nearby</div><div className="page-sub">{members.length}{hasMore ? '+' : ''} {members.length === 1 && !hasMore ? 'member' : 'members'} · {city}<span className="sub-extra"> · real people, not leads</span></div></div>
        <button className="btn-primary" onClick={onInvite}><i className="ti ti-user-plus"/>Invite someone</button>
      </div>
      {tabs}
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
