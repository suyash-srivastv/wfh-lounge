import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { CITIES, INIT_EVENTS, INIT_MEMBERS, INIT_IDEAS, INIT_THREADS } from './mockData';

const ROLES=["Designer","Developer","Freelancer","Founder","Product Manager","Marketer","Writer","Other"];
const CHANNELS=[
  {id:"general",  label:"General",  icon:"ti-messages",    desc:"Open discussion"},
  {id:"tech",     label:"Tech",     icon:"ti-code",        desc:"Dev, design, tools"},
  {id:"non-tech", label:"Non-tech", icon:"ti-books",       desc:"Business, ideas, life"},
  {id:"casual",   label:"Casual",   icon:"ti-mood-smile",  desc:"Chill & off-topic"},
];

const AVATAR_PALETTE=[
  {bg:"#EEEDFE",tc:"#3C3489"},{bg:"#E1F5EE",tc:"#085041"},
  {bg:"#FAEEDA",tc:"#633806"},{bg:"#EAF3DE",tc:"#27500A"},
  {bg:"#FBEAF0",tc:"#72243E"},{bg:"#FAECE7",tc:"#712B13"},
];
function avatarColors(uid=""){
  const i=uid.split("").reduce((s,c)=>s+c.charCodeAt(0),0)%AVATAR_PALETTE.length;
  return AVATAR_PALETTE[i];
}

function firebaseErrMsg(code){
  const map={
    "auth/user-not-found":"No account with this email.",
    "auth/wrong-password":"Wrong password.",
    "auth/invalid-credential":"Wrong email or password.",
    "auth/email-already-in-use":"Email already registered. Log in instead.",
    "auth/weak-password":"Password must be at least 6 characters.",
    "auth/invalid-email":"Invalid email address.",
    "auth/too-many-requests":"Too many attempts. Try again later.",
    "auth/unauthorized-domain":"This domain isn't authorized. Add it in Firebase Console → Authentication → Authorized domains.",
    "auth/operation-not-supported-in-this-environment":"Google sign-in isn't supported in this browser.",
    "auth/web-storage-unsupported":"Your browser blocks storage needed for sign-in. Try disabling private/incognito mode.",
    "auth/network-request-failed":"Network error. Check your connection and try again.",
  };
  return map[code]||(code?`Sign-in failed (${code}).`:"Something went wrong. Try again.");
}

function AuthScreen(){
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:"",city:"",role:""});
  const [cityInput,setCityInput]=useState("");
  const [cityR,setCityR]=useState([]);
  const [cityOpen,setCityOpen]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const cityRef=useRef(null);

  useEffect(()=>{
    function outside(e){if(cityRef.current&&!cityRef.current.contains(e.target))setCityOpen(false);}
    document.addEventListener("mousedown",outside);
    return()=>document.removeEventListener("mousedown",outside);
  },[]);

  useEffect(()=>{
    const q=cityInput.trim();
    if(!q||form.city){setCityR([]);return;}
    const t=setTimeout(async()=>{
      try{
        const res=await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&layer=city&lang=en`);
        const data=await res.json();
        setCityR((data.features||[]).filter(f=>f.properties?.name).map(f=>({
          name:f.properties.name,
          full:[f.properties.name,f.properties.state,f.properties.country].filter(Boolean).join(", ")
        })));
      }catch{setCityR([]);}
    },300);
    return()=>clearTimeout(t);
  },[cityInput,form.city]);

  function field(k,v){setForm(p=>({...p,[k]:v}));setErr("");}

  async function googleSignIn(){
    setErr("");setLoading(true);
    try{
      await signInWithPopup(auth,new GoogleAuthProvider());
    }catch(e){
      if(e.code!=="auth/popup-closed-by-user")setErr(firebaseErrMsg(e.code));
      setLoading(false);
    }
  }

  async function submit(e){
    e.preventDefault();
    setErr("");
    setLoading(true);
    try{
      if(mode==="login"){
        await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      } else {
        if(!form.name.trim()||!form.email.trim()||!form.password.trim()){setErr("Name, email and password are required.");setLoading(false);return;}
        const cred=await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
        const initials=form.name.trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
        await setDoc(doc(db, "users", cred.user.uid), {
          name:form.name.trim(),
          city:form.city||cityInput.trim(),
          role:form.role,
          initials,
        });
      }
    }catch(e){
      setErr(firebaseErrMsg(e.code));
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo"><div className="logo-icon"><i className="ti ti-coffee"/></div>WFH Lounge</div>
        <p className="auth-tagline">{mode==="login"?"Welcome back.":"Join your city's remote community."}</p>
        <div className="auth-tabs">
          <button className={"auth-tab"+(mode==="login"?" active":"")} onClick={()=>{setMode("login");setErr("");}}>Log in</button>
          <button className={"auth-tab"+(mode==="signup"?" active":"")} onClick={()=>{setMode("signup");setErr("");}}>Sign up</button>
        </div>
        <button className="auth-google" onClick={googleSignIn} disabled={loading}>
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <div className="auth-divider"><span>or</span></div>

        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode==="signup"&&(
            <div className="auth-field">
              <label className="auth-label">Full name</label>
              <input className="auth-input" placeholder="Your name" value={form.name} onChange={e=>field("name",e.target.value)}/>
            </div>
          )}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" placeholder="you@example.com" value={form.email} onChange={e=>field("email",e.target.value)}/>
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="••••••••" value={form.password} onChange={e=>field("password",e.target.value)}/>
          </div>
          {mode==="signup"&&(<>
            <div className="auth-field" style={{position:"relative"}} ref={cityRef}>
              <label className="auth-label">City <span className="auth-opt">(optional)</span></label>
              <div className="auth-input-icon">
                <i className="ti ti-map-pin"/>
                <input className="auth-input-inner" placeholder="Search your city…"
                  value={form.city||cityInput}
                  onFocus={()=>{if(form.city){setForm(p=>({...p,city:""}));setCityInput("");}setCityOpen(true);}}
                  onChange={e=>{setCityInput(e.target.value);setForm(p=>({...p,city:""}));setCityOpen(true);setErr("");}}
                />
              </div>
              {cityOpen&&cityR.length>0&&(
                <div className="auth-city-drop">
                  {cityR.map(r=>(
                    <button type="button" key={r.full} className="city-drop-item" onClick={()=>{setForm(p=>({...p,city:r.name}));setCityInput(r.name);setCityOpen(false);}}>
                      <span>{r.name}</span>
                      <span className="city-drop-sub">{r.full.split(",").slice(1).join(",").trim()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="auth-field">
              <label className="auth-label">Role <span className="auth-opt">(optional)</span></label>
              <select className="auth-input auth-select" value={form.role} onChange={e=>field("role",e.target.value)}>
                <option value="">Select your role…</option>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </>)}
          {err&&<div className="auth-error"><i className="ti ti-alert-circle"/>{err}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? <><i className="ti ti-loader-2" style={{animation:"spin 1s linear infinite",marginRight:6}}/>Please wait…</>
              : mode==="login"?"Log in →":"Create account →"
            }
          </button>
        </form>
        <p className="auth-switch">
          {mode==="login"?"No account yet?":"Already have an account?"}
          <button className="auth-switch-btn" onClick={()=>{setMode(m=>m==="login"?"signup":"login");setErr("");}}>
            {mode==="login"?" Sign up":" Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function App(){
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [tab,setTab]=useState("events");
  const [city,setCity]=useState("All cities");
  const [detectedCity,setDetectedCity]=useState(null);
  const [locStatus,setLocStatus]=useState("idle");
  const [events,setEvents]=useState(INIT_EVENTS);
  const [members,setMembers]=useState(INIT_MEMBERS);
  const [ideas,setIdeas]=useState(INIT_IDEAS);
  const [threads,setThreads]=useState(INIT_THREADS);
  const [openThread,setOpenThread]=useState(null);
  const [replyText,setReplyText]=useState("");
  const [newPostOpen,setNewPostOpen]=useState(false);
  const [newPost,setNewPost]=useState({title:"",body:""});
  const [chatRoom,setChatRoom]=useState("Jaipur__general");
  const [mobileChatView,setMobileChatView]=useState("rooms"); // "rooms" | "messages"
  const [allChatMsgs,setAllChatMsgs]=useState({});
  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);
  const [cityPickerOpen,setCityPickerOpen]=useState(false);
  const [citySearch,setCitySearch]=useState("");
  const [cityResults,setCityResults]=useState([]);
  const [cityLoading,setCityLoading]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [editOpen,setEditOpen]=useState(false);
  const [editForm,setEditForm]=useState({name:"",city:"",role:""});
  const [editCityQ,setEditCityQ]=useState("");
  const [editCityR,setEditCityR]=useState([]);
  const [editCityOpen,setEditCityOpen]=useState(false);
  const chatEnd=useRef(null);
  const cityPickerRef=useRef(null);
  const citySearchRef=useRef(null);
  const profileRef=useRef(null);
  const editCityRef=useRef(null);

  useEffect(()=>{
    function handleOutside(e){
      if(cityPickerRef.current&&!cityPickerRef.current.contains(e.target)){
        setCityPickerOpen(false);setCitySearch("");setCityResults([]);
      }
      if(profileRef.current&&!profileRef.current.contains(e.target)){
        setProfileOpen(false);
      }
      if(editCityRef.current&&!editCityRef.current.contains(e.target)){
        setEditCityOpen(false);
      }
    }
    document.addEventListener("mousedown",handleOutside);
    return()=>document.removeEventListener("mousedown",handleOutside);
  },[]);

  useEffect(()=>{
    const q=editCityQ.trim();
    if(!q||editForm.city){setEditCityR([]);return;}
    const t=setTimeout(async()=>{
      try{
        const res=await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&layer=city&lang=en`);
        const data=await res.json();
        setEditCityR((data.features||[]).filter(f=>f.properties?.name).map(f=>({
          name:f.properties.name,
          full:[f.properties.name,f.properties.state,f.properties.country].filter(Boolean).join(", ")
        })));
      }catch{setEditCityR([]);}
    },300);
    return()=>clearTimeout(t);
  },[editCityQ,editForm.city]);

  useEffect(()=>{
    if(cityPickerOpen)setTimeout(()=>citySearchRef.current?.focus(),50);
  },[cityPickerOpen]);

  useEffect(()=>{
    const q=citySearch.trim();
    if(!q){setCityResults([]);setCityLoading(false);return;}
    setCityLoading(true);
    const t=setTimeout(async()=>{
      try{
        const res=await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&layer=city&lang=en`);
        const data=await res.json();
        const items=(data.features||[]).filter(f=>f.properties?.name).map(f=>({
          name:f.properties.name,
          full:[f.properties.name,f.properties.state,f.properties.country].filter(Boolean).join(", ")
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
          setLocStatus("detected");
        }catch{setLocStatus("failed");}
      },
      ()=>setLocStatus("failed"),
      {timeout:8000}
    );
  },[]);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async fbUser=>{
      if(fbUser){
        try{
          const snap=await getDoc(doc(db,"users",fbUser.uid));
          if(!snap.exists()){
            const initials=(fbUser.displayName||fbUser.email||"??").split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
            const profile={name:fbUser.displayName||fbUser.email||"",city:"",role:"",initials};
            await setDoc(doc(db,"users",fbUser.uid),profile);
            setUser({...profile,uid:fbUser.uid});
          }else{
            const profile=snap.data()||{};
            setUser({...profile,uid:fbUser.uid});
            if(profile.city)setCity(profile.city);
          }
        }catch{
          setUser({uid:fbUser.uid,name:fbUser.email||"",initials:"??"});
        }
      }else{
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  },[]);

  function rsvp(id){setEvents(p=>p.map(e=>e.id===id?{...e,going:!e.going,attendees:e.going?e.attendees-1:e.attendees+1}:e))}
  function connect(id){setMembers(p=>p.map(m=>m.id===id?{...m,connected:!m.connected}:m))}
  function upvote(id){setIdeas(p=>p.map(i=>i.id===id?{...i,upvoted:!i.upvoted,votes:i.upvoted?i.votes-1:i.votes+1}:i))}
  function likeThread(id,e){e.stopPropagation();setThreads(p=>p.map(t=>t.id===id?{...t,liked:!t.liked,likes:t.liked?t.likes-1:t.likes+1}:t))}
  function toggleThread(id){setOpenThread(p=>{if(p===id)return null;setReplyText("");return id;})}
  function submitReply(){if(!replyText.trim())return;setThreads(p=>p.map(t=>t.id===openThread?{...t,replies:t.replies+1}:t));setReplyText("")}
  function submitPost(){if(!newPost.title.trim())return;setThreads(p=>[{id:Date.now(),city:city==="All cities"?"All":city,title:newPost.title,body:newPost.body,author:user.name,time:"just now",replies:0,likes:0,liked:false,tags:["general"]},...p]);setNewPost({title:"",body:""});setNewPostOpen(false)}
  function handleLogout(){signOut(auth);setCity("All cities");}
  function openEdit(){
    setEditForm({name:user.name||"",city:user.city||"",role:user.role||""});
    setEditCityQ(user.city||"");setEditOpen(true);setProfileOpen(false);
  }
  async function saveProfile(){
    const initials=(editForm.name||user.name).trim().split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const updated={...user,...editForm,initials};
    await setDoc(doc(db,"users",user.uid),{name:updated.name,city:updated.city,role:updated.role,initials},{merge:true});
    setUser(updated);
    if(updated.city)setCity(updated.city);
    setEditOpen(false);
  }
  useEffect(()=>{
    if(tab!=="chat")return;
    setChatLoading(true);
    const q=query(
      collection(db,"chats",chatRoom,"messages"),
      orderBy("timestamp"),
      limit(100)
    );
    const unsub=onSnapshot(q,snap=>{
      const msgs=snap.docs.map(d=>{
        const data=d.data();
        const {bg,tc}=avatarColors(data.userId||data.user||"");
        return {
          id:d.id,
          user:data.user,
          text:data.text,
          time:data.timestamp?.toDate().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})||"",
          bg,tc,
        };
      });
      setAllChatMsgs(p=>({...p,[chatRoom]:msgs}));
      setChatLoading(false);
    });
    return unsub;
  },[tab,chatRoom]);

  useEffect(()=>{
    setChatRoom(`${city}__general`);
  },[city]);

  async function sendChat(){
    if(!chatInput.trim())return;
    const text=chatInput.trim();
    setChatInput("");
    await addDoc(collection(db,"chats",chatRoom,"messages"),{
      text,
      user:user.name,
      userId:user.uid,
      timestamp:serverTimestamp(),
    });
  }

  const NAV=[
    {id:"events",icon:"ti-calendar-event",label:"Meetups"},
    {id:"members",icon:"ti-users",label:"Members"},
    {id:"ideas",icon:"ti-bulb",label:"Ideas"},
    {id:"threads",icon:"ti-messages",label:"Forums"},
    {id:"chat",icon:"ti-message-circle",label:"Chat"},
  ];

  const userPosts=user?threads.filter(t=>t.author===user.name||t.author==="You"):[];
  const filt=arr=>city==="All cities"?arr:arr.filter(x=>x.city===city);
  const fEvents=filt(events);
  const fMembers=filt(members);
  const fIdeas=filt(ideas);
  const fThreads=city==="All cities"?threads:threads.filter(t=>t.city===city||t.city==="All");
  const chatMsgs=allChatMsgs[chatRoom]||[];

  if(authLoading) return <div className="auth-wrap"><div className="auth-loading"><i className="ti ti-loader-2" style={{animation:"spin 1s linear infinite"}}/>Loading…</div></div>;
  if(!user) return <AuthScreen/>;

  return (
    <div className="app">
      <div className="nav">
        <div className="nav-logo">
          <div className="logo-icon"><i className="ti ti-coffee"/></div>
          WFH Lounge
        </div>
        <div className="nav-tabs">
          {NAV.map(n=>(
            <button key={n.id} className={"nav-tab"+(tab===n.id?" active":"")} onClick={()=>{setTab(n.id);setShowProfile(false);}}>
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
                  <input ref={citySearchRef} className="city-search-input" placeholder="Search any city…" value={citySearch} onChange={e=>setCitySearch(e.target.value)}/>
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
          <div className="profile-wrap" ref={profileRef}>
            <button className="avatar" onClick={()=>setProfileOpen(p=>!p)}>{user.initials}</button>
            {profileOpen&&(
              <div className="profile-dropdown">
                <div className="profile-header">
                  <div className="profile-avatar-lg">{user.initials}</div>
                  <div>
                    <div className="profile-name">{user.name}</div>
                    {user.role&&<div className="profile-meta">{user.role}</div>}
                    {user.city&&<div className="profile-meta"><i className="ti ti-map-pin" style={{fontSize:11}}/>{user.city}</div>}
                  </div>
                </div>
                <div className="profile-divider"/>
                <button className="profile-item" onClick={()=>{setShowProfile(true);setProfileOpen(false);}}><i className="ti ti-user"/>View profile</button>
                <button className="profile-item" onClick={openEdit}><i className="ti ti-user-edit"/>Edit profile</button>
                <button className="profile-item profile-item-danger" onClick={handleLogout}><i className="ti ti-logout"/>Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="content">
        {showProfile ? (
        <div className="inner fade">
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
              <div className="profile-stat"><div className="profile-stat-val">{threads.filter(t=>t.liked).length}</div><div className="profile-stat-label">Liked</div></div>
              <div className="profile-stat"><div className="profile-stat-val">{events.filter(e=>e.going).length}</div><div className="profile-stat-label">RSVPs</div></div>
              <div className="profile-stat"><div className="profile-stat-val">{members.filter(m=>m.connected).length}</div><div className="profile-stat-label">Connected</div></div>
            </div>
            <div className="page-title" style={{marginBottom:14}}>Posts</div>
            {userPosts.length===0 ? (
              <div className="empty">No posts yet — start a thread in the Forums tab!</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {userPosts.map(t=>(
                  <div key={t.id} className="thread-card">
                    <div style={{fontWeight:600,fontSize:14,lineHeight:1.4,marginBottom:6}}>{t.title}</div>
                    {t.body&&<div style={{fontSize:13,color:"#555550",lineHeight:1.6,marginBottom:8}}>{t.body}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:14,fontSize:12,color:"#888780"}}>
                      <span>{t.time}</span>
                      <span><i className="ti ti-message" style={{fontSize:12,verticalAlign:-1}}/> {t.replies}</span>
                      <span><i className="ti ti-heart" style={{fontSize:12,verticalAlign:-1}}/> {t.likes}</span>
                      {t.city!=="All"&&<span className="tag">{t.city}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        ) : (
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
                <div className={"chat-rooms"+(mobileChatView==="messages"?" mobile-hide":"")}>
                  <div className="chat-rooms-header">{city==="All cities"?"Global":city}</div>
                  {CHANNELS.map(ch=>{
                    const roomId=`${city}__${ch.id}`;
                    return (
                      <button key={roomId} className={"room-btn"+(chatRoom===roomId?" active":"")}
                        onClick={()=>{setChatRoom(roomId);setMobileChatView("messages");}} title={ch.desc}>
                        <i className={"ti "+ch.icon+" room-ch-icon"}/>
                        <span>{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className={"chat-main"+(mobileChatView==="rooms"?" mobile-hide":"")}>
                  {(()=>{
                    const activeCh=CHANNELS.find(c=>chatRoom.endsWith(`__${c.id}`))||CHANNELS[0];
                    return (
                      <div className="chat-header">
                        <button className="mobile-back-btn" onClick={()=>setMobileChatView("rooms")}><i className="ti ti-arrow-left"/></button>
                        <i className={"ti "+activeCh.icon} style={{fontSize:15,color:"#888780"}}/>
                        <span>{activeCh.label}</span>
                        <span style={{fontSize:12,color:"#B4B2A9",fontWeight:400,marginLeft:"auto"}}>{chatMsgs.length} messages</span>
                      </div>
                    );
                  })()}
                  <div className="chat-msgs">
                    {chatLoading&&<div className="chat-loading"><i className="ti ti-loader-2" style={{animation:"spin 1s linear infinite"}}/>Loading messages…</div>}
                    {!chatLoading&&chatMsgs.length===0&&<div className="chat-empty">No messages yet — say hi! 👋</div>}
                    {chatMsgs.map(msg=>(
                      <div key={msg.id||msg.text} className="msg">
                        <div className="msg-avatar" style={{background:msg.bg,color:msg.tc}}>{(msg.user||"?").slice(0,2).toUpperCase()}</div>
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
        )}
      </div>

      {editOpen&&(
        <div className="overlay" onClick={()=>setEditOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Edit profile</div>
            <div className="auth-field" style={{marginBottom:10}}>
              <label className="auth-label">Full name</label>
              <input className="modal-input" placeholder="Your name" value={editForm.name} onChange={e=>setEditForm(p=>({...p,name:e.target.value}))}/>
            </div>
            <div className="auth-field" style={{marginBottom:10,position:"relative"}} ref={editCityRef}>
              <label className="auth-label">City</label>
              <div className="auth-input-icon" style={{background:"#F7F6F2",borderRadius:9,border:"1px solid #E8E6DF"}}>
                <i className="ti ti-map-pin" style={{fontSize:14,color:"#B4B2A9"}}/>
                <input className="auth-input-inner" placeholder="Search your city…"
                  value={editForm.city||editCityQ}
                  onFocus={()=>{if(editForm.city){setEditForm(p=>({...p,city:""}));setEditCityQ("");}setEditCityOpen(true);}}
                  onChange={e=>{setEditCityQ(e.target.value);setEditForm(p=>({...p,city:""}));setEditCityOpen(true);}}
                />
              </div>
              {editCityOpen&&editCityR.length>0&&(
                <div className="auth-city-drop">
                  {editCityR.map(r=>(
                    <button type="button" key={r.full} className="city-drop-item" onClick={()=>{setEditForm(p=>({...p,city:r.name}));setEditCityQ(r.name);setEditCityOpen(false);}}>
                      <span>{r.name}</span>
                      <span className="city-drop-sub">{r.full.split(",").slice(1).join(",").trim()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="auth-field" style={{marginBottom:16}}>
              <label className="auth-label">Role</label>
              <select className="modal-input auth-select" value={editForm.role} onChange={e=>setEditForm(p=>({...p,role:e.target.value}))}>
                <option value="">Select your role…</option>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={()=>setEditOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveProfile}>Save</button>
            </div>
          </div>
        </div>
      )}

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

      <nav className="mobile-nav">
        {NAV.map(n=>(
          <button key={n.id} className={"mobile-nav-btn"+(tab===n.id&&!showProfile?" active":"")} onClick={()=>{setTab(n.id);setShowProfile(false);}}>
            <i className={"ti "+n.icon}/>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
