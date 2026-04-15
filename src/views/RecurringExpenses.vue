<template>
  <div class="p-4 md:p-8 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">固定支出</h1>
        <p class="text-sm text-slate-400 mt-0.5">每月定期扣款項目</p>
      </div>
      <button
        @click="openAdd"
        class="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增
      </button>
    </div>

    <!-- Summary -->
    <div v-if="store.recurringExpenses.length > 0" class="card p-4 mb-5 flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-slate-400 mb-0.5">每月固定支出合計</p>
        <p class="text-xl font-bold text-orange-500 tabular-nums">
          NT$ {{ totalMonthly.toLocaleString('zh-TW') }}
        </p>
      </div>
      <div class="text-right">
        <p class="text-xs font-medium text-slate-400 mb-0.5">啟用項目</p>
        <p class="text-xl font-bold text-slate-700 dark:text-slate-200">{{ activeCount }} <span class="text-sm font-normal text-slate-400">/ {{ store.recurringExpenses.length }} 筆</span></p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="store.recurringExpenses.length === 0" class="card py-16 text-center">
      <div class="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-orange-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
        </svg>
      </div>
      <p class="text-slate-500 text-sm font-medium mb-1">尚無固定支出項目</p>
      <p class="text-slate-400 text-xs mb-5">新增後可在每月開始時一鍵套用</p>
      <button
        @click="openAdd"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增第一筆
      </button>
    </div>

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="rec in store.recurringExpenses"
        :key="rec.id"
        class="card px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
        @click="openEdit(rec)"
      >
        <!-- Icon -->
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
             :class="rec.isActive ? 'bg-orange-50' : 'bg-slate-100'">
          {{ CATEGORY_ICONS[rec.category] || '💸' }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{{ rec.name }}</p>
            <span v-if="!rec.isActive" class="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-400 rounded-md font-medium">暫停</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ rec.category }} · 每月 {{ rec.dayOfMonth }} 號
            <span v-if="rec.note"> · {{ rec.note }}</span>
          </p>
        </div>

        <!-- Ledger badge -->
        <div v-if="getLedger(rec.ledgerId)" class="flex-shrink-0">
          <span
            class="text-xs px-2 py-1 rounded-lg font-medium"
            :style="{ backgroundColor: getLedger(rec.ledgerId).color + '20', color: getLedger(rec.ledgerId).color }"
          >
            {{ getLedger(rec.ledgerId).name }}
          </span>
        </div>

        <!-- Amount -->
        <p class="text-sm font-bold text-orange-500 tabular-nums flex-shrink-0">
          NT$ {{ rec.amount.toLocaleString('zh-TW') }}
        </p>

        <!-- Toggle active -->
        <button
          @click.stop="store.updateRecurring(rec.id, { isActive: !rec.isActive })"
          class="w-8 h-8 flex items-center justify-center rounded-xl transition-colors cursor-pointer flex-shrink-0"
          :class="rec.isActive ? 'text-orange-400 hover:bg-orange-50' : 'text-slate-300 hover:bg-slate-100'"
          :title="rec.isActive ? '點擊暫停' : '點擊啟用'"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path v-if="rec.isActive" d="M10 8h1.5v8H10zm2.5 0H14v8h-1.5z" fill="white"/>
            <path v-else d="M10 7.5l7 4.5-7 4.5V7.5z" fill="white"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Modal -->
    <RecurringModal
      v-if="showModal"
      :recurring="editingRec"
      @close="showModal = false; editingRec = null"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLedgerStore, CATEGORY_ICONS } from '../stores/ledger.js'
import RecurringModal from '../components/RecurringModal.vue'

const store = useLedgerStore()

const showModal = ref(false)
const editingRec = ref(null)

const totalMonthly = computed(() =>
  store.recurringExpenses.filter(r => r.isActive).reduce((s, r) => s + r.amount, 0)
)
const activeCount = computed(() =>
  store.recurringExpenses.filter(r => r.isActive).length
)

function getLedger(id) { return store.ledgers.find(l => l.id === id) }

function openAdd() {
  editingRec.value = null
  showModal.value = true
}
function openEdit(rec) {
  editingRec.value = rec
  showModal.value = true
}
</script>
