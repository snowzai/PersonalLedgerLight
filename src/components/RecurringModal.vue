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
          <h2 class="text-lg font-semibold text-slate-900">{{ isEditing ? '編輯固定支出' : '新增固定支出' }}</h2>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div class="px-6 py-5 space-y-5 overflow-y-auto max-h-[80vh]">
          <!-- Name -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">名稱</label>
            <input
              ref="nameInput"
              v-model="form.name"
              type="text"
              placeholder="例如：房租、網路費"
              maxlength="30"
              class="input-field"
            />
            <p v-if="nameError" class="text-xs text-red-500 mt-1.5">{{ nameError }}</p>
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
              />
            </div>
            <p v-if="amountError" class="text-xs text-red-500 mt-1.5">{{ amountError }}</p>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">分類</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="cat in EXPENSE_CATEGORIES"
                :key="cat"
                @click="form.category = cat"
                class="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all duration-150 cursor-pointer text-center"
                :class="form.category === cat ? 'border-orange-400 bg-orange-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'"
              >
                <span class="text-xl leading-none">{{ CATEGORY_ICONS[cat] || '💸' }}</span>
                <span class="text-xs font-medium text-slate-600 leading-tight">{{ cat }}</span>
              </button>
            </div>
          </div>

          <!-- Ledger -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">記入帳本</label>
            <div class="grid grid-cols-2 gap-2">
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

          <!-- Day of month + Note -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">每月幾號扣款</label>
              <input
                v-model.number="form.dayOfMonth"
                type="number"
                min="1"
                max="31"
                placeholder="1–31"
                class="input-field text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">備註</label>
              <input v-model="form.note" type="text" placeholder="選填" maxlength="30" class="input-field text-sm" />
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useLedgerStore, EXPENSE_CATEGORIES, CATEGORY_ICONS, LEDGER_ICONS } from '../stores/ledger.js'

const props = defineProps({
  recurring: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const store = useLedgerStore()

const nameInput = ref(null)
const nameError = ref('')
const amountError = ref('')
const isEditing = computed(() => !!props.recurring)

const form = reactive({
  name: '',
  amount: '',
  category: '其他支出',
  ledgerId: '',
  dayOfMonth: 1,
  note: '',
})

onMounted(() => {
  if (props.recurring) {
    form.name       = props.recurring.name
    form.amount     = props.recurring.amount
    form.category   = props.recurring.category
    form.ledgerId   = props.recurring.ledgerId
    form.dayOfMonth = props.recurring.dayOfMonth
    form.note       = props.recurring.note || ''
  } else {
    form.ledgerId = store.ledgers[0]?.id || ''
  }
  nextTick(() => nameInput.value?.focus())
})

function getLedgerIconSvg(key) {
  return (LEDGER_ICONS.find(i => i.key === key) || LEDGER_ICONS[0]).svg
}

function handleSave() {
  nameError.value = ''
  amountError.value = ''
  if (!form.name.trim()) { nameError.value = '請輸入名稱'; nameInput.value?.focus(); return }
  const amount = parseFloat(form.amount)
  if (!amount || amount <= 0) { amountError.value = '請輸入有效金額'; return }
  const data = {
    name:       form.name.trim(),
    amount:     Math.round(amount),
    category:   form.category,
    ledgerId:   form.ledgerId || store.ledgers[0]?.id,
    dayOfMonth: Math.min(31, Math.max(1, form.dayOfMonth || 1)),
    note:       form.note.trim(),
  }
  if (isEditing.value) store.updateRecurring(props.recurring.id, data)
  else store.addRecurring(data)
  emit('close')
}

function handleDelete() {
  store.deleteRecurring(props.recurring.id)
  emit('close')
}
</script>
