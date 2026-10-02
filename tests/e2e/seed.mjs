// Seeds the local emulators with two verified, connected test accounts.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const AUTH = 'http://127.0.0.1:9099';
async function account(email, name) {
  const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', displayName: name, returnSecureToken: true }),
  }).then(r => r.json());
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/wfh-lounge/accounts:update`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ localId: r.localId, emailVerified: true }),
  });
  return r.localId;
}

await fetch(`${AUTH}/emulator/v1/projects/wfh-lounge/accounts`, { method: 'DELETE' });
const alice = await account('alice@test.dev', 'Alice');
const bob   = await account('bob@test.dev', 'Bob');
const admin = await account('suyash101997@gmail.com', 'Suyash');
const dave  = await account('dave@test.dev', 'Dave');

// Dates relative to today, so the "What's on" tests never go stale.
const dayFromNow = n => { const d = new Date(Date.now() + n * 864e5); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

const env = await initializeTestEnvironment({ projectId: 'wfh-lounge', firestore: { host: '127.0.0.1', port: 8080 } });
await env.clearFirestore();
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users', alice), { name: 'Alice', username: 'alice', city: 'Pune', seedCity: 'Pune', joinedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 1)), role: 'Developer', initials: 'A', connections: { [bob]: true } });
  await setDoc(doc(db, 'users', bob),   { name: 'Bob',   username: 'bob',   city: 'Pune', seedCity: 'Pune', joinedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 2)), role: 'Designer',  initials: 'B', photoURL: 'https://lh3.googleusercontent.com/a/default-letter-photo',  connections: { [alice]: true } });
  await setDoc(doc(db, 'usernames/alice'), { uid: alice });
  await setDoc(doc(db, 'usernames/bob'),   { uid: bob });
  await setDoc(doc(db, 'users', admin), { name: 'Suyash', username: 'suyash', city: 'Pune', seedCity: 'Pune', joinedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 3)), role: 'Founder', initials: 'S' });
  await setDoc(doc(db, 'usernames/suyash'), { uid: admin });
  // A member in a city with no content yet (for empty states)
  await setDoc(doc(db, 'users', dave), { name: 'Dave', username: 'dave', city: 'Indore', seedCity: 'Indore', joinedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 4)), role: 'Writer', initials: 'D' });
  await setDoc(doc(db, 'usernames/dave'), { uid: dave });
  await setDoc(doc(db, 'events/e1'),  { title: 'Coffee meetup', type: 'IRL', city: 'Pune', location: 'Third Wave, Koregaon Park', date: dayFromNow(1), time: '15:30', tags: [], host: 'Bob', hostId: bob, attendeeCount: 1, rsvps: { [bob]: true }, createdAt: serverTimestamp() });
  await setDoc(doc(db, 'events/e2'),  { title: 'Sunday walk & talk', type: 'IRL', city: 'Pune', location: 'Empress Garden', date: 'TBD', time: 'TBD', tags: ['outdoors'], host: 'Bob', hostId: bob, attendeeCount: 1, rsvps: { [bob]: true }, createdAt: serverTimestamp() });
  await setDoc(doc(db, 'events/old'), { title: 'Last month\'s mixer', type: 'IRL', city: 'Pune', location: 'Somewhere', date: dayFromNow(-30), time: '19:00', tags: [], host: 'Bob', hostId: bob, attendeeCount: 3, rsvps: { [bob]: true }, createdAt: serverTimestamp() });
  await setDoc(doc(db, 'threads/t1'), { title: 'How do you switch off?', body: 'Asking for a friend.', city: 'Pune', tags: [], author: 'Bob', authorId: bob, replyCount: 0, likeCount: 0, likes: {}, createdAt: serverTimestamp() });
  await setDoc(doc(db, 'ideas/i1'),   { title: 'Desk-sharing app', desc: '', city: 'Pune', tags: [], looking: [], stage: 'Idea', author: 'Bob', authorId: bob, votes: 0, upvotes: {}, createdAt: serverTimestamp() });
});
await env.cleanup();
console.log(JSON.stringify({ alice, bob, admin }));
