<template>
  <div class="p-4 md:p-8 max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">交易記錄</h1>
      <p class="text-sm text-slate-400 mt-0.5">
        {{ store.activeLedgerId === 'all' ? '所有帳本' : (activeLedger?.name || '') }}
      </p>
    </div>

    <!-- Filters -->
    <div class="card p-4 mb-4 space-y-3">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input v-model="search" type="text" placeholder="搜尋描述或分類..." class="input-field pl-10 py-2.5" />
      </div>
      <div class="flex gap-2 flex-wrap">
        <!-- Type filter -->
        <div class="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            v-for="t in typeOptions"
            :key="t.value"
            @click="filterType = t.value"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer"
            :class="filterType === t.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >{{ t.label }}</button>
        </div>
        <!-- Month filter -->
        <select v-model="filterMonth" class="bg-slate-100 border-0 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
          <option value="">全部月份</option>
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <!-- Ledger filter (only when "all") -->
        <select v-if="store.activeLedgerId === 'all'" v-model="filterLedger" class="bg-slate-100 border-0 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
          <option value="">所有帳本</option>
          <option v-for="l in store.ledgers" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
        <button v-if="hasFilters" @click="clearFilters" class="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors cursor-pointer">清除篩選</button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="flex gap-3 mb-4 text-xs flex-wrap">
      <span class="text-slate-400">共 {{ totalCount }} 筆</span>
      <span class="text-emerald-600 font-medium">收入 NT$ {{ filteredIncome.toLocaleString('zh-TW') }}</span>
      <span class="text-red-500 font-medium">支出 NT$ {{ filteredExpense.toLocaleString('zh-TW') }}</span>
      <span v-if="filteredTransfers.length" class="text-purple-600 font-medium">轉帳 {{ filteredTransfers.length }} 筆</span>
    </div>

    <!-- Empty -->
    <div v-if="allItems.length === 0" class="card py-16 text-center">
      <svg class="w-12 h-12 mx-auto mb-3 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
      </svg>
      <p class="text-slate-400 text-sm font-medium">找不到符合的記錄</p>
    </div>

    <!-- Groups -->
    <div v-else class="space-y-4">
      <div v-for="group in groupedItems" :key="group.date">
        <!-- Date header -->
        <div class="flex items-center justify-between px-1 mb-2">
          <span class="text-xs font-semibold text-slate-500">{{ formatGroupDate(group.date) }}</span>
          <span class="text-xs text-slate-400 tabular-nums">
            <span v-if="group.income"  class="text-emerald-600 mr-2">+NT$ {{ group.income.toLocaleString('zh-TW') }}</span>
            <span v-if="group.expense" class="text-red-500">-NT$ {{ group.expense.toLocaleString('zh-TW') }}</span>
          </span>
        </div>

        <div class="card overflow-hidden divide-y divide-slate-50">
          <template v-for="item in group.items" :key="item.id">

            <!-- Transfer row -->
            <div
              v-if="item._kind === 'transfer'"
              class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group"
              @click="$emit('open-edit-transfer', item)"
            >
              <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-sm font-medium text-slate-800">{{ getLedgerName(item.fromLedgerId) }}</span>
                  <svg class="w-3 h-3 text-slate-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span class="text-sm font-medium text-slate-800">{{ getLedgerName(item.toLedgerId) }}</span>
                  <span class="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">轉帳</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">{{ item.description || '帳本轉帳' }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <p class="text-sm font-semibold text-purple-600 tabular-nums">NT$ {{ item.amount.toLocaleString('zh-TW') }}</p>
                <button @click.stop="deletingItem = item; deletingKind = 'transfer'"
                  class="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>

            <!-- Transaction row -->
            <div
              v-else
              class="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer group"
              @click="$emit('open-edit', item)"
            >
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                   :class="item.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'">{{ categoryIcon(item.category) }}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{{ item.description || item.category }}</p>
                <p class="text-xs text-slate-400 mt-0.5">
                  {{ item.category }}
                  <span v-if="item.note"> · {{ item.note }}</span>
                  <span v-if="store.activeLedgerId === 'all'" class="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium" :style="{ backgroundColor: getLedger(item.ledgerId)?.color + '20', color: getLedger(item.ledgerId)?.color }">
                    {{ getLedger(item.ledgerId)?.name }}
                  </span>
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <p class="text-sm font-semibold tabular-nums" :class="item.type === 'income' ? 'text-emerald-600' : 'text-red-500'">
                  {{ item.type === 'income' ? '+' : '-' }}NT$ {{ item.amount.toLocaleString('zh-TW') }}
                </p>
                <button @click.stop="deletingItem = item; deletingKind = 'tx'"
                  class="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>

          </template>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <Teleport to="body">
      <div v-if="deletingItem" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4" @click.self="deletingItem = null">
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
          <h3 class="text-base font-semibold text-slate-900 mb-1">確認刪除</h3>
          <p class="text-sm text-slate-500 mb-5">
            此動作無法復原，確認要刪除這筆記錄嗎？
          </p>
          <div class="flex gap-3">
            <button @click="deletingItem = null" class="flex-1 btn-ghost text-sm">取消</button>
            <button @click="doDelete" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors cursor-pointer text-sm">刪除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useLedgerStore, CATEGORY_ICONS } from '../stores/ledger.js'

defineEmits(['open-add', 'open-edit', 'open-edit-transfer'])

const store = useLedgerStore()
const search = ref('')
const filterType   = ref('all')
const filterMonth  = ref('')
const filterLedger = ref('')
const deletingItem = ref(null)
const deletingKind = ref('tx')

const typeOptions = [
  { label: '全部',   value: 'all' },
  { label: '收入',   value: 'income' },
  { label: '支出',   value: 'expense' },
  { label: '轉帳',   value: 'transfer' },
]

const activeLedger = computed(() => store.ledgers.find(l => l.id === store.activeLedgerId))

const availableMonths = computed(() => {
  const all = [...store.transactions.map(t => t.date.slice(0, 7)), ...store.transfers.map(t => t.date.slice(0, 7))]
  const months = [...new Set(all)].sort((a, b) => b.localeCompare(a))
  return months.map(m => ({ value: m, label: dayjs(m + '-01').format('YYYY年M月') }))
})

const hasFilters = computed(() => search.value || filterType.value !== 'all' || filterMonth.value || filterLedger.value)
function clearFilters() { search.value = ''; filterType.value = 'all'; filterMonth.value = ''; filterLedger.value = '' }

// Filtered transactions
const filteredTxs = computed(() => {
  if (filterType.value === 'transfer') return []
  let txs = [...store.activeTransactions].sort((a, b) => b.date.localeCompare(a.date))
  if (filterType.value !== 'all')  txs = txs.filter(t => t.type === filterType.value)
  if (filterMonth.value)            txs = txs.filter(t => t.date.startsWith(filterMonth.value))
  if (filterLedger.value)           txs = txs.filter(t => t.ledgerId === filterLedger.value)
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    txs = txs.filter(t => t.description?.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.note?.toLowerCase().includes(q))
  }
  return txs.map(t => ({ ...t, _kind: 'tx' }))
})

// Filtered transfers
const filteredTransfers = computed(() => {
  if (filterType.value === 'income' || filterType.value === 'expense') return []
  let trs = [...store.activeTransfers].sort((a, b) => b.date.localeCompare(a.date))
  if (filterMonth.value)  trs = trs.filter(t => t.date.startsWith(filterMonth.value))
  if (filterLedger.value) trs = trs.filter(t => t.fromLedgerId === filterLedger.value || t.toLedgerId === filterLedger.value)
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    trs = trs.filter(t => t.description?.toLowerCase().includes(q) || getLedgerName(t.fromLedgerId).toLowerCase().includes(q) || getLedgerName(t.toLedgerId).toLowerCase().includes(q))
  }
  return trs.map(t => ({ ...t, _kind: 'transfer' }))
})

const allItems = computed(() => [...filteredTxs.value, ...filteredTransfers.value].sort((a, b) => b.date.localeCompare(a.date)))
const totalCount   = computed(() => allItems.value.length)
const filteredIncome  = computed(() => filteredTxs.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const filteredExpense = computed(() => filteredTxs.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))

const groupedItems = computed(() => {
  const groups = {}
  allItems.value.forEach(item => {
    if (!groups[item.date]) groups[item.date] = { date: item.date, items: [], income: 0, expense: 0 }
    groups[item.date].items.push(item)
    if (item._kind === 'tx') {
      if (item.type === 'income')  groups[item.date].income  += item.amount
      else                          groups[item.date].expense += item.amount
    }
  })
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
})

function formatGroupDate(d) {
  const day = dayjs(d), today = dayjs()
  if (day.isSame(today, 'day'))                    return '今天 · ' + day.format('M月D日')
  if (day.isSame(today.subtract(1, 'day'), 'day')) return '昨天 · ' + day.format('M月D日')
  return day.format('YYYY年M月D日 dddd')
}
function categoryIcon(cat) { return CATEGORY_ICONS[cat] || '💰' }
function getLedgerName(id) { return store.ledgers.find(l => l.id === id)?.name || '?' }
function getLedger(id) { return store.ledgers.find(l => l.id === id) }

function doDelete() {
  if (deletingKind.value === 'transfer') store.deleteTransfer(deletingItem.value.id)
  else store.deleteTransaction(deletingItem.value.id)
  deletingItem.value = null
}
</script>
