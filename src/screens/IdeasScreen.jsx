function IdeasScreen({ ideas, city, userId, upvote, deleteIdea, onPostIdea, reactIdea, reactions }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Startup ideas</div><div className="page-sub">Post ideas · find co-founders · validate fast</div></div>
        <button className="btn-primary" onClick={onPostIdea}><i className="ti ti-plus"/>Post idea</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {ideas.map(idea=>(
          <div key={idea.id} className="card" style={{display:"flex",gap:14}}>
            <div style={{flexShrink:0}}>
              <button className={"upvote-btn"+(!!(idea.upvotes?.[userId])?" upvoted":"")} onClick={()=>upvote(idea.id)}>
                <i className="ti ti-arrow-up"/>{idea.votes}
              </button>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                <div style={{fontWeight:600,fontSize:15}}>{idea.title}</div>
                <span className={"badge badge-"+idea.stage.toLowerCase()}>{idea.stage}</span>
              </div>
              <div style={{fontSize:13,color:"var(--text-dim)",lineHeight:1.6,marginBottom:10}}>{idea.desc}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  {idea.tags.map(t=><span key={t} className="tag">{t}</span>)}
                  <span style={{fontSize:11,color:"var(--text-2)",marginLeft:4}}>{idea.author} · {idea.city}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {idea.looking?.length>0&&<div style={{fontSize:12,color:"var(--accent)",fontWeight:500}}>Looking for: {idea.looking.join(", ")}</div>}
                  {idea.authorId===userId&&<button className="delete-btn" title="Delete idea" onClick={()=>deleteIdea(idea.id)}><i className="ti ti-trash"/></button>}
                </div>
              </div>
              {reactions && (
                <div className="reactions">
                  {reactions.map(emoji => {
                    const count   = Object.keys(idea.reactions?.[emoji] || {}).length;
                    const reacted = !!(idea.reactions?.[emoji]?.[userId]);
                    return (
                      <button key={emoji} className={'reaction-btn'+(reacted?' reacted':'')}
                        onClick={e=>{e.stopPropagation();reactIdea(idea.id,emoji);}}>
                        {emoji}{count>0&&<span>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        {ideas.length===0&&<div className="empty">No ideas in {city} yet.</div>}
      </div>
    </div>
  );
}

export default IdeasScreen;
