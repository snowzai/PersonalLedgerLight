import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

dayjs.locale('zh-tw')

// ─── Constants ───────────────────────────────────────────────────────────────

export const INCOME_CATEGORIES = ['薪資', '投資收益', '副業', '獎金', '租金', '其他收入']
export const EXPENSE_CATEGORIES = ['餐飲', '交通', '娛樂', '購物', '住房', '醫療', '教育', '訂閱', '水電費', '其他支出']

export const CATEGORY_ICONS = {
  薪資: '💼', 投資收益: '📈', 副業: '🔧', 獎金: '🎁', 租金: '🏠', 其他收入: '💰',
  餐飲: '🍜', 交通: '🚗', 娛樂: '🎬', 購物: '🛍️', 住房: '🏡',
  醫療: '💊', 教育: '📚', 訂閱: '📱', 水電費: '💡', 其他支出: '💸',
}

export const LEDGER_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#EC4899', '#64748B',
]

export const LEDGER_ICONS = [
  { key: 'wallet',  label: '錢包',   svg: 'M21 12V7H5a2 2 0 010-4h14v4M21 12v5H5a2 2 0 000 4h16v-9z' },
  { key: 'bank',    label: '銀行',   svg: 'M3 10h18M3 14h18M3 6h18M7 18V6M12 18V6M17 18V6' },
  { key: 'card',    label: '信用卡', svg: 'M2 7h20v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm0 4h20' },
  { key: 'piggy',   label: '存款',   svg: 'M19 9a4 4 0 00-4-4H7a4 4 0 00-4 4v1a2 2 0 002 2v4a2 2 0 002 2h8a2 2 0 002-2v-4a2 2 0 002-2V9zM8 14h.01M16 10h.01' },
  { key: 'trend',   label: '投資',   svg: 'M23 6L13.5 15.5 8.5 10.5 1 18M17 6h6v6' },
  { key: 'coins',   label: '現金',   svg: 'M12 2a7 7 0 100 14A7 7 0 0012 2zM2 12a10 10 0 1020 0A10 10 0 002 12z' },
]

// ─── Sample data ─────────────────────────────────────────────────────────────

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLedgerStore = defineStore('ledger', () => {
  const ledgers     = ref([])
  const transactions = ref([])
  const transfers   = ref([])
  const currentMonth   = ref(dayjs().format('YYYY-MM'))
  const activeLedgerId = ref('all') // 'all' or ledger.id

  // ── Persistence ────────────────────────────────────────────────────────────

  function save() {
    localStorage.setItem('ledger_v2', JSON.stringify({ ledgers: ledgers.value, transactions: transactions.value, transfers: transfers.value }))
  }

  function load() {
    const raw = localStorage.getItem('ledger_v2')
    if (raw) {
      const data = JSON.parse(raw)
      ledgers.value      = data.ledgers      || []
      transactions.value = data.transactions || []
      transfers.value    = data.transfers    || []
      // Migrate: assign default ledger if missing
      if (ledgers.value.length > 0) {
        const defaultId = ledgers.value[0].id
        transactions.value.forEach(t => { if (!t.ledgerId) t.ledgerId = defaultId })
      }
    } else {
      // First run — create default ledgers, no sample data
      ledgers.value = [
        { id: 'l_cash', name: '現金',    color: '#10B981', iconKey: 'coins' },
        { id: 'l_bank', name: '銀行帳戶', color: '#3B82F6', iconKey: 'bank' },
        { id: 'l_card', name: '信用卡',   color: '#EF4444', iconKey: 'card' },
      ]
      transactions.value = []
      transfers.value    = []
      save()
    }
  }

  // ── Ledger balance helpers ─────────────────────────────────────────────────

  function getLedgerBalance(ledgerId) {
    const txBal = transactions.value
      .filter(t => t.ledgerId === ledgerId)
      .reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0)
    const inflow  = transfers.value.filter(t => t.toLedgerId   === ledgerId).reduce((s, t) => s + t.amount, 0)
    const outflow = transfers.value.filter(t => t.fromLedgerId === ledgerId).reduce((s, t) => s + t.amount, 0)
    return txBal + inflow - outflow
  }

  const ledgersWithBalance = computed(() =>
    ledgers.value.map(l => ({ ...l, balance: getLedgerBalance(l.id) }))
  )

  const totalBalance = computed(() =>
    ledgers.value.reduce((s, l) => s + getLedgerBalance(l.id), 0)
  )

  // ── Filtered transactions (respects activeLedgerId) ────────────────────────

  const activeTransactions = computed(() =>
    activeLedgerId.value === 'all'
      ? transactions.value
      : transactions.value.filter(t => t.ledgerId === activeLedgerId.value)
  )

  const activeTransfers = computed(() =>
    activeLedgerId.value === 'all'
      ? transfers.value
      : transfers.value.filter(t => t.fromLedgerId === activeLedgerId.value || t.toLedgerId === activeLedgerId.value)
  )

  // ── Month-level aggregates (for Dashboard) ─────────────────────────────────

  const monthTransactions = computed(() =>
    activeTransactions.value.filter(t => t.date.startsWith(currentMonth.value))
  )

  const monthIncome = computed(() =>
    monthTransactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  )
  const monthExpense = computed(() =>
    monthTransactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  )
  const monthBalance = computed(() => monthIncome.value - monthExpense.value)

  // ── Chart data ─────────────────────────────────────────────────────────────

  const last6MonthsData = computed(() => {
    const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month').format('YYYY-MM'))
    return months.map(month => {
      const txs = activeTransactions.value.filter(t => t.date.startsWith(month))
      return {
        month: dayjs(month + '-01').format('M月'),
        income:  txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  })

  const expenseByCategory = computed(() => {
    const cats = {}
    monthTransactions.value.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount
    })
    return Object.entries(cats).sort((a, b) => b[1] - a[1])
  })

  // ── Recent items (transactions + transfers merged, sorted by date) ──────────

  const recentItems = computed(() => {
    const txItems = [...activeTransactions.value].map(t => ({ ...t, _kind: 'tx' }))
    const trItems = [...activeTransfers.value].map(t => ({ ...t, _kind: 'transfer' }))
    return [...txItems, ...trItems]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
  })

  // ── Navigation helpers ─────────────────────────────────────────────────────

  function prevMonth() {
    currentMonth.value = dayjs(currentMonth.value + '-01').subtract(1, 'month').format('YYYY-MM')
  }
  function nextMonth() {
    const next = dayjs(currentMonth.value + '-01').add(1, 'month').format('YYYY-MM')
    if (next <= dayjs().format('YYYY-MM')) currentMonth.value = next
  }
  function isCurrentMonth() { return currentMonth.value === dayjs().format('YYYY-MM') }

  // ── Ledger CRUD ────────────────────────────────────────────────────────────

  function addLedger(data) {
    ledgers.value.push({ ...data, id: 'l_' + Date.now() })
    save()
  }
  function updateLedger(id, data) {
    const idx = ledgers.value.findIndex(l => l.id === id)
    if (idx !== -1) { ledgers.value[idx] = { ...ledgers.value[idx], ...data }; save() }
  }
  function deleteLedger(id) {
    // Remove ledger and its transactions/transfers
    ledgers.value      = ledgers.value.filter(l => l.id !== id)
    transactions.value = transactions.value.filter(t => t.ledgerId !== id)
    transfers.value    = transfers.value.filter(t => t.fromLedgerId !== id && t.toLedgerId !== id)
    if (activeLedgerId.value === id) activeLedgerId.value = 'all'
    save()
  }

  // ── Transaction CRUD ───────────────────────────────────────────────────────

  function addTransaction(tx) {
    transactions.value.unshift({ ...tx, id: Date.now().toString() })
    save()
  }
  function updateTransaction(id, data) {
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx !== -1) { transactions.value[idx] = { ...transactions.value[idx], ...data }; save() }
  }
  function deleteTransaction(id) {
    transactions.value = transactions.value.filter(t => t.id !== id)
    save()
  }

  // ── Transfer CRUD ──────────────────────────────────────────────────────────

  function addTransfer(data) {
    transfers.value.unshift({ ...data, id: 'tr_' + Date.now() })
    save()
  }
  function updateTransfer(id, data) {
    const idx = transfers.value.findIndex(t => t.id === id)
    if (idx !== -1) { transfers.value[idx] = { ...transfers.value[idx], ...data }; save() }
  }
  function deleteTransfer(id) {
    transfers.value = transfers.value.filter(t => t.id !== id)
    save()
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getLedger(id) { return ledgers.value.find(l => l.id === id) }

  // ── Export / Import ────────────────────────────────────────────────────────

  function exportData() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      ledgers: ledgers.value,
      transactions: transactions.value,
      transfers: transfers.value,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `帳本備份_${dayjs().format('YYYY-MM-DD')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Returns { ok: true } or { ok: false, error: string }
  function importData(jsonText) {
    try {
      const data = JSON.parse(jsonText)
      if (!Array.isArray(data.ledgers) || !Array.isArray(data.transactions)) {
        return { ok: false, error: '檔案格式不正確，缺少必要欄位。' }
      }
      ledgers.value      = data.ledgers
      transactions.value = data.transactions
      transfers.value    = data.transfers || []
      save()
      return { ok: true }
    } catch {
      return { ok: false, error: '無法解析 JSON 檔案，請確認檔案未損毀。' }
    }
  }

  return {
    ledgers, transactions, transfers,
    currentMonth, activeLedgerId,
    ledgersWithBalance, totalBalance,
    activeTransactions, activeTransfers,
    monthTransactions, monthIncome, monthExpense, monthBalance,
    last6MonthsData, expenseByCategory, recentItems,
    load, save,
    prevMonth, nextMonth, isCurrentMonth,
    addLedger, updateLedger, deleteLedger, getLedger,
    addTransaction, updateTransaction, deleteTransaction,
    addTransfer, updateTransfer, deleteTransfer,
    exportData, importData,
    LEDGER_COLORS, LEDGER_ICONS,
  }
})
