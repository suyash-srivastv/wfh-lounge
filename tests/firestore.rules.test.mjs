// Firestore security rules tests. Run with: npm run test:rules
// (starts the Firestore emulator; nothing touches the real database).
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, collection,
  serverTimestamp, increment, deleteField, Timestamp, setLogLevel,
} from 'firebase/firestore';

// Denied writes are expected in these tests; don't print each one.
setLogLevel('silent');

let env;
const verified = uid => env.authenticatedContext(uid, { email_verified: true }).firestore();
const unverified = uid => env.authenticatedContext(uid, { email_verified: false }).firestore();
const admin = () => env.authenticatedContext('suyash', { email: 'suyash101997@gmail.com', email_verified: true }).firestore();
const fakeAdmin = () => env.authenticatedContext('mallory', { email: 'suyash101997@gmail.com', email_verified: false }).firestore();

// Writes a new doc together with the slow-mode stamp, the way the app does.
function withRate(db, uid, ref, data) {
  const b = writeBatch(db);
  b.set(ref, data);
  b.set(doc(db, 'rate', uid), { last: serverTimestamp() });
  return b.commit();
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-stillroom',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/alice'), { name: 'Alice', username: 'alice', connections: { bob: true } });
    await setDoc(doc(db, 'users/bob'),   { name: 'Bob',   username: 'bob',   connections: { alice: true } });
    await setDoc(doc(db, 'users/carol'), { name: 'Carol', username: 'carol' });
    await setDoc(doc(db, 'usernames/alice'), { uid: 'alice' });
    await setDoc(doc(db, 'usernames/bob'),   { uid: 'bob' });
    await setDoc(doc(db, 'events/e1'),  { title: 'Meetup', hostId: 'bob', host: 'Bob', attendeeCount: 1, rsvps: { bob: true } });
    await setDoc(doc(db, 'ideas/i1'),   { title: 'Idea', authorId: 'bob', author: 'Bob', votes: 0, upvotes: {}, reactions: { '🔥': { bob: true } } });
    await setDoc(doc(db, 'threads/t1'), { title: 'Hello', authorId: 'bob', author: 'Bob', replyCount: 0, likeCount: 0, likes: {} });
    await setDoc(doc(db, 'threads/t1/replies/rBob'), { body: 'hi', author: 'Bob', authorId: 'bob' });
  });
});

// ---- 1. Impersonation by display name ----

test('chat: posting with your real name works', async () => {
  const db = verified('alice');
  await assertSucceeds(withRate(db, 'alice', doc(collection(db, 'chats/Pune__general/messages')),
    { text: 'hi', user: 'Alice', userId: 'alice', timestamp: serverTimestamp() }));
});

test("chat: posting under someone else's name is blocked", async () => {
  const db = verified('alice');
  await assertFails(withRate(db, 'alice', doc(collection(db, 'chats/Pune__general/messages')),
    { text: 'hi', user: 'Bob', userId: 'alice', timestamp: serverTimestamp() }));
});

test("forum/event: posting as someone else's name is blocked", async () => {
  const db = verified('alice');
  await assertFails(withRate(db, 'alice', doc(collection(db, 'threads')),
    { title: 'x', body: '', author: 'Bob', authorId: 'alice', city: 'All', tags: [], replyCount: 0, likeCount: 0, likes: {} }));
  await assertFails(withRate(db, 'alice', doc(collection(db, 'events')),
    { title: 'x', location: 'y', host: 'Bob', hostId: 'alice', city: 'All', tags: [], attendeeCount: 1, rsvps: { alice: true } }));
});

// ---- 2/3. Username spoofing and squatting ----

test("username: setting your profile to someone else's handle is blocked", async () => {
  await assertFails(updateDoc(doc(verified('carol'), 'users/carol'), { username: 'bob' }));
});

test('username: changing your username after onboarding is blocked', async () => {
  const db = verified('alice');
  const b = writeBatch(db);
  b.set(doc(db, 'usernames/alice_two'), { uid: 'alice' });
  b.update(doc(db, 'users/alice'), { username: 'alice_two' });
  await assertFails(b.commit());
});

test('username: onboarding claim (profile + handle together) works once', async () => {
  const db = verified('carol');
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'users/carol'), { username: deleteField() }));
  const b = writeBatch(db);
  b.set(doc(db, 'usernames/carol'), { uid: 'carol' });
  b.update(doc(db, 'users/carol'), { username: 'carol' });
  await assertSucceeds(b.commit());
});

test('username: claiming extra handles is blocked', async () => {
  await assertFails(setDoc(doc(verified('alice'), 'usernames/spare_handle'), { uid: 'alice' }));
});

// ---- 4/5. DMs: connected only, blocking works ----

const dmMsg = (from, name) => ({ text: 'ciphertext', senderId: from, senderName: name, timestamp: serverTimestamp() });

test('dm: connected users can message each other', async () => {
  const db = verified('alice');
  await assertSucceeds(withRate(db, 'alice', doc(collection(db, 'dms/alice_bob/messages')), dmMsg('alice', 'Alice')));
});

test('dm: messaging a non-connection is blocked', async () => {
  const db = verified('carol');
  await assertFails(withRate(db, 'carol', doc(collection(db, 'dms/alice_carol/messages')), dmMsg('carol', 'Carol')));
});

test('dm: adding someone to your own connections does not let you DM them', async () => {
  const db = verified('carol');
  await assertSucceeds(updateDoc(doc(db, 'users/carol'), { 'connections.alice': true }));
  await assertFails(withRate(db, 'carol', doc(collection(db, 'dms/alice_carol/messages')), dmMsg('carol', 'Carol')));
});

test('dm: once blocked, messages are refused', async () => {
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'users/bob'), { 'blockedUsers.alice': true }));
  const db = verified('alice');
  await assertFails(withRate(db, 'alice', doc(collection(db, 'dms/alice_bob/messages')), dmMsg('alice', 'Alice')));
});

test("dm: reading someone else's conversation is blocked", async () => {
  await assertFails(getDoc(doc(verified('carol'), 'dms/alice_bob/messages/m1')));
});

// ---- 6. Inbox spoofing ----

const inbox = (over = {}) => ({ name: 'Alice', photoURL: null, lastMsg: 'New message', lastAt: serverTimestamp(), unread: 1, ...over });

test('inbox: the real sender can update your inbox entry', async () => {
  await assertSucceeds(setDoc(doc(verified('alice'), 'userInbox/bob/dms/alice'), inbox()));
});

test('inbox: a fake name, preview or unread jump is blocked', async () => {
  const db = verified('alice');
  await assertFails(setDoc(doc(db, 'userInbox/bob/dms/alice'), inbox({ name: 'Bank Support' })));
  await assertFails(setDoc(doc(db, 'userInbox/bob/dms/alice'), inbox({ lastMsg: 'Click this link' })));
  await assertFails(setDoc(doc(db, 'userInbox/bob/dms/alice'), inbox({ unread: 50 })));
});

test("inbox: a stranger can't write into your inbox", async () => {
  await assertFails(setDoc(doc(verified('carol'), 'userInbox/alice/dms/carol'), inbox({ name: 'Carol' })));
});

// ---- 7. Friend requests ----

test('friend request: sending with your real name works', async () => {
  await assertSucceeds(updateDoc(doc(verified('carol'), 'users/alice'),
    { 'receivedRequests.carol': { name: 'Carol', photoURL: null } }));
});

test('friend request: a fake name or photo is blocked', async () => {
  await assertFails(updateDoc(doc(verified('carol'), 'users/alice'),
    { 'receivedRequests.carol': { name: 'Bob', photoURL: null } }));
});

test("friend request: forging that someone sent you a request is blocked", async () => {
  await assertFails(updateDoc(doc(verified('carol'), 'users/alice'), { 'sentRequests.carol': true }));
});

test('friend request: connecting yourself without their request is blocked', async () => {
  await assertFails(updateDoc(doc(verified('carol'), 'users/alice'), { 'connections.carol': true }));
});

test('friend request: accepting a real request works', async () => {
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'users/alice'), { 'sentRequests.carol': true }));
  await assertSucceeds(updateDoc(doc(verified('carol'), 'users/alice'),
    { 'connections.carol': true, 'sentRequests.carol': deleteField() }));
});

// ---- 10/11. Counters and reactions ----

test('counters: RSVP moves the count by exactly one', async () => {
  const db = verified('alice');
  await assertSucceeds(updateDoc(doc(db, 'events/e1'), { 'rsvps.alice': true, attendeeCount: increment(1) }));
  await assertSucceeds(updateDoc(doc(db, 'events/e1'), { 'rsvps.alice': deleteField(), attendeeCount: increment(-1) }));
});

test('counters: faking a count is blocked', async () => {
  const db = verified('alice');
  await assertFails(updateDoc(doc(db, 'events/e1'), { 'rsvps.alice': true, attendeeCount: 500 }));
  await assertFails(updateDoc(doc(db, 'events/e1'), { attendeeCount: increment(1) }));
  await assertFails(updateDoc(doc(db, 'events/e1'), { 'rsvps.bob': deleteField(), attendeeCount: increment(-1) }));
});

test('reactions: you can add your own, not remove others or invent emojis', async () => {
  const db = verified('alice');
  await assertSucceeds(updateDoc(doc(db, 'ideas/i1'), { 'reactions.🔥.alice': true }));
  await assertFails(updateDoc(doc(db, 'ideas/i1'), { 'reactions.🔥.bob': deleteField() }));
  await assertFails(updateDoc(doc(db, 'ideas/i1'), { 'reactions.💩.alice': true }));
});

// ---- 12/13. Size limits and slow mode ----

test('size: a 1,001-character chat message is blocked', async () => {
  const db = verified('alice');
  await assertFails(withRate(db, 'alice', doc(collection(db, 'chats/Pune__general/messages')),
    { text: 'x'.repeat(1001), user: 'Alice', userId: 'alice', timestamp: serverTimestamp() }));
});

test('slow mode: posting without the rate stamp is blocked', async () => {
  await assertFails(setDoc(doc(collection(verified('alice'), 'chats/Pune__general/messages')),
    { text: 'hi', user: 'Alice', userId: 'alice', timestamp: serverTimestamp() }));
});

test('slow mode: posting again within 2 seconds is blocked', async () => {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'rate/alice'), { last: Timestamp.now() }));
  const db = verified('alice');
  await assertFails(withRate(db, 'alice', doc(collection(db, 'chats/Pune__general/messages')),
    { text: 'hi', user: 'Alice', userId: 'alice', timestamp: serverTimestamp() }));
});

// ---- 19. Replies ----

test('replies: posting a reply bumps the count by one', async () => {
  const db = verified('alice');
  const reply = doc(collection(db, 'threads/t1/replies'));
  const b = writeBatch(db);
  b.set(reply, { body: 'nice', author: 'Alice', authorId: 'alice', createdAt: serverTimestamp() });
  b.update(doc(db, 'threads/t1'), { replyCount: increment(1), lastReplyId: reply.id });
  b.set(doc(db, 'rate/alice'), { last: serverTimestamp() });
  await assertSucceeds(b.commit());
});

test('replies: bumping the count without a reply is blocked', async () => {
  await assertFails(updateDoc(doc(verified('alice'), 'threads/t1'), { replyCount: increment(1), lastReplyId: 'nope' }));
});

test("replies: you can delete your own reply, not someone else's", async () => {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'threads/t1/replies/rAlice'), { body: 'x', author: 'Alice', authorId: 'alice' }));
  const db = verified('alice');
  const b = writeBatch(db);
  b.delete(doc(db, 'threads/t1/replies/rAlice'));
  b.update(doc(db, 'threads/t1'), { replyCount: increment(-1), lastDeletedReplyId: 'rAlice' });
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'threads/t1'), { replyCount: 1 }));
  await assertSucceeds(b.commit());
  await assertFails(deleteDoc(doc(db, 'threads/t1/replies/rBob')));
});

// ---- 9. Email verification ----

test('unverified accounts can read their own profile but nothing else', async () => {
  const db = unverified('dave');
  await assertSucceeds(getDoc(doc(db, 'users/dave')));
  await assertFails(getDoc(doc(db, 'events/e1')));
  await assertFails(getDoc(doc(db, 'users/alice')));
});

// ---- Things that should keep working ----

test('your own Clarity plan stays private', async () => {
  await assertSucceeds(setDoc(doc(verified('alice'), 'reflections/alice'), { version: 6 }));
  await assertFails(getDoc(doc(verified('bob'), 'reflections/alice')));
});

test('editing your own profile works, within limits', async () => {
  const db = verified('alice');
  await assertSucceeds(updateDoc(doc(db, 'users/alice'), { bio: 'Building things', city: 'Pune' }));
  await assertFails(updateDoc(doc(db, 'users/alice'), { bio: 'x'.repeat(161) }));
});

// ---- Admin (only suyash101997@gmail.com, verified) ----

test('admin: can edit About and FAQ; everyone (even logged out) can read them', async () => {
  await assertSucceeds(setDoc(doc(admin(), 'site/about'), { title: 'Why', body: 'Because.' }));
  await assertSucceeds(setDoc(doc(admin(), 'faqs/f1'), { q: 'What?', a: 'This.', order: 1 }));
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'site/about')));
  await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'faqs/f1')));
});

test('admin: other users cannot edit About or FAQ', async () => {
  await assertFails(setDoc(doc(verified('alice'), 'site/about'), { title: 'Hacked', body: '' }));
  await assertFails(setDoc(doc(verified('alice'), 'faqs/f1'), { q: 'x', a: 'y', order: 1 }));
});

test('admin: an unverified account using the admin email gets nothing', async () => {
  await assertFails(setDoc(doc(fakeAdmin(), 'site/about'), { title: 'x', body: '' }));
  await assertFails(deleteDoc(doc(fakeAdmin(), 'events/e1')));
});

test("admin: can delete anyone's event, idea, thread and chat message", async () => {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'chats/Pune__general/messages/m1'), { text: 'spam', user: 'Bob', userId: 'bob' }));
  const db = admin();
  await assertSucceeds(deleteDoc(doc(db, 'events/e1')));
  await assertSucceeds(deleteDoc(doc(db, 'ideas/i1')));
  await assertSucceeds(deleteDoc(doc(db, 'chats/Pune__general/messages/m1')));
  await assertSucceeds(deleteDoc(doc(db, 'threads/t1')));
});

test("admin: can delete someone's reply (and its count)", async () => {
  await env.withSecurityRulesDisabled(ctx => updateDoc(doc(ctx.firestore(), 'threads/t1'), { replyCount: 1 }));
  const db = admin();
  const b = writeBatch(db);
  b.delete(doc(db, 'threads/t1/replies/rBob'));
  b.update(doc(db, 'threads/t1'), { replyCount: increment(-1), lastDeletedReplyId: 'rBob' });
  await assertSucceeds(b.commit());
});

test("admin: still can't read anyone's DMs or Clarity plans", async () => {
  await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'reflections/alice'), { version: 6 }));
  await assertFails(getDoc(doc(admin(), 'dms/alice_bob/messages/m1')));
  await assertFails(getDoc(doc(admin(), 'reflections/alice')));
});

test("non-admins still can't delete other people's content", async () => {
  await assertFails(deleteDoc(doc(verified('alice'), 'events/e1')));
  await assertFails(deleteDoc(doc(verified('alice'), 'threads/t1')));
});
