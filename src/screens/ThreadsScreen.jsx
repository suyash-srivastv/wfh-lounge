import { timeAgo } from '../constants';

function ThreadsScreen({ threads, city, userId, openThread, toggleThread, replyText, setReplyText, submitReply, likeThread, deleteThread, onNewPost, reactThread, reactions }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Forums</div><div className="page-sub">Async discussions · {city}</div></div>
        <button className="btn-primary" onClick={onNewPost}><i className="ti ti-plus"/>New post</button>
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
                <form style={{display:"flex",gap:8}} onSubmit={e=>{e.preventDefault();submitReply();}}>
                  <input className="chat-input" value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Write a reply…" enterKeyHint="send" autoComplete="off"/>
                  <button type="submit" className="send-btn">Reply</button>
                </form>
              </div>
            )}
            {reactions && (
              <div className="reactions" onClick={e=>e.stopPropagation()}>
                {reactions.map(emoji => {
                  const count   = Object.keys(t.reactions?.[emoji] || {}).length;
                  const reacted = !!(t.reactions?.[emoji]?.[userId]);
                  return (
                    <button key={emoji} className={'reaction-btn'+(reacted?' reacted':'')}
                      onClick={e=>{e.stopPropagation();reactThread(t.id,emoji);}}>
                      {emoji}{count>0&&<span>{count}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:14,fontSize:12,color:"var(--text-2)",marginTop:8}}>
              <span>{t.author} · {timeAgo(t.createdAt?.toDate())}</span>
              <span><i className="ti ti-message" style={{fontSize:12,verticalAlign:-1}}/> {t.replyCount||0}</span>
              <button className={"like-btn"+(!!(t.likes?.[userId])?" liked":"")} onClick={e=>likeThread(t.id,e)}>
                <i className={"ti "+(!!(t.likes?.[userId])?"ti-heart-filled":"ti-heart")} style={{fontSize:13}}/>{t.likeCount||0}
              </button>
              {t.authorId===userId&&<button className="delete-btn" style={{marginLeft:"auto"}} title="Delete post" onClick={e=>{e.stopPropagation();deleteThread(t.id);}}><i className="ti ti-trash"/></button>}
            </div>
          </div>
        ))}
        {threads.length===0&&<div className="empty">No posts yet. Start the conversation!</div>}
      </div>
    </div>
  );
}

export default ThreadsScreen;
