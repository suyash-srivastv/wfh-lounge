const {useState,useRef,useEffect} = React;

function App(){
  // state
  const [tab,setTab]=useState("events");
  const [city,setCity]=useState("All cities");
  const [detectedCity,setDetectedCity]=useState(null);
  const [locStatus,setLocStatus]=useState("idle"); // idle | detecting | detected | failed
  const [events,setEvents]=useState(INIT_EVENTS);
  const [members,setMembers]=useState(INIT_MEMBERS);
  const [ideas,setIdeas]=useState(INIT_IDEAS);
  const [threads,setThreads]=useState(INIT_THREADS);
  const [openThread,setOpenThread]=useState(null);
  const [replyText,setReplyText]=useState("");
  const [newPostOpen,setNewPostOpen]=useState(false);
  const [newPost,setNewPost]=useState({title:"",body:""});
  const [chatRoom,setChatRoom]=useState("Jaipur");
  const [allChatMsgs,setAllChatMsgs]=useState(CHAT_DATA);
  const [chatInput,setChatInput]=useState("");
  const [cityPickerOpen,setCityPickerOpen]=useState(false);
  const [citySearch,setCitySearch]=useState("");
  const [cityResults,setCityResults]=useState([]);
  const [cityLoading,setCityLoading]=useState(false);
  const chatEnd=useRef(null);
  const cityPickerRef=useRef(null);
  const citySearchRef=useRef(null);

  useEffect(()=>{
    function handleOutside(e){
      if(cityPickerRef.current&&!cityPickerRef.current.contains(e.target)){
        setCityPickerOpen(false);setCitySearch("");setCityResults([]);
      }
    }
    document.addEventListener("mousedown",handleOutside);
    return()=>document.removeEventListener("mousedown",handleOutside);
  },[]);

  useEffect(()=>{
    if(cityPickerOpen)setTimeout(()=>citySearchRef.current?.focus(),50);
  },[cityPickerOpen]);

  useEffect(()=>{
    const q=citySearch.trim();
    if(!q){setCityResults([]);setCityLoading(false);return;}
    setCityLoading(true);
    const t=setTimeout(async()=>{
      try{
        const res=await fetch(`https://api.teleport.org/api/cities/?search=${encodeURIComponent(q)}&limit=8`);
        const data=await res.json();
        const items=(data._embedded?.["city:search-results"]||[]).map(r=>({
          name:r._embedded?.["city:item"]?.name||r.matching_full_name.split(",")[0].trim(),
          full:r.matching_full_name
        }));
        setCityResults(items);
      }catch{setCityResults([]);}
      finally{setCityLoading(false);}
    },300);
    return()=>clearTimeout(t);
  },[citySearch]);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"})},[allChatMsgs, chatRoom]);

  useEffect(()=>{
    if(!navigator.geolocation){setLocStatus("failed");return;}
    setLocStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      async pos=>{
        try{
          const {latitude,longitude}=pos.coords;
          const res=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data=await res.json();
          const name=data.city||data.locality||data.principalSubdivision||null;
          setDetectedCity(name);
          if(name)setCity(name);
          setLocStatus("detected");
        }catch{setLocStatus("failed");}
      },
      ()=>setLocStatus("failed"),
      {timeout:8000}
    );
  },[]);

  // actions
  function rsvp(id){setEvents(p=>p.map(e=>e.id===id?{...e,going:!e.going,attendees:e.going?e.attendees-1:e.attendees+1}:e))}
  function connect(id){setMembers(p=>p.map(m=>m.id===id?{...m,connected:!m.connected}:m))}
  function upvote(id){setIdeas(p=>p.map(i=>i.id===id?{...i,upvoted:!i.upvoted,votes:i.upvoted?i.votes-1:i.votes+1}:i))}
  function likeThread(id,e){e.stopPropagation();setThreads(p=>p.map(t=>t.id===id?{...t,liked:!t.liked,likes:t.liked?t.likes-1:t.likes+1}:t))}
  function toggleThread(id){setOpenThread(p=>{if(p===id)return null;setReplyText("");return id;})}
  function submitReply(){if(!replyText.trim())return;setThreads(p=>p.map(t=>t.id===openThread?{...t,replies:t.replies+1}:t));setReplyText("")}
  function submitPost(){if(!newPost.title.trim())return;setThreads(p=>[{id:Date.now(),city:city==="All cities"?"All":city,title:newPost.title,body:newPost.body,author:"You",time:"just now",replies:0,likes:0,liked:false,tags:["general"]},...p]);setNewPost({title:"",body:""});setNewPostOpen(false)}
  function switchRoom(r){setChatRoom(r)}
  function sendChat(){
    if(!chatInput.trim())return;
    const msg = {
      user:"You",
      text:chatInput,
      time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),
      bg:"#EEEDFE",
      tc:"#3C3489"
    };
    setAllChatMsgs(p=>({...p, [chatRoom]: [...(p[chatRoom]||[]), msg]}));
    setChatInput("");
  }

  const NAV=[
    {id:"events",icon:"ti-calendar-event",label:"Meetups"},
    {id:"members",icon:"ti-users",label:"Members"},
    {id:"ideas",icon:"ti-bulb",label:"Ideas"},
    {id:"threads",icon:"ti-messages",label:"Forums"},
    {id:"chat",icon:"ti-message-circle",label:"Chat"},
  ];

  const filt=arr=>city==="All cities"?arr:arr.filter(x=>x.city===city);
  const fEvents=filt(events);
  const fMembers=filt(members);
  const fIdeas=filt(ideas);
  const fThreads=city==="All cities"?threads:threads.filter(t=>t.city===city||t.city==="All");
  const chatMsgs = allChatMsgs[chatRoom] || [];

  return (
    <div className="app">
      <div className="nav">
        <div className="nav-logo">
          <div className="logo-icon"><i className="ti ti-coffee"/></div>
          WFH Lounge
        </div>
        <div className="nav-tabs">
          {NAV.map(n=>(
            <button key={n.id} className={"nav-tab"+(tab===n.id?" active":"")} onClick={()=>setTab(n.id)}>
              <i className={"ti "+n.icon}/>{n.label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <div className="city-picker-wrap" ref={cityPickerRef}>
            <button className="city-pill" onClick={()=>setCityPickerOpen(p=>!p)}>
              <i className={"ti "+(locStatus==="detecting"?"ti-loader-2":"ti-map-pin")} style={locStatus==="detecting"?{animation:"spin 1s linear infinite"}:{}}/>
              <span>{locStatus==="detecting"?"Detecting…":city}</span>
              <i className="ti ti-chevron-down" style={{fontSize:10,color:"#B4B2A9"}}/>
            </button>
            {cityPickerOpen&&(
              <div className="city-dropdown">
                <div className="city-search-wrap">
                  <i className="ti ti-search city-search-icon"/>
                  <input
                    ref={citySearchRef}
                    className="city-search-input"
                    placeholder="Search any city…"
                    value={citySearch}
                    onChange={e=>setCitySearch(e.target.value)}
                  />
                  {cityLoading&&<i className="ti ti-loader-2 city-search-spin"/>}
                </div>
                {!citySearch&&(
                  <button className={"city-drop-item"+(city==="All cities"?" active":"")} onClick={()=>{setCity("All cities");setCityPickerOpen(false);setCitySearch("");}}>
                    <span>All cities</span>
                    {city==="All cities"&&<i className="ti ti-check" style={{fontSize:13,color:"#7F77DD"}}/>}
                  </button>
                )}
                {!citySearch&&detectedCity&&(
                  <button className={"city-drop-item"+(city===detectedCity?" active":"")} onClick={()=>{setCity(detectedCity);setCityPickerOpen(false);setCitySearch("");}}>
                    <span>{detectedCity}</span>
                    <span className="city-auto-tag"><i className="ti ti-navigation"/>auto</span>
                  </button>
                )}
                {cityResults.map(r=>(
                  <button key={r.full} className={"city-drop-item"+(city===r.name?" active":"")} onClick={()=>{setCity(r.name);setCityPickerOpen(false);setCitySearch("");}}>
                    <span>{r.name}</span>
                    <span className="city-drop-sub">{r.full.split(",").slice(1).join(",").trim()}</span>
                  </button>
                ))}
                {citySearch&&!cityLoading&&cityResults.length===0&&(
                  <div className="city-drop-empty">No results for "{citySearch}"</div>
                )}
              </div>
            )}
          </div>
          <div className="avatar">YO</div>
        </div>
      </div>

      <div className="content">
        <div className="inner fade">

          {tab==="events"&&(
            <div>
              <div className="page-header">
                <div><div className="page-title">Upcoming meetups</div><div className="page-sub">{fEvents.length} events · {city}</div></div>
                <button className="btn-primary"><i className="ti ti-plus"/>Host event</button>
              </div>
              <div className="grid3">
                {fEvents.map(ev=>(
                  <div key={ev.id} className="card">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span className={"badge "+(ev.type==="IRL"?"badge-irl":"badge-virtual")}>{ev.type==="IRL"?"📍 IRL":"🌐 Virtual"}</span>
                      <span style={{fontSize:11,color:"#888780"}}>{ev.city}</span>
                    </div>
                    <div style={{fontWeight:600,fontSize:14,lineHeight:1.3,marginBottom:6}}>{ev.title}</div>
                    <div style={{fontSize:12,color:"#888780",display:"flex",alignItems:"center",gap:4,marginBottom:8}}>
                      <i className="ti ti-map-pin" style={{fontSize:13}}/>{ev.location}
                    </div>
                    <div style={{display:"flex",gap:12,fontSize:12,color:"#555550",marginBottom:8}}>
                      <span><i className="ti ti-calendar" style={{fontSize:12,verticalAlign:-1}}/> {ev.date}</span>
                      <span><i className="ti ti-clock" style={{fontSize:12,verticalAlign:-1}}/> {ev.time}</span>
                    </div>
                    <div style={{marginBottom:10}}>{ev.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
                    <hr className="divider"/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:11,color:"#888780"}}><i className="ti ti-users" style={{fontSize:12,verticalAlign:-1}}/> {ev.attendees} going</div>
                      <button className={"rsvp-btn"+(ev.going?" going":"")} onClick={()=>rsvp(ev.id)}>{ev.going?"✓ Going":"RSVP"}</button>
                    </div>
                  </div>
                ))}
                {fEvents.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>No events in {city} yet — be the first to host one!</div>}
              </div>
            </div>
          )}

          {tab==="members"&&(
            <div>
              <div className="page-header">
                <div><div className="page-title">Member network</div><div className="page-sub">{fMembers.length} members · {city}</div></div>
                <button className="btn-primary"><i className="ti ti-user-plus"/>Invite someone</button>
              </div>
              <div className="grid2">
                {fMembers.map(m=>(
                  <div key={m.id} className="card">
                    <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
                      <div style={{width:42,height:42,borderRadius:"50%",background:m.bg,color:m.tc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{m.ini}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:14}}>{m.name}</div>
                        <div style={{fontSize:12,color:"#888780"}}>{m.role}</div>
                      </div>
                      <span className={m.online?"dot-online":"dot-offline"}/>
                    </div>
                    <div style={{fontSize:12,color:"#555550",display:"flex",alignItems:"center",gap:4,marginBottom:9}}>
                      <i className="ti ti-map-pin" style={{fontSize:12}}/>{m.city}
                    </div>
                    <div style={{marginBottom:12}}>{m.skills.map(s=><span key={s} className="tag">{s}</span>)}</div>
                    <hr className="divider"/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:11,color:"#888780"}}>{m.conn} connections · {m.events} events</div>
                      <button className={"connect-btn"+(m.connected?" connected":"")} onClick={()=>connect(m.id)}>{m.connected?"✓ Connected":"Connect"}</button>
                    </div>
                  </div>
                ))}
                {fMembers.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>No members in {city} yet.</div>}
              </div>
            </div>
          )}

          {tab==="ideas"&&(
            <div>
              <div className="page-header">
                <div><div className="page-title">Startup ideas</div><div className="page-sub">Post ideas · find co-founders · validate fast</div></div>
                <button className="btn-primary"><i className="ti ti-plus"/>Post idea</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {fIdeas.map(idea=>(
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
                {fIdeas.length===0&&<div className="empty">No ideas in {city} yet.</div>}
              </div>
            </div>
          )}

          {tab==="threads"&&(
            <div>
              <div className="page-header">
                <div><div className="page-title">Forums</div><div className="page-sub">Async discussions · {city}</div></div>
                <button className="btn-primary" onClick={()=>setNewPostOpen(true)}><i className="ti ti-plus"/>New post</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {fThreads.map(t=>(
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
                {fThreads.length===0&&<div className="empty">No posts yet. Start the conversation!</div>}
              </div>
            </div>
          )}

          {tab==="chat"&&(
            <div>
              <div className="page-header">
                <div><div className="page-title">City chat</div><div className="page-sub">Real-time rooms · your people</div></div>
              </div>
              <div className="chat-wrap">
                <div className="chat-rooms">
                  <div className="chat-rooms-header">Rooms</div>
                  {["Jaipur","Indore","Lucknow","All cities"].map(r=>(
                    <button key={r} className={"room-btn"+(chatRoom===r?" active":"")} onClick={()=>switchRoom(r)}>
                      <span className="room-hash">#</span>{r}
                    </button>
                  ))}
                </div>
                <div className="chat-main">
                  <div className="chat-header">
                    <span style={{color:"#888780",fontSize:16}}>#</span>{chatRoom}
                    <span style={{fontSize:12,color:"#888780",fontWeight:400,marginLeft:4}}>· {chatMsgs.length} messages</span>
                  </div>
                  <div className="chat-msgs">
                    {chatMsgs.map((msg,i)=>(
                      <div key={i} className="msg">
                        <div className="msg-avatar" style={{background:msg.bg,color:msg.tc}}>{msg.user.slice(0,2).toUpperCase()}</div>
                        <div>
                          <div className="msg-name">{msg.user}<span className="msg-time">{msg.time}</span></div>
                          <div className="msg-text">{msg.text}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEnd}/>
                  </div>
                  <div className="chat-input-row">
                    <input className="chat-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder={"Message #"+chatRoom+"…"}/>
                    <button className="send-btn" onClick={sendChat}><i className="ti ti-send" style={{fontSize:15}}/></button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {newPostOpen&&(
        <div className="overlay" onClick={()=>setNewPostOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">New post</div>
            <input className="modal-input" placeholder="Post title…" value={newPost.title} onChange={e=>setNewPost(p=>({...p,title:e.target.value}))}/>
            <textarea className="modal-input" placeholder="What's on your mind?" rows={4} value={newPost.body} onChange={e=>setNewPost(p=>({...p,body:e.target.value}))} style={{resize:"vertical"}}/>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>setNewPostOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitPost}>Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
