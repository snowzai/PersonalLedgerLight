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
          <h2 class="text-lg font-semibold text-slate-900">{{ isEditing ? '編輯轉帳' : '帳本轉帳' }}</h2>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="px-6 py-5 space-y-5">
          <!-- From / To visual -->
          <div class="flex items-center gap-3">
            <!-- From ledger -->
            <div class="flex-1">
              <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">從帳本</label>
              <button
                v-for="l in store.ledgersWithBalance"
                v-show="false"
                :key="l.id"
              />
              <div class="relative">
                <select
                  v-model="form.fromLedgerId"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  @change="validateDifferentLedgers"
                >
                  <option v-for="l in store.ledgersWithBalance" :key="l.id" :value="l.id">
                    {{ l.name }} ({{ formatBalance(l.balance) }})
                  </option>
                </select>
                <div class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex-shrink-0"
                     :style="{ backgroundColor: fromLedger?.color || '#94A3B8' }"></div>
              </div>
            </div>

            <!-- Arrow -->
            <div class="mt-6 flex-shrink-0">
              <button
                @click="swapLedgers"
                class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
                title="對調帳本"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
              </button>
            </div>

            <!-- To ledger -->
            <div class="flex-1">
              <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">至帳本</label>
              <div class="relative">
                <select
                  v-model="form.toLedgerId"
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  @change="validateDifferentLedgers"
                >
                  <option v-for="l in store.ledgersWithBalance" :key="l.id" :value="l.id">
                    {{ l.name }}
                  </option>
                </select>
                <div class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex-shrink-0"
                     :style="{ backgroundColor: toLedger?.color || '#94A3B8' }"></div>
              </div>
            </div>
          </div>

          <!-- Same ledger error -->
          <p v-if="sameError" class="text-xs text-red-500 -mt-2">轉出與轉入帳本不能相同</p>

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
                class="input-field pl-12 text-2xl font-bold tabular-nums focus:ring-blue-500"
              />
            </div>
            <p v-if="amountError" class="text-xs text-red-500 mt-1.5">{{ amountError }}</p>
          </div>

          <!-- Description + Date -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">描述</label>
              <input
                v-model="form.description"
                type="text"
                placeholder="選填"
                maxlength="30"
                class="input-field text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">日期</label>
              <input
                v-model="form.date"
                type="date"
                :max="today"
                class="input-field text-sm"
              />
            </div>
          </div>

          <!-- Preview -->
          <div v-if="form.amount && !sameError" class="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl text-sm">
            <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: fromLedger?.color }"></div>
            <span class="font-medium text-slate-700">{{ fromLedger?.name }}</span>
            <svg class="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <div class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: toLedger?.color }"></div>
            <span class="font-medium text-slate-700">{{ toLedger?.name }}</span>
            <span class="ml-auto font-bold text-blue-600 tabular-nums">NT$ {{ Number(form.amount).toLocaleString('zh-TW') }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 pt-1 flex gap-3">
          <button
            v-if="isEditing"
            @click="handleDelete"
            class="px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors cursor-pointer"
          >刪除</button>
          <button @click="$emit('close')" class="flex-1 btn-ghost text-sm border border-slate-200">取消</button>
          <button @click="handleSave" class="flex-1 btn-primary text-sm" :disabled="sameError">
            {{ isEditing ? '儲存變更' : '確認轉帳' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import { useLedgerStore } from '../stores/ledger.js'

const props = defineProps({
  transfer:     { type: Object, default: null },
  defaultFrom:  { type: String, default: null },
})
const emit = defineEmits(['close'])
const store = useLedgerStore()

const isEditing  = computed(() => !!props.transfer)
const amountInput = ref(null)
const amountError = ref('')
const sameError   = ref(false)
const today = dayjs().format('YYYY-MM-DD')

const form = reactive({
  fromLedgerId: '',
  toLedgerId:   '',
  amount:       '',
  description:  '',
  date:         today,
})

onMounted(() => {
  const ledgerIds = store.ledgers.map(l => l.id)
  if (props.transfer) {
    form.fromLedgerId = props.transfer.fromLedgerId
    form.toLedgerId   = props.transfer.toLedgerId
    form.amount       = props.transfer.amount
    form.description  = props.transfer.description || ''
    form.date         = props.transfer.date
  } else {
    form.fromLedgerId = props.defaultFrom || ledgerIds[0] || ''
    form.toLedgerId   = ledgerIds.find(id => id !== form.fromLedgerId) || ledgerIds[1] || ''
  }
  nextTick(() => amountInput.value?.focus())
})

const fromLedger = computed(() => store.ledgersWithBalance.find(l => l.id === form.fromLedgerId))
const toLedger   = computed(() => store.ledgersWithBalance.find(l => l.id === form.toLedgerId))

function formatBalance(v) { return (v >= 0 ? '' : '-') + 'NT$ ' + Math.abs(v).toLocaleString('zh-TW') }

function validateDifferentLedgers() {
  sameError.value = form.fromLedgerId === form.toLedgerId
}

function swapLedgers() {
  const tmp = form.fromLedgerId
  form.fromLedgerId = form.toLedgerId
  form.toLedgerId = tmp
}

function handleSave() {
  amountError.value = ''
  const amount = parseFloat(form.amount)
  if (!amount || amount <= 0) { amountError.value = '請輸入有效金額'; return }
  if (form.fromLedgerId === form.toLedgerId) { sameError.value = true; return }

  const data = {
    fromLedgerId: form.fromLedgerId,
    toLedgerId:   form.toLedgerId,
    amount:       Math.round(amount),
    description:  form.description.trim(),
    date:         form.date,
    note:         '',
  }
  if (isEditing.value) store.updateTransfer(props.transfer.id, data)
  else store.addTransfer(data)
  emit('close')
}

function handleDelete() {
  store.deleteTransfer(props.transfer.id)
  emit('close')
}
</script>
