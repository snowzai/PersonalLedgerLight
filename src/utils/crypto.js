const PBKDF2_ITERATIONS = 200_000

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

async function deriveKey(passphrase, pepper, saltBytes) {
  const enc = new TextEncoder()
  const raw = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase + '\0' + pepper),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// Returns an encrypted JSON string (envelope format)
export async function encryptData(jsonText, passphrase, pepper) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv   = crypto.getRandomValues(new Uint8Array(12))
  const key  = await deriveKey(passphrase, pepper, salt)
  const enc  = new TextEncoder()
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(jsonText))
  return JSON.stringify({ encrypted: true, v: 1, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(cipher) })
}

// Returns the original JSON string, or throws on wrong passphrase/pepper
export async function decryptData(encryptedText, passphrase, pepper) {
  const obj  = JSON.parse(encryptedText)
  const salt = fromBase64(obj.salt)
  const iv   = fromBase64(obj.iv)
  const data = fromBase64(obj.data)
  const key  = await deriveKey(passphrase, pepper, salt)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(plain)
}

// Check if a text string is an encrypted envelope
export function isEncrypted(text) {
  try { return JSON.parse(text)?.encrypted === true } catch { return false }
}
