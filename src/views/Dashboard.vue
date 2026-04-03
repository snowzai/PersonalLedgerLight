<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <!-- Header + Month selector -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">
          {{ store.activeLedgerId === 'all' ? '總覽' : (activeLedger?.name || '總覽') }}
        </h1>
        <p class="text-sm text-slate-400 mt-0.5">{{ displayMonth }}</p>
      </div>
      <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
        <button @click="store.prevMonth()" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="text-sm font-semibold text-slate-700 w-20 text-center tabular-nums">{{ store.currentMonth.replace('-', '年').replace(/(\d{2})$/, '$1月') }}</span>
        <button @click="store.nextMonth()" :disabled="store.isCurrentMonth()" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- Ledger balance cards (only when viewing all) -->
    <div v-if="store.activeLedgerId === 'all'" class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wide">各帳本餘額</h2>
        <button
          @click="$emit('open-ledger')"
          class="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
        >+ 新增帳本</button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="l in store.ledgersWithBalance"
          :key="l.id"
          @click="store.activeLedgerId = l.id"
          class="card p-4 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div class="flex items-center gap-2.5 mb-3">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" :style="{ backgroundColor: l.color + '20' }">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :style="{ color: l.color }">
                <path :d="getLedgerIconSvg(l.iconKey)" />
              </svg>
            </div>
            <span class="text-sm font-medium text-slate-600 truncate">{{ l.name }}</span>
          </div>
          <p class="text-lg font-bold tabular-nums" :class="l.balance >= 0 ? 'text-slate-900' : 'text-red-500'">
            {{ formatCurrency(l.balance) }}
          </p>
          <div class="mt-1.5 h-1 rounded-full overflow-hidden bg-slate-100">
            <div class="h-full rounded-full transition-all" :style="{ backgroundColor: l.color, width: balanceWidth(l.balance) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-3 gap-3 md:gap-4 mb-6">
      <div class="card p-4 md:p-5">
        <p class="text-xs font-medium text-slate-400 mb-1.5">本月收入</p>
        <p class="text-xl md:text-2xl font-bold text-emerald-600 tabular-nums truncate">{{ formatCurrency(store.monthIncome) }}</p>
        <p class="text-xs text-slate-400 mt-1">{{ monthIncomeCount }} 筆</p>
      </div>
      <div class="card p-4 md:p-5">
        <p class="text-xs font-medium text-slate-400 mb-1.5">本月支出</p>
        <p class="text-xl md:text-2xl font-bold text-red-500 tabular-nums truncate">{{ formatCurrency(store.monthExpense) }}</p>
        <p class="text-xs text-slate-400 mt-1">{{ monthExpenseCount }} 筆</p>
      </div>
      <div class="card p-4 md:p-5">
        <p class="text-xs font-medium text-slate-400 mb-1.5">本月結餘</p>
        <p class="text-xl md:text-2xl font-bold tabular-nums truncate" :class="store.monthBalance >= 0 ? 'text-blue-600' : 'text-red-500'">
          {{ formatCurrency(store.monthBalance) }}
        </p>
        <p class="text-xs mt-1" :class="store.monthBalance >= 0 ? 'text-emerald-500' : 'text-red-400'">
          {{ store.monthBalance >= 0 ? '收支平衡' : '超支' }}
        </p>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
      <div class="card p-5 lg:col-span-3">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">近 6 個月收支</h2>
        <apexchart type="bar" height="220" :options="barOptions" :series="barSeries" />
      </div>
      <div class="card p-5 lg:col-span-2">
        <h2 class="text-sm font-semibold text-slate-700 mb-4">本月支出分類</h2>
        <div v-if="store.expenseByCategory.length > 0">
          <apexchart type="donut" height="200" :options="donutOptions" :series="donutSeries" />
        </div>
        <div v-else class="h-48 flex flex-col items-center justify-center text-slate-300">
          <svg class="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p class="text-sm">本月尚無支出</p>
        </div>
      </div>
    </div>

    <!-- Recent items -->
    <div class="card p-5">
      <h2 class="text-sm font-semibold text-slate-700 mb-4">最近記錄</h2>

      <div v-if="store.recentItems.length === 0" class="py-8 text-center text-slate-300">
        <svg class="w-10 h-10 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
        </svg>
        <p class="text-sm">尚無記錄</p>
      </div>

      <div v-else class="space-y-1">
        <!-- Transfer row -->
        <template v-for="item in store.recentItems" :key="item.id">
          <div
            v-if="item._kind === 'transfer'"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            @click="$emit('open-edit-transfer', item)"
          >
            <div class="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-medium text-slate-800">{{ getLedgerName(item.fromLedgerId) }}</span>
                <svg class="w-3 h-3 text-slate-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                <span class="text-sm font-medium text-slate-800">{{ getLedgerName(item.toLedgerId) }}</span>
              </div>
              <p class="text-xs text-slate-400">{{ formatDate(item.date) }} · 轉帳{{ item.description ? ' · ' + item.description : '' }}</p>
            </div>
            <p class="text-sm font-semibold text-purple-600 tabular-nums flex-shrink-0">NT$ {{ item.amount.toLocaleString('zh-TW') }}</p>
          </div>

          <!-- Transaction row -->
          <div
            v-else
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            @click="$emit('open-edit', item)"
          >
            <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                 :class="item.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'">
              {{ categoryIcon(item.category) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">{{ item.description || item.category }}</p>
              <p class="text-xs text-slate-400">{{ formatDate(item.date) }} · {{ item.category }}
                <span v-if="store.activeLedgerId === 'all'" class="ml-1 px-1.5 py-0.5 rounded text-xs font-medium" :style="{ backgroundColor: getLedger(item.ledgerId)?.color + '20', color: getLedger(item.ledgerId)?.color }">
                  {{ getLedger(item.ledgerId)?.name }}
                </span>
              </p>
            </div>
            <p class="text-sm font-semibold tabular-nums flex-shrink-0"
               :class="item.type === 'income' ? 'text-emerald-600' : 'text-red-500'">
              {{ item.type === 'income' ? '+' : '-' }}NT$ {{ item.amount.toLocaleString('zh-TW') }}
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useLedgerStore, CATEGORY_ICONS, LEDGER_ICONS } from '../stores/ledger.js'

defineEmits(['open-add', 'open-edit', 'open-edit-transfer', 'open-ledger'])

const store = useLedgerStore()

const activeLedger = computed(() => store.ledgers.find(l => l.id === store.activeLedgerId))
const displayMonth = computed(() => dayjs(store.currentMonth + '-01').format('YYYY年M月'))

const monthIncomeCount  = computed(() => store.monthTransactions.filter(t => t.type === 'income').length)
const monthExpenseCount = computed(() => store.monthTransactions.filter(t => t.type === 'expense').length)

function formatCurrency(v) { return (v < 0 ? '-' : '') + 'NT$ ' + Math.abs(v).toLocaleString('zh-TW') }
function formatDate(d) { return dayjs(d).format('M/D') }
function categoryIcon(cat) { return CATEGORY_ICONS[cat] || '💰' }
function getLedgerName(id) { return store.ledgers.find(l => l.id === id)?.name || '?' }
function getLedger(id) { return store.ledgers.find(l => l.id === id) }
function getLedgerIconSvg(key) { return (LEDGER_ICONS.find(i => i.key === key) || LEDGER_ICONS[0]).svg }

function balanceWidth(balance) {
  const max = Math.max(...store.ledgersWithBalance.map(l => Math.abs(l.balance)), 1)
  return Math.min(100, Math.round((Math.abs(balance) / max) * 100))
}

// Bar chart
const barSeries = computed(() => [
  { name: '收入', data: store.last6MonthsData.map(d => d.income) },
  { name: '支出', data: store.last6MonthsData.map(d => d.expense) },
])
const barOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif', background: 'transparent' },
  plotOptions: { bar: { columnWidth: '55%', borderRadius: 6, borderRadiusApplication: 'end' } },
  colors: ['#10B981', '#F87171'],
  xaxis: {
    categories: store.last6MonthsData.map(d => d.month),
    axisBorder: { show: false }, axisTicks: { show: false },
    labels: { style: { colors: '#94A3B8', fontSize: '12px' } },
  },
  yaxis: { labels: { style: { colors: '#94A3B8', fontSize: '11px' }, formatter: v => v >= 10000 ? (v / 10000).toFixed(0) + 'w' : v.toLocaleString() } },
  grid: { borderColor: '#F1F5F9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
  legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', markers: { size: 6 } },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: v => 'NT$ ' + v.toLocaleString('zh-TW') }, style: { fontFamily: 'Inter, sans-serif' } },
}))

// Donut chart
const donutSeries = computed(() => store.expenseByCategory.map(([, v]) => v))
const donutOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'Inter, sans-serif', background: 'transparent' },
  labels: store.expenseByCategory.map(([k]) => k),
  colors: ['#3B82F6', '#F87171', '#FBBF24', '#34D399', '#A78BFA', '#FB923C', '#60A5FA', '#F472B6'],
  legend: { position: 'bottom', fontSize: '11px', markers: { size: 5 } },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: {
    show: true, label: '總支出',
    formatter: () => 'NT$ ' + store.monthExpense.toLocaleString('zh-TW'),
    color: '#64748B', fontSize: '11px', fontWeight: 600,
  }}}}},
  tooltip: { y: { formatter: v => 'NT$ ' + v.toLocaleString('zh-TW') }, style: { fontFamily: 'Inter, sans-serif' } },
  stroke: { width: 2 },
}))
</script>
