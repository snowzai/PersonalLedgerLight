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
          <h2 class="text-lg font-semibold text-slate-900">{{ isEditing ? '編輯交易' : '新增交易' }}</h2>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="關閉"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div class="px-6 py-5 space-y-5 overflow-y-auto max-h-[80vh]">
          <!-- Type toggle -->
          <div class="flex bg-slate-100 rounded-xl p-1">
            <button
              @click="form.type = 'expense'"
              class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
              :class="form.type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >支出</button>
            <button
              @click="form.type = 'income'"
              class="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
              :class="form.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            >收入</button>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">金額</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">NT$</span>
              <input
                ref="amountInput"
                v-model="form.amount"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                class="input-field pl-12 text-2xl font-bold tabular-nums"
                :class="form.type === 'income' ? 'focus:ring-emerald-500' : 'focus:ring-red-400'"
              />
            </div>
            <p v-if="amountError" class="text-xs text-red-500 mt-1.5">{{ amountError }}</p>
          </div>

          <!-- Ledger picker -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">記入帳本</label>
            <div class="grid grid-cols-2 gap-2" :class="store.ledgers.length > 4 ? 'sm:grid-cols-3' : ''">
              <button
                v-for="l in store.ledgers"
                :key="l.id"
                @click="form.ledgerId = l.id"
                class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all duration-150 cursor-pointer text-left"
                :class="form.ledgerId === l.id ? 'border-current shadow-sm' : 'border-transparent bg-slate-50 hover:bg-slate-100'"
                :style="form.ledgerId === l.id ? { borderColor: l.color, backgroundColor: l.color + '12' } : {}"
              >
                <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" :style="{ backgroundColor: l.color + '20' }">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :style="{ color: l.color }">
                    <path :d="getLedgerIconSvg(l.iconKey)" />
                  </svg>
                </div>
                <span class="text-xs font-medium text-slate-700 truncate">{{ l.name }}</span>
              </button>
            </div>
          </div>

          <!-- Category grid -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">分類</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="cat in currentCategories"
                :key="cat"
                @click="form.category = cat"
                class="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all duration-150 cursor-pointer text-center"
                :class="form.category === cat
                  ? (form.type === 'income' ? 'border-emerald-500 bg-emerald-50' : 'border-blue-500 bg-blue-50')
                  : 'border-transparent bg-slate-50 hover:bg-slate-100'"
              >
                <span class="text-xl leading-none">{{ categoryIcon(cat) }}</span>
                <span class="text-xs font-medium text-slate-600 leading-tight">{{ cat }}</span>
              </button>
            </div>
          </div>

          <!-- Description + Date + Note -->
          <div>
            <label for="tx-desc" class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">描述</label>
            <input
              id="tx-desc"
              v-model="form.description"
              type="text"
              placeholder="簡短說明（選填）"
              maxlength="50"
              class="input-field"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="tx-date" class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">日期</label>
              <input id="tx-date" v-model="form.date" type="date" :max="today" class="input-field text-sm" />
            </div>
            <div>
              <label for="tx-note" class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">備註</label>
              <input id="tx-note" v-model="form.note" type="text" placeholder="選填" maxlength="30" class="input-field text-sm" />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 pt-2 flex gap-3">
          <button v-if="isEditing" @click="handleDelete" class="px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors cursor-pointer">刪除</button>
          <button @click="$emit('close')" class="flex-1 btn-ghost text-sm border border-slate-200">取消</button>
          <button @click="handleSave" class="flex-1 btn-primary text-sm">
            {{ isEditing ? '儲存變更' : '新增' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import { useLedgerStore, INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_ICONS, LEDGER_ICONS } from '../stores/ledger.js'

const props = defineProps({
  transaction: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const store = useLedgerStore()
const amountInput = ref(null)
const amountError = ref('')

const today = dayjs().format('YYYY-MM-DD')
const isEditing = computed(() => !!props.transaction)

const defaultLedgerId = computed(() => {
  if (store.activeLedgerId !== 'all') return store.activeLedgerId
  return store.ledgers[0]?.id || ''
})

const form = reactive({
  type:        'expense',
  amount:      '',
  ledgerId:    '',
  category:    '',
  description: '',
  date:        today,
  note:        '',
})

onMounted(() => {
  if (props.transaction) {
    form.type        = props.transaction.type
    form.amount      = props.transaction.amount
    form.ledgerId    = props.transaction.ledgerId || defaultLedgerId.value
    form.category    = props.transaction.category
    form.description = props.transaction.description || ''
    form.date        = props.transaction.date
    form.note        = props.transaction.note || ''
  } else {
    form.ledgerId = defaultLedgerId.value
    form.category = '其他支出'
  }
  nextTick(() => amountInput.value?.focus())
})

watch(() => form.type, (type) => {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  if (!cats.includes(form.category)) form.category = type === 'income' ? '其他收入' : '其他支出'
})

const currentCategories = computed(() => form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
function categoryIcon(cat) { return CATEGORY_ICONS[cat] || '💰' }
function getLedgerIconSvg(key) { return (LEDGER_ICONS.find(i => i.key === key) || LEDGER_ICONS[0]).svg }

function handleSave() {
  amountError.value = ''
  const amount = parseFloat(form.amount)
  if (!amount || amount <= 0) { amountError.value = '請輸入有效金額'; amountInput.value?.focus(); return }
  const tx = {
    type:        form.type,
    amount:      Math.round(amount),
    ledgerId:    form.ledgerId || defaultLedgerId.value,
    category:    form.category,
    description: form.description.trim(),
    date:        form.date,
    note:        form.note.trim(),
  }
  if (isEditing.value) store.updateTransaction(props.transaction.id, tx)
  else store.addTransaction(tx)
  emit('close')
}

function handleDelete() {
  if (isEditing.value) { store.deleteTransaction(props.transaction.id); emit('close') }
}
</script>
