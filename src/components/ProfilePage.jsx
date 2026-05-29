import React from 'react';

function ProfilePage({ user, threads, events, userPosts, openEdit, setShowProfile, deleteThread, timeAgo }){
  return (
    <div className="profile-page">
      <button className="profile-back" onClick={()=>setShowProfile(false)}><i className="ti ti-arrow-left"/>Back</button>
      <div className="profile-page-header">
        <div className="profile-page-avatar">{user.initials}</div>
        <div style={{flex:1}}>
          <div className="profile-page-name">{user.name}</div>
          {user.role&&<div className="profile-page-sub">{user.role}</div>}
          {user.city&&<div className="profile-page-sub"><i className="ti ti-map-pin" style={{fontSize:12}}/>{user.city}</div>}
        </div>
        <button className="btn-primary" onClick={openEdit}><i className="ti ti-edit"/>Edit profile</button>
      </div>
      <div className="profile-stats">
        <div className="profile-stat"><div className="profile-stat-val">{userPosts.length}</div><div className="profile-stat-label">Posts</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{threads.filter(t=>!!(t.likes?.[user.uid])).length}</div><div className="profile-stat-label">Liked</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{events.filter(e=>!!(e.rsvps?.[user.uid])).length}</div><div className="profile-stat-label">RSVPs</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{Object.keys(user.connections||{}).length}</div><div className="profile-stat-label">Connected</div></div>
      </div>
      <div className="page-title" style={{marginBottom:14}}>Posts</div>
      {userPosts.length===0 ? (
        <div className="empty">No posts yet — start a thread in the Forums tab!</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {userPosts.map(t=>(
            <div key={t.id} className="thread-card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{fontWeight:600,fontSize:14,lineHeight:1.4,flex:1}}>{t.title}</div>
                <button className="delete-btn" title="Delete post" onClick={()=>deleteThread(t.id)}><i className="ti ti-trash"/></button>
              </div>
              {t.body&&<div style={{fontSize:13,color:"#555550",lineHeight:1.6,marginBottom:8}}>{t.body}</div>}
              <div style={{display:"flex",alignItems:"center",gap:14,fontSize:12,color:"#888780"}}>
                <span>{timeAgo(t.createdAt?.toDate())}</span>
                <span><i className="ti ti-message" style={{fontSize:12,verticalAlign:-1}}/> {t.replyCount||0}</span>
                <span><i className="ti ti-heart" style={{fontSize:12,verticalAlign:-1}}/> {t.likeCount||0}</span>
                {t.city!=="All"&&<span className="tag">{t.city}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
