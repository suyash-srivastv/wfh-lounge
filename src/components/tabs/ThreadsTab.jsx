import React from 'react';

function ThreadsTab({ threads, city, openThread, toggleThread, replyText, setReplyText, submitReply, likeThread, setNewPostOpen }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Forums</div><div className="page-sub">Async discussions · {city}</div></div>
        <button className="btn-primary" onClick={()=>setNewPostOpen(true)}><i className="ti ti-plus"/>New post</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {threads.map(t=>(
          <div key={t.id} className="thread-card" onClick={()=>toggleThread(t.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{fontWeight:600,fontSize:14,lineHeight:1.4,flex:1,paddingRight:10}}>{t.title}</div>
              {t.city!=="All"&&<span className="tag">{t.city}</span>}
            </div>
            {openThread===t.id&&(
              <div className="thread-expand" onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:13,color:"#555550",lineHeight:1.7,marginBottom:12}}>{t.body}</div>
                <div style={{display:"flex",gap:8}}>
                  <input className="chat-input" value={replyText} onChange={e=>setReplyText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitReply()} placeholder="Write a reply…"/>
                  <button className="send-btn" onClick={submitReply}>Reply</button>
                </div>
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:14,fontSize:12,color:"#888780",marginTop:8}}>
              <span>{t.author} · {t.time}</span>
              <span><i className="ti ti-message" style={{fontSize:12,verticalAlign:-1}}/> {t.replies}</span>
              <button className={"like-btn"+(t.liked?" liked":"")} onClick={e=>likeThread(t.id,e)}>
                <i className={"ti "+(t.liked?"ti-heart-filled":"ti-heart")} style={{fontSize:13}}/>{t.likes}
              </button>
            </div>
          </div>
        ))}
        {threads.length===0&&<div className="empty">No posts yet. Start the conversation!</div>}
      </div>
    </div>
  );
}

export default ThreadsTab;
