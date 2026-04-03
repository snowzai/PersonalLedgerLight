<template>
  <div class="min-h-screen flex">
    <!-- Sidebar (desktop) -->
    <aside class="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 fixed h-full z-30">
      <!-- Brand + Net Worth -->
      <div class="px-5 py-5 border-b border-slate-100">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><line x1="6" y1="15" x2="9" y2="15"/><line x1="12" y1="15" x2="16" y2="15"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-slate-900 leading-tight text-sm">我的帳本</p>
            <p class="text-xs text-slate-400">私人財務記錄</p>
          </div>
        </div>
        <div class="px-3 py-2.5 bg-slate-50 rounded-xl">
          <p class="text-xs text-slate-400 mb-0.5">總資產淨值</p>
          <p class="text-lg font-bold tabular-nums" :class="store.totalBalance >= 0 ? 'text-slate-900' : 'text-red-500'">
            {{ formatCurrency(store.totalBalance) }}
          </p>
        </div>
      </div>

      <!-- Ledger list -->
      <div class="px-3 py-3 border-b border-slate-100">
        <div class="flex items-center justify-between px-2 mb-2">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">帳本</span>
          <button
            @click="openLedgerModal(null)"
            class="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="新增帳本"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <!-- All ledgers option -->
        <button
          @click="store.activeLedgerId = 'all'"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer mb-0.5"
          :class="store.activeLedgerId === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
        >
          <div class="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
            <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </div>
          <span class="text-sm font-medium flex-1">所有帳本</span>
          <span class="text-xs tabular-nums" :class="store.totalBalance >= 0 ? 'text-slate-500' : 'text-red-500'">
            {{ formatCurrencyShort(store.totalBalance) }}
          </span>
        </button>

        <!-- Individual ledgers -->
        <button
          v-for="l in store.ledgersWithBalance"
          :key="l.id"
          @click="store.activeLedgerId = l.id"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer mb-0.5 group"
          :class="store.activeLedgerId === l.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
        >
          <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" :style="{ backgroundColor: l.color + '20' }">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :style="{ color: l.color }">
              <path :d="getLedgerIconSvg(l.iconKey)" />
            </svg>
          </div>
          <span class="text-sm font-medium flex-1 truncate">{{ l.name }}</span>
          <span class="text-xs tabular-nums" :class="l.balance >= 0 ? 'text-slate-400' : 'text-red-400'">
            {{ formatCurrencyShort(l.balance) }}
          </span>
          <button
            @click.stop="openLedgerModal(l)"
            class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-slate-600 transition-all cursor-pointer ml-0.5"
            title="編輯"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-3 space-y-0.5">
        <button
          v-for="item in navItems"
          :key="item.key"
          @click="currentView = item.key"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer"
          :class="currentView === item.key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span class="text-sm">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Export / Import -->
      <div class="px-3 py-3 border-t border-slate-100 space-y-1">
        <button
          @click="startExport"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-150 cursor-pointer"
        >
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span class="text-sm">匯出備份</span>
        </button>
        <button
          @click="triggerImport"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-150 cursor-pointer"
        >
          
          <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span class="text-sm">匯入備份</span>
        </button>
        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 md:ml-64 pb-20 md:pb-0">
      <component :is="views[currentView]" @open-edit="openEditTx" @open-edit-transfer="openEditTransfer" @open-ledger="openLedgerModal(null)" />
    </main>

    <!-- Bottom nav (mobile) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex z-30">
      <button
        v-for="item in navItems"
        :key="item.key"
        @click="currentView = item.key"
        class="flex-1 flex flex-col items-center py-3 gap-1 transition-colors cursor-pointer"
        :class="currentView === item.key ? 'text-blue-600' : 'text-slate-400'"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-xs font-medium">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Speed-dial FAB -->
    <div class="fixed bottom-24 right-5 md:bottom-8 md:right-8 flex flex-col-reverse items-end gap-3 z-20">
      <!-- Sub actions (shown when fab open) -->
      <Transition name="fab-actions">
        <div v-if="fabOpen" class="flex flex-col-reverse items-end gap-2">
          <button
            @click="openAddTx"
            class="flex items-center gap-3 cursor-pointer group"
          >
            <span class="bg-white text-slate-700 text-sm font-medium px-3 py-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">新增交易</span>
            <div class="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-150 hover:scale-105">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          </button>
          <button
            @click="openTransfer"
            class="flex items-center gap-3 cursor-pointer group"
          >
            <span class="bg-white text-slate-700 text-sm font-medium px-3 py-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">帳本轉帳</span>
            <div class="w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-150 hover:scale-105">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </div>
          </button>
        </div>
      </Transition>

      <!-- Main FAB -->
      <button
        @click="fabOpen = !fabOpen"
        aria-label="動作選單"
        class="w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
        :class="fabOpen ? 'bg-slate-700 shadow-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'"
      >
        <svg class="w-6 h-6 transition-transform duration-200" :class="fabOpen ? 'rotate-45' : ''"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- Backdrop (close fab) -->
    <div v-if="fabOpen" class="fixed inset-0 z-10" @click="fabOpen = false" />

    <!-- Modals -->
    <TransactionModal  v-if="showTxModal"       :transaction="editingTx"       @close="closeTxModal" />
    <TransferModal     v-if="showTransferModal"  :transfer="editingTransfer"    :default-from="store.activeLedgerId !== 'all' ? store.activeLedgerId : null"  @close="showTransferModal = false; editingTransfer = null" />
    <LedgerModal       v-if="showLedgerModal"    :ledger="editingLedger"        @close="showLedgerModal = false; editingLedger = null" />
    <CryptoModal       v-if="cryptoModal.show"   ref="cryptoModalRef"  :mode="cryptoModal.mode"  @confirm="onCryptoConfirm"  @cancel="cryptoModal.show = false" />

    <!-- Import result toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast.show"
          class="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2.5 pointer-events-none"
          :class="toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'"
        >
          <svg v-if="toast.ok" class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { useLedgerStore, LEDGER_ICONS } from './stores/ledger.js'
import TransactionModal from './components/TransactionModal.vue'
import TransferModal    from './components/TransferModal.vue'
import LedgerModal      from './components/LedgerModal.vue'
import CryptoModal      from './components/CryptoModal.vue'
import { encryptData, decryptData, isEncrypted } from './utils/crypto.js'
import Dashboard    from './views/Dashboard.vue'
import Transactions from './views/Transactions.vue'

const store = useLedgerStore()
const currentView = ref('dashboard')
const fabOpen = ref(false)
const fileInput = ref(null)
const toast = ref({ show: false, ok: true, message: '' })

function showToast(ok, message) {
  toast.value = { show: true, ok, message }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// Crypto modal state
const cryptoModal    = ref({ show: false, mode: 'export' })
const cryptoModalRef = ref(null)
let   pendingImportText = ''

function startExport() {
  cryptoModal.value = { show: true, mode: 'export' }
}

function triggerImport() {
  fileInput.value?.click()
}

function handleImport(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const text = ev.target.result
    if (isEncrypted(text)) {
      pendingImportText = text
      cryptoModal.value = { show: true, mode: 'import' }
    } else {
      const result = store.importData(text)
      if (result.ok) showToast(true, `匯入成功！共 ${store.transactions.length} 筆交易`)
      else showToast(false, result.error)
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

async function onCryptoConfirm({ passphrase, pepper }) {
  if (cryptoModal.value.mode === 'export') {
    try {
      const payload = JSON.stringify({
        version: 2,
        exportedAt: new Date().toISOString(),
        ledgers: store.ledgers,
        transactions: store.transactions,
        transfers: store.transfers,
      })
      const encrypted = await encryptData(payload, passphrase, pepper)
      const blob = new Blob([encrypted], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `帳本備份_${new Date().toISOString().slice(0, 10)}_加密.json`
      a.click()
      URL.revokeObjectURL(url)
      cryptoModal.value.show = false
      showToast(true, '加密備份匯出成功')
    } catch {
      cryptoModalRef.value?.setError('加密失敗，請再試一次')
    }
  } else {
    try {
      const plain  = await decryptData(pendingImportText, passphrase, pepper)
      const result = store.importData(plain)
      if (result.ok) {
        cryptoModal.value.show = false
        showToast(true, `匯入成功！共 ${store.transactions.length} 筆交易`)
      } else {
        cryptoModalRef.value?.setError(result.error)
      }
    } catch {
      cryptoModalRef.value?.setError('解密失敗，請確認密碼與調味料是否正確')
    }
  }
}

// Modal states
const showTxModal      = ref(false)
const editingTx        = ref(null)
const showTransferModal = ref(false)
const editingTransfer  = ref(null)
const showLedgerModal  = ref(false)
const editingLedger    = ref(null)

const views = { dashboard: Dashboard, transactions: Transactions }

// ── Icon components ──────────────────────────────────────────────────────────
const IconGrid = { render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }, [
  h('rect', { x:'3', y:'3', width:'7', height:'7' }), h('rect', { x:'14', y:'3', width:'7', height:'7' }),
  h('rect', { x:'3', y:'14', width:'7', height:'7' }), h('rect', { x:'14', y:'14', width:'7', height:'7' }),
])}
const IconList = { render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }, [
  h('line', { x1:'8', y1:'6', x2:'21', y2:'6' }), h('line', { x1:'8', y1:'12', x2:'21', y2:'12' }),
  h('line', { x1:'8', y1:'18', x2:'21', y2:'18' }), h('line', { x1:'3', y1:'6', x2:'3.01', y2:'6' }),
  h('line', { x1:'3', y1:'12', x2:'3.01', y2:'12' }), h('line', { x1:'3', y1:'18', x2:'3.01', y2:'18' }),
])}

const navItems = [
  { key: 'dashboard',    label: '總覽',   icon: IconGrid },
  { key: 'transactions', label: '交易記錄', icon: IconList },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLedgerIconSvg(iconKey) {
  return (LEDGER_ICONS.find(i => i.key === iconKey) || LEDGER_ICONS[0]).svg
}

function formatCurrency(v) {
  return (v < 0 ? '-' : '') + 'NT$ ' + Math.abs(v).toLocaleString('zh-TW')
}
function formatCurrencyShort(v) {
  const abs = Math.abs(v)
  const s = abs >= 10000 ? (abs / 10000).toFixed(1).replace('.0', '') + 'w' : abs.toLocaleString('zh-TW')
  return (v < 0 ? '-' : '') + s
}

// ── Modal openers ─────────────────────────────────────────────────────────────

function openAddTx() {
  fabOpen.value = false
  editingTx.value = null
  showTxModal.value = true
}
function openEditTx(tx) {
  editingTx.value = tx
  showTxModal.value = true
}
function closeTxModal() {
  showTxModal.value = false
  editingTx.value = null
}
function openTransfer() {
  fabOpen.value = false
  editingTransfer.value = null
  showTransferModal.value = true
}
function openEditTransfer(transfer) {
  editingTransfer.value = transfer
  showTransferModal.value = true
}
function openLedgerModal(ledger) {
  editingLedger.value = ledger
  showLedgerModal.value = true
}

onMounted(() => {
  store.load()
})
</script>

<style scoped>
.fab-actions-enter-active { transition: all 0.2s ease-out; }
.fab-actions-leave-active { transition: all 0.15s ease-in; }
.fab-actions-enter-from, .fab-actions-leave-to { opacity: 0; transform: translateY(8px); }

.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px); }
</style>
