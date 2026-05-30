// Deterministic AES-GCM-256 key derived from both participant UIDs.
// Same pair of UIDs → same key on every device — no key sync needed.
// Protects against plaintext visibility in the database; not resistant to
// someone who has the source code and both UIDs.

const APP_SECRET = 'wfh-lounge-dm-v1';
const keyCache   = {};

export async function getDmKey(uid1, uid2) {
  const cacheKey = [uid1, uid2].sort().join('_');
  if (keyCache[cacheKey]) return keyCache[cacheKey];

  const raw     = new TextEncoder().encode([uid1, uid2].sort().join(':') + ':' + APP_SECRET);
  const salt    = new TextEncoder().encode('wfh-salt-2024');
  const base    = await crypto.subtle.importKey('raw', raw, 'PBKDF2', false, ['deriveKey']);
  const key     = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  keyCache[cacheKey] = key;
  return key;
}

export async function encryptMessage(text, key) {
  const iv     = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  const buf    = new Uint8Array(12 + cipher.byteLength);
  buf.set(iv);
  buf.set(new Uint8Array(cipher), 12);
  return btoa(String.fromCharCode(...buf));
}

export async function decryptMessage(b64, key) {
  try {
    const buf   = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, key, buf.slice(12));
    return new TextDecoder().decode(plain);
  } catch {
    return b64; // not ciphertext (old plaintext message) — return as-is
  }
}
