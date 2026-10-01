// Seeds the local emulators with two verified, connected test accounts.
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

const env = await initializeTestEnvironment({ projectId: 'wfh-lounge', firestore: { host: '127.0.0.1', port: 8080 } });
await env.clearFirestore();
await env.withSecurityRulesDisabled(async ctx => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users', alice), { name: 'Alice', username: 'alice', city: 'Pune', role: 'Developer', initials: 'A', connections: { [bob]: true } });
  await setDoc(doc(db, 'users', bob),   { name: 'Bob',   username: 'bob',   city: 'Pune', role: 'Designer',  initials: 'B', connections: { [alice]: true } });
  await setDoc(doc(db, 'usernames/alice'), { uid: alice });
  await setDoc(doc(db, 'usernames/bob'),   { uid: bob });
  await setDoc(doc(db, 'events/e1'),  { title: 'Coffee meetup', type: 'IRL', city: 'Pune', location: 'Café', date: 'TBD', time: 'TBD', tags: [], host: 'Bob', hostId: bob, attendeeCount: 1, rsvps: { [bob]: true }, createdAt: serverTimestamp() });
  await setDoc(doc(db, 'threads/t1'), { title: 'How do you switch off?', body: 'Asking for a friend.', city: 'Pune', tags: [], author: 'Bob', authorId: bob, replyCount: 0, likeCount: 0, likes: {}, createdAt: serverTimestamp() });
  await setDoc(doc(db, 'ideas/i1'),   { title: 'Desk-sharing app', desc: '', city: 'Pune', tags: [], looking: [], stage: 'Idea', author: 'Bob', authorId: bob, votes: 0, upvotes: {}, createdAt: serverTimestamp() });
});
await env.cleanup();
console.log(JSON.stringify({ alice, bob }));
