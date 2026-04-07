<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 px-0 md:px-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden">
        <!-- Handle (mobile) -->
        <div class="md:hidden flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 bg-slate-200 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <!-- Google Drive icon -->
            <div class="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 87.3 78" class="w-7 h-7">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.06 9.06 0 000 53h27.5z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.65 10.65z" fill="#ea4335"/>
                <path d="M43.65 25L57.4 0H29.9z" fill="#00832d"/>
                <path d="M59.8 53H87.3L73.55 29.5 57.4 0 43.65 25 57.4 53z" fill="#2684fc"/>
                <path d="M43.65 25L27.5 53H59.8z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <h2 class="text-base font-semibold text-slate-900">Google Drive 備份</h2>
              <p class="text-xs text-slate-400">手動讀取 / 寫入</p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- No Client ID warning -->
        <div v-if="!hasClientId" class="px-6 py-8 text-center">
          <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-slate-700 mb-1">尚未設定 Google Client ID</p>
          <p class="text-xs text-slate-400 leading-relaxed">
            請在專案根目錄建立 <code class="bg-slate-100 px-1 rounded text-slate-600">.env.local</code>，<br>
            加入 <code class="bg-slate-100 px-1 rounded text-slate-600">VITE_GOOGLE_CLIENT_ID=你的Client ID</code>
          </p>
        </div>

        <!-- Main content -->
        <div v-else class="px-6 py-5 space-y-4">
          <!-- Auth status -->
          <div class="flex items-center gap-3 p-3 rounded-xl" :class="isAuthed ? 'bg-emerald-50' : 'bg-slate-50'">
            <div class="w-2 h-2 rounded-full flex-shrink-0" :class="isAuthed ? 'bg-emerald-500' : 'bg-slate-300'"></div>
            <p class="text-xs font-medium" :class="isAuthed ? 'text-emerald-700' : 'text-slate-500'">
              {{ isAuthed ? '已授權（本次操作有效）' : '尚未授權，請先登入 Google' }}
            </p>
            <button
              v-if="isAuthed"
              @click="handleRevoke"
              class="ml-auto text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >登出</button>
          </div>

          <!-- Backup file info -->
          <div v-if="backupFile" class="p-3 bg-blue-50 rounded-xl">
            <p class="text-xs font-medium text-blue-700 mb-0.5">雲端現有備份</p>
            <p class="text-xs text-blue-500">最後更新：{{ formatDate(backupFile.modifiedTime) }}</p>
          </div>

          <!-- Error -->
          <div v-if="error" class="p-3 bg-red-50 rounded-xl">
            <p class="text-xs text-red-600">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="space-y-2">
            <!-- Upload -->
            <button
              @click="handleUpload"
              :disabled="loading"
              class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-colors cursor-pointer"
              :class="loading ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'"
            >
              <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-700">備份到 Google Drive</p>
                <p class="text-xs text-slate-400">將目前資料寫入雲端（{{ backupFile ? '覆蓋更新' : '新建檔案' }}）</p>
              </div>
            </button>

            <!-- Download -->
            <button
              @click="handleDownload"
              :disabled="loading"
              class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-colors cursor-pointer"
              :class="loading ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'"
            >
              <div class="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-700">從 Google Drive 還原</p>
                <p class="text-xs text-slate-400">讀取雲端備份並匯入（會覆蓋本機資料）</p>
              </div>
            </button>
          </div>

          <!-- Loading indicator -->
          <div v-if="loading" class="flex items-center justify-center gap-2 py-2">
            <svg class="w-4 h-4 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            <span class="text-xs text-slate-500">{{ loadingText }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 pt-1">
          <p class="text-xs text-slate-400 text-center leading-relaxed">
            授權範圍僅限此 app 建立的檔案（drive.file），<br>不會讀取 Drive 內的其他資料。
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import {
  getClientId, isTokenValid, requestToken, revokeToken,
  findBackupFile, uploadBackup, downloadBackup,
} from '../utils/googleDrive.js'
import { useLedgerStore } from '../stores/ledger.js'
import { isEncrypted } from '../utils/crypto.js'

const emit = defineEmits(['close', 'toast'])
const store = useLedgerStore()

const hasClientId = computed(() => !!getClientId())
const isAuthed    = ref(isTokenValid())
const loading     = ref(false)
const loadingText = ref('')
const error       = ref('')
const backupFile  = ref(null)

function formatDate(iso) {
  return dayjs(iso).format('YYYY/MM/DD HH:mm')
}

async function authorize() {
  error.value = ''
  await requestToken()
  isAuthed.value = true
  await refreshFileInfo()
}

async function refreshFileInfo() {
  try {
    backupFile.value = await findBackupFile()
  } catch {
    // non-critical
  }
}

function handleRevoke() {
  revokeToken()
  isAuthed.value = false
  backupFile.value = null
}

async function handleUpload() {
  error.value = ''
  try {
    if (!isAuthed.value) await authorize()
    loading.value   = true
    loadingText.value = '正在備份...'
    const payload = JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      ledgers:            store.ledgers,
      transactions:       store.transactions,
      transfers:          store.transfers,
      recurringExpenses:  store.recurringExpenses,
    }, null, 2)
    await uploadBackup(payload)
    await refreshFileInfo()
    emit('toast', { ok: true, message: '備份成功！已寫入 Google Drive' })
    emit('close')
  } catch (e) {
    error.value = e.message || '備份失敗，請再試一次'
  } finally {
    loading.value = false
  }
}

async function handleDownload() {
  error.value = ''
  try {
    if (!isAuthed.value) await authorize()
    await refreshFileInfo()
    if (!backupFile.value) {
      error.value = 'Google Drive 上找不到備份檔案，請先備份一次'
      return
    }
    loading.value     = true
    loadingText.value = '正在下載備份...'
    const text   = await downloadBackup(backupFile.value.id)
    if (isEncrypted(text)) {
      // Pass to parent to handle decryption via existing CryptoModal
      emit('toast', { ok: false, message: '雲端備份為加密檔案，請使用本機匯入功能解密還原' })
      emit('close')
      return
    }
    const result = store.importData(text)
    if (result.ok) {
      emit('toast', { ok: true, message: `還原成功！共 ${store.transactions.length} 筆交易` })
      emit('close')
    } else {
      error.value = result.error
    }
  } catch (e) {
    error.value = e.message || '下載失敗，請再試一次'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (isTokenValid()) {
    isAuthed.value = true
    await refreshFileInfo()
  }
})
</script>
