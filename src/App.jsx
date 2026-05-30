import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, limit, serverTimestamp, updateDoc, deleteField, increment, getDocs, writeBatch, deleteDoc, onSnapshot } from 'firebase/firestore';
import { INIT_EVENTS, INIT_IDEAS, INIT_THREADS } from './mockData';
import { ROLES, REACTIONS } from './constants';
import { useFirestoreListeners } from './hooks/useFirestoreListeners';
import { useChat } from './hooks/useChat';
import { useDM }   from './hooks/useDM';
import Confetti          from './components/Confetti';
import DmPanel           from './components/DmPanel';
import AuthScreen        from './components/AuthScreen';
import OnboardingScreen  from './components/OnboardingScreen';
import Nav               from './components/Nav';
import EditProfileModal  from './components/modals/EditProfileModal';
import NewPostModal      from './components/modals/NewPostModal';
import HostEventModal    from './components/modals/HostEventModal';
import PostIdeaModal     from './components/modals/PostIdeaModal';
import InviteModal       from './components/modals/InviteModal';
import MemberModal       from './components/modals/MemberModal';
import EventsScreen      from './screens/EventsScreen';
import MembersScreen     from './screens/MembersScreen';
import IdeasScreen       from './screens/IdeasScreen';
import ThreadsScreen     from './screens/ThreadsScreen';
import ChatScreen        from './screens/ChatScreen';
import ProfileScreen     from './screens/ProfileScreen';

function App(){
  const [user,          setUser]          = useState(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [tab,           setTab]           = useState('events');
  const [city,          setCity]          = useState('All cities');
  const [detectedCity,  setDetectedCity]  = useState(null);
  const [locStatus,     setLocStatus]     = useState('idle');
  const [showProfile,   setShowProfile]   = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [selectedMember,setSelectedMember]= useState(null);
  const [openThread,    setOpenThread]    = useState(null);
  const [replyText,     setReplyText]     = useState('');
  const [newPostOpen,   setNewPostOpen]   = useState(false);
  const [newPost,       setNewPost]       = useState({ title: '', body: '' });
  const [hostEventOpen, setHostEventOpen] = useState(false);
  const [newEvent,      setNewEvent]      = useState({ title: '', type: 'IRL', location: '', date: '', time: '', tags: '' });
  const [postIdeaOpen,  setPostIdeaOpen]  = useState(false);
  const [newIdea,       setNewIdea]       = useState({ title: '', desc: '', stage: 'Idea', tags: '', looking: [] });
  const [inviteOpen,    setInviteOpen]    = useState(false);
  const [crown,         setCrown]         = useState(false);
  const [confetti,      setConfetti]      = useState(false);
  const [dmPanelOpen,   setDmPanelOpen]   = useState(false);

  const { events, members, ideas, threads } = useFirestoreListeners(user);
  const dm = useDM(user);

  // Keep connections + requests in sync with Firestore in real-time
  useEffect(() => {
    if (!user?.uid) return;
    return onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setUser(u => ({
          ...u,
          connections:      d.connections      || {},
          sentRequests:     d.sentRequests     || {},
          receivedRequests: d.receivedRequests || {},
        }));
      }
    });
  }, [user?.uid]);

  useEffect(() => {
    const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx = 0;
    function onKey(e) {
      if (e.key === SEQ[idx]) { idx++; } else { idx = e.key === SEQ[0] ? 1 : 0; }
      if (idx === SEQ.length) {
        idx = 0;
        setCrown(true); setConfetti(true);
        setTimeout(() => setCrown(false), 3000);
        setTimeout(() => setConfetti(false), 3500);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const chat = useChat(user, tab, city);

  // Geolocation — only run if no saved city preference exists
  useEffect(() => {
    const saved = localStorage.getItem('wfh-city');
    if (saved) { setCity(saved); setLocStatus('detected'); return; }
    if (!navigator.geolocation) { setLocStatus('failed'); return; }
    setLocStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res  = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          setDetectedCity(data.city || data.locality || data.principalSubdivision || null);
          setLocStatus('detected');
        } catch { setLocStatus('failed'); }
      },
      () => setLocStatus('failed'),
      { timeout: 8000 }
    );
  }, []);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          if (!snap.exists()) {
            const initials = (fbUser.displayName || fbUser.email || '??').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const profile  = { name: fbUser.displayName || fbUser.email || '', city: '', role: '', initials };
            await setDoc(doc(db, 'users', fbUser.uid), profile);
            setUser({ ...profile, uid: fbUser.uid });
          } else {
            const profile = snap.data() || {};
            setUser({ ...profile, uid: fbUser.uid });
            const savedCity = profile.selectedCity || profile.city;
            if (savedCity) { setCity(savedCity); localStorage.setItem('wfh-city', savedCity); }
          }
        } catch {
          setUser({ uid: fbUser.uid, name: fbUser.email || '', initials: '??' });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
      seedFirestoreIfEmpty().catch(() => {});
    });
    return unsub;
  }, []);

  async function seedFirestoreIfEmpty() {
    const check = await getDocs(query(collection(db, 'events'), limit(1)));
    if (!check.empty) return;
    const batch = writeBatch(db);
    INIT_EVENTS.forEach(ev   => batch.set(doc(collection(db,'events')),  {title:ev.title,type:ev.type,city:ev.city,location:ev.location,date:ev.date,time:ev.time,tags:ev.tags,host:ev.host,hostId:'seed',attendeeCount:ev.attendees,rsvps:{},createdAt:serverTimestamp()}));
    INIT_IDEAS.forEach(idea  => batch.set(doc(collection(db,'ideas')),   {title:idea.title,desc:idea.desc,author:idea.author,authorId:'seed',city:idea.city,votes:idea.votes,stage:idea.stage,tags:idea.tags,looking:idea.looking,upvotes:{},createdAt:serverTimestamp()}));
    INIT_THREADS.forEach(t   => batch.set(doc(collection(db,'threads')), {title:t.title,body:t.body,author:t.author,authorId:'seed',city:t.city,tags:t.tags,replyCount:t.replies,likeCount:t.likes,likes:{},createdAt:serverTimestamp()}));
    await batch.commit();
  }

  async function changeCity(c) {
    setCity(c);
    localStorage.setItem('wfh-city', c);
    if (user?.uid) {
      await updateDoc(doc(db, 'users', user.uid), { selectedCity: c }).catch(() => {});
    }
  }

  // --- Action functions ---
  async function rsvp(id) {
    const ev    = events.find(e => e.id === id);
    const going = !!(ev?.rsvps?.[user.uid]);
    await updateDoc(doc(db,'events',id), { [`rsvps.${user.uid}`]: going ? deleteField() : true, attendeeCount: increment(going ? -1 : 1) });
  }
  async function sendRequest(memberId) {
    await updateDoc(doc(db,'users',user.uid), { [`sentRequests.${memberId}`]: true });
    await updateDoc(doc(db,'users',memberId), {
      [`receivedRequests.${user.uid}`]: { name: user.name, photoURL: user.photoURL || null },
    });
  }
  async function cancelRequest(memberId) {
    await updateDoc(doc(db,'users',user.uid), { [`sentRequests.${memberId}`]: deleteField() });
    await updateDoc(doc(db,'users',memberId), { [`receivedRequests.${user.uid}`]: deleteField() });
  }
  async function acceptRequest(fromUid) {
    await updateDoc(doc(db,'users',user.uid), {
      [`connections.${fromUid}`]: true,
      [`receivedRequests.${fromUid}`]: deleteField(),
    });
    await updateDoc(doc(db,'users',fromUid), {
      [`connections.${user.uid}`]: true,
      [`sentRequests.${user.uid}`]: deleteField(),
    });
  }
  async function declineRequest(fromUid) {
    await updateDoc(doc(db,'users',user.uid), { [`receivedRequests.${fromUid}`]: deleteField() });
    await updateDoc(doc(db,'users',fromUid), { [`sentRequests.${user.uid}`]: deleteField() });
  }
  async function upvote(id) {
    const idea  = ideas.find(i => i.id === id);
    const voted = !!(idea?.upvotes?.[user.uid]);
    await updateDoc(doc(db,'ideas',id), { [`upvotes.${user.uid}`]: voted ? deleteField() : true, votes: increment(voted ? -1 : 1) });
  }
  async function likeThread(id, e) {
    e.stopPropagation();
    const t     = threads.find(t => t.id === id);
    const liked = !!(t?.likes?.[user.uid]);
    await updateDoc(doc(db,'threads',id), { [`likes.${user.uid}`]: liked ? deleteField() : true, likeCount: increment(liked ? -1 : 1) });
  }
  function toggleThread(id) { setOpenThread(p => { if (p === id) return null; setReplyText(''); return id; }); }
  async function submitReply() {
    if (!replyText.trim() || !openThread) return;
    await addDoc(collection(db,'threads',openThread,'replies'), { body: replyText.trim(), author: user.name, authorId: user.uid, createdAt: serverTimestamp() });
    await updateDoc(doc(db,'threads',openThread), { replyCount: increment(1) });
    setReplyText('');
  }
  async function submitPost() {
    if (!newPost.title.trim()) return;
    await addDoc(collection(db,'threads'), { title:newPost.title.trim(), body:newPost.body.trim(), author:user.name, authorId:user.uid, city:city==='All cities'?'All':city, tags:['general'], replyCount:0, likeCount:0, likes:{}, createdAt:serverTimestamp() });
    setNewPost({ title:'', body:'' }); setNewPostOpen(false);
  }
  async function submitEvent() {
    if (!newEvent.title.trim() || !newEvent.location.trim()) return;
    const tags = newEvent.tags.split(',').map(t => t.trim()).filter(Boolean);
    await addDoc(collection(db,'events'), { title:newEvent.title.trim(), type:newEvent.type, city:city==='All cities'?'All':city, location:newEvent.location.trim(), date:newEvent.date||'TBD', time:newEvent.time||'TBD', tags, host:user.name, hostId:user.uid, attendeeCount:1, rsvps:{[user.uid]:true}, createdAt:serverTimestamp() });
    setNewEvent({ title:'', type:'IRL', location:'', date:'', time:'', tags:'' }); setHostEventOpen(false);
  }
  async function submitIdea() {
    if (!newIdea.title.trim()) return;
    const tags = newIdea.tags.split(',').map(t => t.trim()).filter(Boolean);
    await addDoc(collection(db,'ideas'), { title:newIdea.title.trim(), desc:newIdea.desc.trim(), author:user.name, authorId:user.uid, city:city==='All cities'?'All':city, votes:0, stage:newIdea.stage, tags, looking:newIdea.looking, upvotes:{}, createdAt:serverTimestamp() });
    setNewIdea({ title:'', desc:'', stage:'Idea', tags:'', looking:[] }); setPostIdeaOpen(false);
  }
  async function reactIdea(ideaId, emoji) {
    const idea = ideas.find(i => i.id === ideaId);
    const has  = !!(idea?.reactions?.[emoji]?.[user.uid]);
    await updateDoc(doc(db,'ideas',ideaId), { [`reactions.${emoji}.${user.uid}`]: has ? deleteField() : true });
  }
  async function reactThread(threadId, emoji) {
    const thread = threads.find(t => t.id === threadId);
    const has    = !!(thread?.reactions?.[emoji]?.[user.uid]);
    await updateDoc(doc(db,'threads',threadId), { [`reactions.${emoji}.${user.uid}`]: has ? deleteField() : true });
  }

  async function deleteEvent(id)  { await deleteDoc(doc(db,'events',id)); }
  async function deleteIdea(id)   { await deleteDoc(doc(db,'ideas',id)); }
  async function deleteThread(id) { await deleteDoc(doc(db,'threads',id)); if (openThread === id) setOpenThread(null); }

  async function saveProfile(form) {
    const initials = form.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const updated  = { ...user, ...form, initials, yearsExp: form.yearsExp !== '' ? Number(form.yearsExp) : null };
    const fields   = { name: updated.name, city: updated.city, role: updated.role, bio: updated.bio || '', status: updated.status || '', vibe: updated.vibe || '', yearsExp: updated.yearsExp, initials };
    if (form.photoURL) fields.photoURL = form.photoURL;
    if (updated.city) { fields.selectedCity = updated.city; }
    await setDoc(doc(db,'users',user.uid), fields, { merge: true });
    setUser(updated);
    if (updated.city) changeCity(updated.city);
    setEditOpen(false);
  }

  // Derived data
  const filt      = arr => city === 'All cities' ? arr : arr.filter(x => x.city === city);
  const userPosts = user ? threads.filter(t => t.authorId === user.uid) : [];
  const fEvents   = filt(events);
  const fMembers  = filt(members);
  const fIdeas    = filt(ideas);
  const fThreads  = city === 'All cities' ? threads : threads.filter(t => t.city === city || t.city === 'All');

  function renderScreen() {
    if (showProfile) return <ProfileScreen user={user} threads={threads} events={events} userPosts={userPosts} openEdit={() => setEditOpen(true)} setShowProfile={setShowProfile} deleteThread={deleteThread} onNewPost={() => setNewPostOpen(true)} onStatusChange={async s=>{await setDoc(doc(db,'users',user.uid),{status:s},{merge:true});setUser(u=>({...u,status:s}));}}/>;
    switch (tab) {
      case 'events':  return <EventsScreen  events={fEvents}   city={city} userId={user.uid} rsvp={rsvp}   deleteEvent={deleteEvent} onHostEvent={() => setHostEventOpen(true)}/>;
      case 'members': return <MembersScreen members={fMembers} city={city} userId={user.uid}
        userConnections={user.connections||{}} sentRequests={user.sentRequests||{}} receivedRequests={user.receivedRequests||{}}
        onSendRequest={sendRequest} onCancelRequest={cancelRequest} onAcceptRequest={acceptRequest}
        onSelect={setSelectedMember} onInvite={() => setInviteOpen(true)}/>;
      case 'ideas':   return <IdeasScreen   ideas={fIdeas}     city={city} userId={user.uid} upvote={upvote} deleteIdea={deleteIdea} onPostIdea={() => setPostIdeaOpen(true)} reactIdea={reactIdea} reactions={REACTIONS}/>;
      case 'threads': return <ThreadsScreen threads={fThreads} city={city} userId={user.uid} openThread={openThread} toggleThread={toggleThread} replyText={replyText} setReplyText={setReplyText} submitReply={submitReply} likeThread={likeThread} deleteThread={deleteThread} onNewPost={() => setNewPostOpen(true)} reactThread={reactThread} reactions={REACTIONS}/>;
      case 'chat':    return <ChatScreen    {...chat} city={city}/>;
      default:        return null;
    }
  }

  if (authLoading)    return <div className="auth-wrap"><div className="auth-loading"><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }}/>Loading…</div></div>;
  if (!user)          return <AuthScreen/>;
  if (!user.username) return <OnboardingScreen user={user} setUser={setUser}/>;

  return (
    <div className="app">
      {confetti && <Confetti/>}
      {dmPanelOpen && <DmPanel dm={dm} userConnections={user.connections||{}}
        receivedRequests={user.receivedRequests||{}} onAcceptRequest={acceptRequest} onDeclineRequest={declineRequest}
        onClose={() => setDmPanelOpen(false)}/>}
      <Nav
        tab={tab}             onTabChange={t => { setTab(t); setShowProfile(false); }}
        city={city}           setCity={changeCity}
        locStatus={locStatus} detectedCity={detectedCity}
        user={user}           showProfile={showProfile} setShowProfile={setShowProfile}
        openEdit={() => setEditOpen(true)}
        onLogout={() => { signOut(auth); setCity('All cities'); localStorage.removeItem('wfh-city'); }}
        crown={crown}
        dmUnread={dm.totalUnread + Object.keys(user.receivedRequests||{}).length}
        onDmToggle={() => setDmPanelOpen(p => !p)}
      />

      <div className="content">
        <div className="inner fade">{renderScreen()}</div>
      </div>

      <EditProfileModal open={editOpen}       user={user}           onClose={() => setEditOpen(false)}      onSave={saveProfile}/>
      <NewPostModal     open={newPostOpen}    newPost={newPost}     onClose={() => setNewPostOpen(false)}   setNewPost={setNewPost}   submitPost={submitPost}/>
      <HostEventModal   open={hostEventOpen}  newEvent={newEvent}   onClose={() => setHostEventOpen(false)} setNewEvent={setNewEvent} submitEvent={submitEvent}/>
      <PostIdeaModal    open={postIdeaOpen}   newIdea={newIdea}     onClose={() => setPostIdeaOpen(false)}  setNewIdea={setNewIdea}   submitIdea={submitIdea} ROLES={ROLES}/>
      <InviteModal      open={inviteOpen}                           onClose={() => setInviteOpen(false)}/>
      <MemberModal      member={selectedMember} onClose={() => setSelectedMember(null)} currentUserId={user?.uid}
        userConnections={user?.connections||{}} sentRequests={user?.sentRequests||{}} receivedRequests={user?.receivedRequests||{}}
        onSendRequest={sendRequest} onCancelRequest={cancelRequest}
        onAcceptRequest={uid => { acceptRequest(uid); dm.openDm(uid, selectedMember?.name, selectedMember?.photoURL, true); setDmPanelOpen(true); setSelectedMember(null); }}
        onDeclineRequest={uid => { declineRequest(uid); setSelectedMember(null); }}
        onMessage={m => { dm.openDm(m.id, m.name, m.photoURL); setDmPanelOpen(true); setSelectedMember(null); }}/>
    </div>
  );
}

export default App;
