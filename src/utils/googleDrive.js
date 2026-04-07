/**
 * Google Drive backup/restore utility
 *
 * Uses Google Identity Services (GIS) token flow — no backend required.
 * Access token is kept in memory only (~1 hour lifetime).
 * Scope: drive.file — only files created by this app, minimal permission.
 *
 * Setup: set VITE_GOOGLE_CLIENT_ID in .env.local
 */

const SCOPE        = 'https://www.googleapis.com/auth/drive.file'
const BACKUP_NAME  = 'PersonalLedger_備份.json'
const DRIVE_API    = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API   = 'https://www.googleapis.com/upload/drive/v3'

// ── Token state (memory only) ────────────────────────────────────────────────

let _tokenClient   = null
let _accessToken   = null
let _tokenExpiresAt = 0

export function isTokenValid() {
  return !!_accessToken && Date.now() < _tokenExpiresAt - 30_000
}

export function getClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}

// ── OAuth ────────────────────────────────────────────────────────────────────

/**
 * Request an access token via GIS popup.
 * Resolves when the user grants permission, rejects on error/cancel.
 */
export function requestToken() {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services 尚未載入，請重新整理頁面'))
      return
    }
    const clientId = getClientId()
    if (!clientId) {
      reject(new Error('未設定 Google Client ID，請在 .env.local 加入 VITE_GOOGLE_CLIENT_ID'))
      return
    }

    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope:     SCOPE,
      callback:  (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error))
          return
        }
        _accessToken    = response.access_token
        _tokenExpiresAt = Date.now() + (response.expires_in || 3600) * 1000
        resolve(_accessToken)
      },
    })

    _tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

/**
 * Ensure we have a valid token. If expired, request a new one.
 * Pass { silent: true } to avoid popup if no token (returns false instead).
 */
export async function ensureToken({ silent = false } = {}) {
  if (isTokenValid()) return true
  if (silent) return false
  await requestToken()
  return true
}

export function revokeToken() {
  if (_accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(_accessToken)
  }
  _accessToken    = null
  _tokenExpiresAt = 0
}

// ── Drive API helpers ────────────────────────────────────────────────────────

async function driveRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Drive API 錯誤 (${res.status})`)
  }
  return res
}

// ── File operations ──────────────────────────────────────────────────────────

/**
 * Find the backup file in Drive.
 * Returns { id, name, modifiedTime } or null if not found.
 */
export async function findBackupFile() {
  const params = new URLSearchParams({
    q:      `name='${BACKUP_NAME}' and trashed=false`,
    fields: 'files(id,name,modifiedTime)',
    spaces: 'drive',
  })
  const res  = await driveRequest(`${DRIVE_API}/files?${params}`)
  const data = await res.json()
  return data.files?.[0] ?? null
}

/**
 * Upload (create or update) the backup file with JSON content.
 * Returns the file metadata.
 */
export async function uploadBackup(jsonText) {
  const existing = await findBackupFile()
  const metadata = { name: BACKUP_NAME, mimeType: 'application/json' }
  const blob     = new Blob([jsonText], { type: 'application/json' })

  let url, method
  if (existing) {
    // Update existing file
    url    = `${UPLOAD_API}/files/${existing.id}?uploadType=multipart&fields=id,name,modifiedTime`
    method = 'PATCH'
  } else {
    // Create new file
    url    = `${UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime`
    method = 'POST'
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob)

  const res  = await driveRequest(url, { method, body: form })
  return res.json()
}

/**
 * Download the backup file content.
 * Returns the raw JSON string.
 */
export async function downloadBackup(fileId) {
  const res = await driveRequest(`${DRIVE_API}/files/${fileId}?alt=media`)
  return res.text()
}
