import React from 'react';

function IdeasTab({ ideas, city, upvote }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Startup ideas</div><div className="page-sub">Post ideas · find co-founders · validate fast</div></div>
        <button className="btn-primary"><i className="ti ti-plus"/>Post idea</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {ideas.map(idea=>(
          <div key={idea.id} className="card" style={{display:"flex",gap:14}}>
            <div style={{flexShrink:0}}>
              <button className={"upvote-btn"+(idea.upvoted?" upvoted":"")} onClick={()=>upvote(idea.id)}>
                <i className="ti ti-arrow-up"/>{idea.votes}
              </button>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                <div style={{fontWeight:600,fontSize:15}}>{idea.title}</div>
                <span className={"badge badge-"+idea.stage.toLowerCase()}>{idea.stage}</span>
              </div>
              <div style={{fontSize:13,color:"#555550",lineHeight:1.6,marginBottom:10}}>{idea.desc}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>{idea.tags.map(t=><span key={t} className="tag">{t}</span>)} <span style={{fontSize:11,color:"#888780",marginLeft:4}}>{idea.author} · {idea.city}</span></div>
                <div style={{fontSize:12,color:"#7F77DD",fontWeight:500}}>Looking for: {idea.looking.join(", ")}</div>
              </div>
            </div>
          </div>
        ))}
        {ideas.length===0&&<div className="empty">No ideas in {city} yet.</div>}
      </div>
    </div>
  );
}

export default IdeasTab;
