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
          <div>
            <h2 class="text-lg font-semibold text-slate-900">套用固定支出</h2>
            <p class="text-xs text-slate-400 mt-0.5">{{ displayMonth }}</p>
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

        <!-- No recurring items -->
        <div v-if="activeItems.length === 0" class="px-6 py-12 text-center">
          <p class="text-slate-500 text-sm mb-1">尚未設定任何固定支出</p>
          <p class="text-slate-400 text-xs">請先到「固定支出」頁面新增項目</p>
        </div>

        <!-- List -->
        <div v-else class="overflow-y-auto max-h-[60vh]">
          <!-- Select all -->
          <div class="flex items-center justify-between px-6 py-3 border-b border-slate-50">
            <span class="text-xs font-semibold text-slate-500">
              已選 {{ selectedIds.size }} / {{ activeItems.length }} 筆
            </span>
            <button @click="toggleAll" class="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
              {{ selectedIds.size === unappliedItems.length ? '取消全選' : '全選未套用' }}
            </button>
          </div>

          <div class="px-4 py-2 space-y-1">
            <div
              v-for="item in activeItems"
              :key="item.id"
              class="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer"
              :class="item.alreadyApplied ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'"
              @click="!item.alreadyApplied && toggleSelect(item.id)"
            >
              <!-- Checkbox -->
              <div
                class="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                :class="item.alreadyApplied
                  ? 'border-slate-200 bg-slate-100'
                  : selectedIds.has(item.id)
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-slate-300'"
              >
                <svg v-if="selectedIds.has(item.id) || item.alreadyApplied" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <!-- Icon -->
              <div class="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-base">
                {{ CATEGORY_ICONS[item.category] || '💸' }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{{ item.name }}</p>
                <p class="text-xs text-slate-400">
                  {{ item.category }} · {{ item.dayOfMonth }} 號
                  <span v-if="item.alreadyApplied" class="text-emerald-500 font-medium"> · 已套用</span>
                </p>
              </div>

              <!-- Ledger + Amount -->
              <div class="text-right flex-shrink-0">
                <p class="text-sm font-bold text-orange-500 tabular-nums">NT$ {{ item.amount.toLocaleString('zh-TW') }}</p>
                <p v-if="getLedger(item.ledgerId)" class="text-xs text-slate-400">{{ getLedger(item.ledgerId).name }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Total -->
        <div v-if="activeItems.length > 0 && selectedIds.size > 0" class="mx-6 mb-2 mt-1 px-4 py-2.5 bg-orange-50 rounded-xl flex items-center justify-between">
          <span class="text-xs font-medium text-orange-700">本次套用合計</span>
          <span class="text-sm font-bold text-orange-600 tabular-nums">NT$ {{ selectedTotal.toLocaleString('zh-TW') }}</span>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 pt-2 flex gap-3">
          <button @click="$emit('close')" class="flex-1 btn-ghost text-sm border border-slate-200">取消</button>
          <button
            @click="handleApply"
            :disabled="selectedIds.size === 0"
            class="flex-1 text-sm font-semibold py-3 rounded-xl transition-colors cursor-pointer"
            :class="selectedIds.size > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'"
          >
            套用 {{ selectedIds.size > 0 ? selectedIds.size + ' 筆' : '' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useLedgerStore, CATEGORY_ICONS } from '../stores/ledger.js'

const emit = defineEmits(['close', 'applied'])
const store = useLedgerStore()

const displayMonth = computed(() =>
  dayjs(store.currentMonth + '-01').format('YYYY年M月')
)

const appliedIds = computed(() => store.appliedRecurringIds(store.currentMonth))

const activeItems = computed(() =>
  store.recurringExpenses
    .filter(r => r.isActive)
    .map(r => ({ ...r, alreadyApplied: appliedIds.value.has(r.id) }))
)

const unappliedItems = computed(() => activeItems.value.filter(i => !i.alreadyApplied))

// Pre-select all unapplied items
const selectedIds = ref(new Set(unappliedItems.value.map(i => i.id)))

function toggleSelect(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleAll() {
  const unapplied = unappliedItems.value.map(i => i.id)
  if (selectedIds.value.size === unapplied.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(unapplied)
  }
}

const selectedTotal = computed(() =>
  activeItems.value
    .filter(i => selectedIds.value.has(i.id))
    .reduce((s, i) => s + i.amount, 0)
)

function getLedger(id) { return store.ledgers.find(l => l.id === id) }

function handleApply() {
  if (selectedIds.value.size === 0) return
  store.applyRecurring(store.currentMonth, [...selectedIds.value])
  emit('applied', selectedIds.value.size)
  emit('close')
}
</script>
