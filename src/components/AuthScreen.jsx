import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ROLES, firebaseErrMsg } from '../constants';

function AuthScreen(){
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:"",city:"",role:"",yearsExp:""});
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
          yearsExp:form.yearsExp!==''?Number(form.yearsExp):null,
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
            <div style={{display:"flex",gap:8}}>
              <div className="auth-field" style={{flex:1}}>
                <label className="auth-label">Role <span className="auth-opt">(optional)</span></label>
                <select className="auth-input auth-select" value={form.role} onChange={e=>field("role",e.target.value)}>
                  <option value="">Select role…</option>
                  {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="auth-field" style={{width:90}}>
                <label className="auth-label">Years exp.</label>
                <input className="auth-input" type="number" min={0} max={60} placeholder="0"
                  value={form.yearsExp} onChange={e=>field("yearsExp",e.target.value)}/>
              </div>
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

export default AuthScreen;
