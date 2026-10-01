import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, deleteField, increment, writeBatch, deleteDoc, onSnapshot } from 'firebase/firestore';
import { addWithRate } from './firestoreWrites';
import { track, trackScreen, identify } from './analytics';
import { notify } from './notify';
import { ROLES, REACTIONS } from './constants';
import { useFirestoreListeners, useMemberProfile, useAuthorThreads, useMyStats, useProfiles } from './hooks/useFirestoreListeners';
import { useChat } from './hooks/useChat';
import { useDM }   from './hooks/useDM';
import Confetti          from './components/Confetti';
import DmPanel           from './components/DmPanel';
import AuthScreen        from './components/AuthScreen';
import OnboardingScreen  from './components/OnboardingScreen';
import VerifyEmailScreen from './components/VerifyEmailScreen';
import Clarity           from './components/Clarity';
import Nav               from './components/Nav';
import EditProfileModal  from './components/modals/EditProfileModal';
import NewPostModal      from './components/modals/NewPostModal';
import HostEventModal    from './components/modals/HostEventModal';
import PostIdeaModal     from './components/modals/PostIdeaModal';
import InviteModal       from './components/modals/InviteModal';
import EventDetailModal  from './components/modals/EventDetailModal';
import CompleteProfileModal from './components/modals/CompleteProfileModal';
import MemberProfilePage from './screens/MemberProfilePage';
import EventsScreen      from './screens/EventsScreen';
import MembersScreen     from './screens/MembersScreen';
import IdeasScreen       from './screens/IdeasScreen';
import ThreadsScreen     from './screens/ThreadsScreen';
import ChatScreen        from './screens/ChatScreen';
import ProfileScreen     from './screens/ProfileScreen';
import AboutScreen       from './screens/AboutScreen';
import AdminScreen       from './screens/AdminScreen';
import IntroScreen       from './screens/IntroScreen';
import { ADMIN_EMAIL }   from './aboutContent';

function App(){
  const [user,          setUser]          = useState(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [needsVerify,   setNeedsVerify]   = useState(null);  // email to verify, or null
  const [isAdmin,       setIsAdmin]       = useState(false); // UI only — the rules enforce it
  const [showAdmin,     setShowAdmin]     = useState(false);
  const [membersView,   setMembersView]   = useState('nearby');  // 'nearby' | 'friends'
  const [openEventId,   setOpenEventId]   = useState(null);
  // First visit on this device: show the full-screen intro before sign-in.
  const [introSeen,     setIntroSeen]     = useState(() => { try { return localStorage.getItem('stillroom-intro-seen') === '1'; } catch { return true; } });
  const [authMode,      setAuthMode]      = useState('login');
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
  const [inviteOpen,      setInviteOpen]      = useState(false);
  const [viewingMemberId, setViewingMemberId] = useState(null);
  const [crown,         setCrown]         = useState(false);
  const [confetti,      setConfetti]      = useState(false);
  const [dmPanelOpen,   setDmPanelOpen]   = useState(false);

  // Nothing loads until the account is verified (the rules would refuse it).
  const activeUser = user && !needsVerify ? user : null;
  const lists   = useFirestoreListeners(activeUser, city);
  const events  = lists.events.items;
  const ideas   = lists.ideas.items;
  const threads = lists.threads.items;
  const members = lists.members.items;
  const dm = useDM(activeUser);

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
          blockedUsers:     d.blockedUsers     || {},
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
  const chat = useChat(activeUser, tab, city);

  // Restore saved city. Location is never requested automatically — only when
  // the user taps "Use my location" in the city picker.
  useEffect(() => {
    const saved = localStorage.getItem('wfh-city');
    if (saved) { setCity(saved); setLocStatus('detected'); }
  }, []);

  function detectLocation() {
    if (!navigator.geolocation) { setLocStatus('failed'); return; }
    setLocStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res  = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          const name = data.city || data.locality || data.principalSubdivision || null;
          if (!name) { setLocStatus('failed'); return; }
          setDetectedCity(name);
          changeCity(name);
          setLocStatus('detected');
        } catch { setLocStatus('failed'); }
      },
      () => setLocStatus('failed'),
      { timeout: 8000 }
    );
  }

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      // Email/password accounts must verify first; Google accounts already are.
      const unverified = fbUser && !fbUser.emailVerified && fbUser.providerData.some(p => p.providerId === 'password');
      setNeedsVerify(unverified ? fbUser.email : null);
      setIsAdmin(!!fbUser && fbUser.email === ADMIN_EMAIL && fbUser.emailVerified);
      identify(fbUser?.uid);
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          if (!snap.exists()) {
            // Never fall back to the email: profiles are visible to other members.
            const name     = (fbUser.displayName || 'New member').slice(0, 50);
            const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const profile  = { name, city: '', role: '', initials };
            await setDoc(doc(db, 'users', fbUser.uid), profile);
            setUser({ ...profile, uid: fbUser.uid });
          } else {
            const profile = snap.data() || {};
            setUser({ ...profile, uid: fbUser.uid });
          }
        } catch {
          setUser({ uid: fbUser.uid, name: 'New member', initials: 'NM' });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Report which screen people are on (the app has no per-tab URLs).
  const screenName = !user ? 'signed_out' : viewingMemberId ? 'member_profile' : showAdmin ? 'admin' : showProfile ? 'my_profile' : tab;
  useEffect(() => { if (user?.username) trackScreen(screenName); }, [screenName, !!user?.username]);

  // Open on the user's home city whenever they log in or finish sign-up.
  // (Picking another city in the nav still works for the rest of the session.)
  const hasProfile = !!user?.username;
  useEffect(() => {
    const home = user?.city;
    if (hasProfile && home) { setCity(home); localStorage.setItem('wfh-city', home); }
  }, [user?.uid, hasProfile]);

  // The city you're browsing is kept on this device only — switching it
  // doesn't write to your profile (your home city is set in Edit profile).
  function changeCity(c) {
    setCity(c);
    localStorage.setItem('wfh-city', c);
  }

  // --- Action functions ---
  async function rsvp(id) {
    const ev    = events.find(e => e.id === id);
    const going = !!(ev?.rsvps?.[user.uid]);
    await updateDoc(doc(db,'events',id), { [`rsvps.${user.uid}`]: going ? deleteField() : true, attendeeCount: increment(going ? -1 : 1) });
    if (!going) { track('event_rsvp', { city }); notify(user, ev?.hostId, 'event_rsvp', { refId: id, title: ev?.title }); }
  }
  async function sendRequest(memberId) {
    await updateDoc(doc(db,'users',user.uid), { [`sentRequests.${memberId}`]: true });
    await updateDoc(doc(db,'users',memberId), {
      [`receivedRequests.${user.uid}`]: { name: user.name, photoURL: user.photoURL || null },
    });
    track('connect_request');
    notify(user, memberId, 'friend_request');
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
    notify(user, fromUid, 'request_accepted');
  }
  async function declineRequest(fromUid) {
    await updateDoc(doc(db,'users',user.uid), { [`receivedRequests.${fromUid}`]: deleteField() });
    await updateDoc(doc(db,'users',fromUid), { [`sentRequests.${user.uid}`]: deleteField() });
  }
  async function unfriend(uid) {
    await updateDoc(doc(db,'users',user.uid), { [`connections.${uid}`]: deleteField() });
    await updateDoc(doc(db,'users',uid), { [`connections.${user.uid}`]: deleteField() });
  }
  async function blockUser(uid) {
    await updateDoc(doc(db,'users',user.uid), {
      [`blockedUsers.${uid}`]: true,
      [`connections.${uid}`]: deleteField(),
      [`sentRequests.${uid}`]: deleteField(),
      [`receivedRequests.${uid}`]: deleteField(),
    });
    await updateDoc(doc(db,'users',uid), {
      [`connections.${user.uid}`]: deleteField(),
      [`sentRequests.${user.uid}`]: deleteField(),
      [`receivedRequests.${user.uid}`]: deleteField(),
    });
  }
  async function unblockUser(uid) {
    await updateDoc(doc(db,'users',user.uid), { [`blockedUsers.${uid}`]: deleteField() });
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
  // A reply and its count change are written together; the rules check they match.
  async function submitReply() {
    if (!replyText.trim() || !openThread) return;
    const threadId = openThread;
    const thread   = threads.find(t => t.id === threadId);
    const replyRef = await addWithRate(user.uid, ['threads', threadId, 'replies'],
      { body: replyText.trim(), author: user.name, authorId: user.uid, createdAt: serverTimestamp() },
      (batch, ref) => batch.update(doc(db, 'threads', threadId), { replyCount: increment(1), lastReplyId: ref.id }));
    track('reply_posted');
    notify(user, thread?.authorId, 'reply', { refId: threadId, replyId: replyRef.id, title: thread?.title });
    setReplyText('');
  }
  async function deleteReply(threadId, replyId) {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'threads', threadId, 'replies', replyId));
    batch.update(doc(db, 'threads', threadId), { replyCount: increment(-1), lastDeletedReplyId: replyId });
    await batch.commit();
  }
  async function submitPost() {
    if (!newPost.title.trim()) return;
    await addWithRate(user.uid, ['threads'], { title:newPost.title.trim(), body:newPost.body.trim(), author:user.name, authorId:user.uid, city:city==='All cities'?'All':city, tags:['general'], replyCount:0, likeCount:0, likes:{}, createdAt:serverTimestamp() });
    track('post_created', { city });
    setNewPost({ title:'', body:'' }); setNewPostOpen(false);
  }
  async function submitEvent() {
    if (!newEvent.title.trim() || !newEvent.location.trim()) return;
    const tags = newEvent.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
    await addWithRate(user.uid, ['events'], { title:newEvent.title.trim(), type:newEvent.type, city:city==='All cities'?'All':city, location:newEvent.location.trim(), desc:(newEvent.desc||'').trim(), date:newEvent.date||'TBD', time:newEvent.time||'TBD', tags, host:user.name, hostId:user.uid, attendeeCount:1, rsvps:{[user.uid]:true}, createdAt:serverTimestamp() });
    track('event_hosted', { city, type: newEvent.type });
    setNewEvent({ title:'', type:'IRL', location:'', desc:'', date:'', time:'', tags:'' }); setHostEventOpen(false);
  }
  async function submitIdea() {
    if (!newIdea.title.trim()) return;
    const tags = newIdea.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
    await addWithRate(user.uid, ['ideas'], { title:newIdea.title.trim(), desc:newIdea.desc.trim(), author:user.name, authorId:user.uid, city:city==='All cities'?'All':city, votes:0, stage:newIdea.stage, tags, looking:newIdea.looking, upvotes:{}, createdAt:serverTimestamp() });
    track('idea_posted', { city });
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
    await setDoc(doc(db,'users',user.uid), fields, { merge: true });
    setUser(updated);
    if (updated.city) changeCity(updated.city);
    setEditOpen(false);
  }

  // No city on the profile? Ask after sign-up / login. "Later" lasts this visit.
  const laterKey = 'stillroom-cp-later-' + (user?.uid || '');
  const [askLater, setAskLater] = useState(false);
  useEffect(() => { try { setAskLater(sessionStorage.getItem(laterKey) === '1'); } catch { setAskLater(false); } }, [laterKey]);
  const askCity = !!user?.username && !needsVerify && !user.city && !askLater;
  function laterCity() { try { sessionStorage.setItem(laterKey, '1'); } catch {} setAskLater(true); track('city_prompt_later'); }
  async function saveMissing({ city: c, role, bio }) {
    const fields = { city: c, ...(role ? { role } : {}), ...(bio ? { bio } : {}) };
    await setDoc(doc(db, 'users', user.uid), fields, { merge: true });
    setUser(u => ({ ...u, ...fields }));
    changeCity(c);
    track('city_prompt_saved', { via_prompt: true });
  }

  // Derived data (city filtering now happens on the server)
  const userPosts     = useAuthorThreads(activeUser, user?.uid);
  const myStats       = useMyStats(showProfile ? activeUser : null);
  const fMembers      = members.filter(m => !user?.blockedUsers?.[m.id]);
  const fetchedMember = useMemberProfile(activeUser, viewingMemberId);
  const viewingMember = viewingMemberId ? (members.find(m => m.id === viewingMemberId) || fetchedMember) : null;
  const memberPosts   = useAuthorThreads(activeUser, viewingMemberId);
  const more = l => ({ hasMore: l.hasMore, onLoadMore: l.loadMore });
  const friends = useProfiles(activeUser, Object.keys(user?.connections || {}));

  // Tapping a notification takes you to the thing it's about.
  function openNotification(n) {
    setShowProfile(false); setShowAdmin(false); setViewingMemberId(null);
    if (n.type === 'friend_request')   { setTab('members'); setMembersView('friends'); }
    if (n.type === 'request_accepted') { dm.openDm(n.fromUid, n.fromName, null); setDmPanelOpen(true); }
    if (n.type === 'reply')            { setTab('threads'); setOpenThread(n.refId); }
    if (n.type === 'event_rsvp')       { setTab('events'); }
  }

  function renderScreen() {
    const memberProfileProps = {
      threads: memberPosts,
      currentUserId: user.uid,
      userConnections: user.connections||{},
      sentRequests:    user.sentRequests||{},
      receivedRequests: user.receivedRequests||{},
      blockedUsers:    user.blockedUsers||{},
      onSendRequest:   sendRequest,
      onCancelRequest: cancelRequest,
      onAcceptRequest: uid => { acceptRequest(uid); dm.openDm(uid, viewingMember?.name, viewingMember?.photoURL, true); setDmPanelOpen(true); setViewingMemberId(null); },
      onDeclineRequest: uid => { declineRequest(uid); setViewingMemberId(null); },
      onMessage:       m => { dm.openDm(m.id, m.name, m.photoURL); setDmPanelOpen(true); setViewingMemberId(null); },
      onUnfriend:      uid => unfriend(uid),
      onBlock:         uid => blockUser(uid),
      onUnblock:       uid => unblockUser(uid),
      onBack:          () => setViewingMemberId(null),
    };
    if (viewingMember) return <MemberProfilePage member={viewingMember} {...memberProfileProps}/>;
    if (viewingMemberId) return <div className="empty">Loading profile…</div>;
    if (showAdmin && isAdmin) return <AdminScreen onBack={() => setShowAdmin(false)}/>;
    if (showProfile)   return <ProfileScreen user={user} stats={myStats} userPosts={userPosts} openEdit={() => setEditOpen(true)} setShowProfile={setShowProfile} deleteThread={deleteThread} onNewPost={() => setNewPostOpen(true)} onStatusChange={async s=>{await setDoc(doc(db,'users',user.uid),{status:s},{merge:true});setUser(u=>({...u,status:s}));}}/>;
    switch (tab) {
      case 'events':  return <EventsScreen  events={events} {...more(lists.events)} city={city} userId={user.uid} userName={user.name} rsvp={rsvp}   deleteEvent={deleteEvent} onHostEvent={() => setHostEventOpen(true)} isAdmin={isAdmin}
        onOpenEvent={setOpenEventId} onViewProfile={uid => setViewingMemberId(uid)}/>;
      case 'members': return <MembersScreen members={fMembers} {...more(lists.members)} loading={lists.members.loading} city={city} userId={user.uid}
        userConnections={user.connections||{}} sentRequests={user.sentRequests||{}} receivedRequests={user.receivedRequests||{}}
        onSendRequest={sendRequest} onCancelRequest={cancelRequest} onAcceptRequest={acceptRequest} onDeclineRequest={declineRequest}
        onSelect={m => setViewingMemberId(m.id)} onInvite={() => setInviteOpen(true)}
        onMessage={m => { dm.openDm(m.id, m.name, m.photoURL); setDmPanelOpen(true); }}
        view={membersView} setView={setMembersView} friends={friends.items} friendsLoading={friends.loading}/>;
      case 'ideas':   return <IdeasScreen   ideas={ideas} {...more(lists.ideas)} city={city} userId={user.uid} upvote={upvote} deleteIdea={deleteIdea} onPostIdea={() => setPostIdeaOpen(true)} reactIdea={reactIdea} reactions={REACTIONS} isAdmin={isAdmin}/>;
      case 'threads': return <ThreadsScreen threads={threads} {...more(lists.threads)} city={city} userId={user.uid} openThread={openThread} toggleThread={toggleThread} replyText={replyText} setReplyText={setReplyText} submitReply={submitReply} likeThread={likeThread} deleteThread={deleteThread} onNewPost={t => { if (typeof t === 'string') setNewPost({ title: t, body: '' }); setNewPostOpen(true); }} reactThread={reactThread} reactions={REACTIONS} deleteReply={deleteReply} isAdmin={isAdmin}/>;
      case 'about':   return <AboutScreen/>;
      case 'chat':    return <ChatScreen    {...chat} city={city} userId={user.uid} isAdmin={isAdmin} onViewProfile={uid => uid === user.uid ? setShowProfile(true) : setViewingMemberId(uid)}/>;
      default:        return null;
    }
  }

  if (authLoading)    return <div className="auth-wrap"><div className="auth-loading"><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }}/>Putting the kettle on…</div></div>;
  if (!user && !introSeen) {
    const done = mode => { try { localStorage.setItem('stillroom-intro-seen', '1'); } catch {} setAuthMode(mode); setIntroSeen(true); };
    return <IntroScreen onJoin={() => done('signup')} onLogin={() => done('login')}/>;
  }
  if (!user)          return <AuthScreen key={authMode} initialMode={authMode}/>;
  if (needsVerify)    return <VerifyEmailScreen email={needsVerify} onVerified={() => setNeedsVerify(null)}/>;
  if (!user.username) return <OnboardingScreen user={user} setUser={setUser}/>;

  return (
    <div className="app">
      {confetti && <Confetti/>}
      {dmPanelOpen && <DmPanel dm={dm} userConnections={user.connections||{}}
        receivedRequests={user.receivedRequests||{}} blockedUsers={user.blockedUsers||{}}
        onAcceptRequest={acceptRequest} onDeclineRequest={declineRequest}
        onViewProfile={uid => { setViewingMemberId(uid); setDmPanelOpen(false); }}
        onClose={() => setDmPanelOpen(false)}/>}
      <Nav
        tab={tab}             onTabChange={t => { setTab(t); setShowProfile(false); setShowAdmin(false); setViewingMemberId(null); }}
        isAdmin={isAdmin}
        onAdmin={() => { setShowAdmin(true); setShowProfile(false); setViewingMemberId(null); }}
        city={city}           setCity={changeCity}
        locStatus={locStatus} detectedCity={detectedCity} onDetectLocation={detectLocation}
        user={user}           showProfile={showProfile} setShowProfile={setShowProfile}
        openEdit={() => setEditOpen(true)}
        onLogout={() => { try { sessionStorage.removeItem(laterKey); } catch {} setAskLater(false); signOut(auth); setCity('All cities'); localStorage.removeItem('wfh-city'); setShowAdmin(false); setTab('events'); }}
        crown={crown}
        dmUnread={dm.totalUnread}
        onDmToggle={() => setDmPanelOpen(p => !p)}
        onNotification={openNotification}
        onNavigate={t => { setTab(t); setShowProfile(false); setViewingMemberId(null); }}
      />

      <div className="content">
        <div className="inner fade">
          {!viewingMember && !showProfile && !showAdmin && tab !== 'chat' && tab !== 'about' && <Clarity userId={user.uid} variant="card"/>}
          {renderScreen()}
        </div>
      </div>

      <EditProfileModal open={editOpen}       user={user}           onClose={() => setEditOpen(false)}      onSave={saveProfile}/>
      <NewPostModal     open={newPostOpen}    newPost={newPost}     onClose={() => setNewPostOpen(false)}   setNewPost={setNewPost}   submitPost={submitPost} city={city}/>
      <HostEventModal   open={hostEventOpen}  newEvent={newEvent}   onClose={() => setHostEventOpen(false)} setNewEvent={setNewEvent} submitEvent={submitEvent}/>
      <PostIdeaModal    open={postIdeaOpen}   newIdea={newIdea}     onClose={() => setPostIdeaOpen(false)}  setNewIdea={setNewIdea}   submitIdea={submitIdea} ROLES={ROLES}/>
      <InviteModal      open={inviteOpen} onClose={() => setInviteOpen(false)}/>
      {askCity && <CompleteProfileModal user={user} onSave={saveMissing} onLater={laterCity}/>}
      {openEventId && <EventDetailModal ev={events.find(e => e.id === openEventId)} userId={user.uid} isAdmin={isAdmin}
        onClose={() => setOpenEventId(null)} rsvp={rsvp} deleteEvent={deleteEvent}
        onViewProfile={uid => uid === user.uid ? setShowProfile(true) : setViewingMemberId(uid)}/>}
    </div>
  );
}

export default App;
