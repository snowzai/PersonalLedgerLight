<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 px-0 md:px-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden">
        <!-- Handle (mobile) -->
        <div class="md:hidden flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 bg-slate-200 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 class="text-lg font-semibold text-slate-900">{{ isEditing ? '編輯帳本' : '新增帳本' }}</h2>
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
        <div class="px-6 py-5 space-y-5">
          <!-- Preview -->
          <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 transition-colors duration-200"
              :style="{ backgroundColor: form.color }"
            >
              <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path :d="currentIcon.svg" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-slate-900 text-lg leading-tight">{{ form.name || '帳本名稱' }}</p>
              <p class="text-sm text-slate-400 mt-0.5">{{ currentIcon.label }}</p>
            </div>
          </div>

          <!-- Name -->
          <div>
            <label for="ledger-name" class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">帳本名稱</label>
            <input
              id="ledger-name"
              v-model="form.name"
              type="text"
              placeholder="例：現金、信用卡、儲蓄帳戶"
              maxlength="20"
              class="input-field"
              required
            />
            <p v-if="nameError" class="text-xs text-red-500 mt-1.5">{{ nameError }}</p>
          </div>

          <!-- Icon grid -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">圖示</label>
            <div class="flex gap-2">
              <button
                v-for="icon in LEDGER_ICONS"
                :key="icon.key"
                @click="form.iconKey = icon.key"
                class="flex-1 py-3 rounded-xl border-2 flex items-center justify-center transition-all duration-150 cursor-pointer"
                :class="form.iconKey === icon.key ? 'border-current shadow-sm' : 'border-transparent bg-slate-50 hover:bg-slate-100'"
                :style="form.iconKey === icon.key ? { borderColor: form.color, backgroundColor: form.color + '15' } : {}"
                :aria-label="icon.label"
                :title="icon.label"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
                     :style="{ color: form.iconKey === icon.key ? form.color : '#94A3B8' }">
                  <path :d="icon.svg" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Color swatches -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">顏色</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="color in LEDGER_COLORS"
                :key="color"
                @click="form.color = color"
                class="w-9 h-9 rounded-xl cursor-pointer transition-all duration-150 hover:scale-110"
                :style="{ backgroundColor: color }"
                :class="form.color === color ? 'ring-2 ring-offset-2 ring-current scale-110' : ''"
                :style-ring="{ '--tw-ring-color': color }"
                :aria-label="color"
              >
                <svg v-if="form.color === color" class="w-full h-full p-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 pt-1 flex gap-3">
          <button
            v-if="isEditing && canDelete"
            @click="handleDelete"
            class="px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors cursor-pointer"
          >刪除</button>
          <button @click="$emit('close')" class="flex-1 btn-ghost text-sm border border-slate-200">取消</button>
          <button @click="handleSave" class="flex-1 btn-primary text-sm">
            {{ isEditing ? '儲存變更' : '建立帳本' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useLedgerStore, LEDGER_COLORS, LEDGER_ICONS } from '../stores/ledger.js'

const props = defineProps({
  ledger: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const store = useLedgerStore()

const isEditing = computed(() => !!props.ledger)
const canDelete = computed(() => store.ledgers.length > 1)
const nameError = ref('')

const form = reactive({
  name:    '',
  color:   LEDGER_COLORS[0],
  iconKey: LEDGER_ICONS[0].key,
})

const currentIcon = computed(() => LEDGER_ICONS.find(i => i.key === form.iconKey) || LEDGER_ICONS[0])

onMounted(() => {
  if (props.ledger) {
    form.name    = props.ledger.name
    form.color   = props.ledger.color
    form.iconKey = props.ledger.iconKey || LEDGER_ICONS[0].key
  } else {
    // Auto-pick a color not yet used
    const used = store.ledgers.map(l => l.color)
    const free = LEDGER_COLORS.find(c => !used.includes(c))
    if (free) form.color = free
  }
})

function handleSave() {
  nameError.value = ''
  if (!form.name.trim()) { nameError.value = '請輸入帳本名稱'; return }
  const data = { name: form.name.trim(), color: form.color, iconKey: form.iconKey }
  if (isEditing.value) {
    store.updateLedger(props.ledger.id, data)
  } else {
    store.addLedger(data)
  }
  emit('close')
}

function handleDelete() {
  if (!canDelete.value) return
  store.deleteLedger(props.ledger.id)
  emit('close')
}
</script>
