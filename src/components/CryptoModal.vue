<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 px-0 md:px-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden">
        <!-- Handle (mobile) -->
        <div class="md:hidden flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 bg-slate-200 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center" :class="mode === 'export' ? 'bg-blue-50' : 'bg-emerald-50'">
              <svg class="w-4 h-4" :class="mode === 'export' ? 'text-blue-500' : 'text-emerald-500'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h2 class="text-base font-semibold text-slate-900">{{ mode === 'export' ? '加密匯出' : '解密匯入' }}</h2>
          </div>
          <button @click="$emit('cancel')" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Form -->
        <div class="px-6 py-5 space-y-4">
          <p class="text-xs text-slate-400 leading-relaxed">
            {{ mode === 'export'
              ? '設定密碼與調味料後，備份檔案將加密保護。匯入時需輸入相同的密碼與調味料。'
              : '請輸入當初匯出時使用的密碼與調味料以解密。' }}
          </p>

          <!-- Passphrase -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">密碼</label>
            <div class="relative">
              <input
                ref="passphraseInput"
                v-model="passphrase"
                :type="showPass ? 'text' : 'password'"
                placeholder="輸入密碼"
                autocomplete="new-password"
                class="input-field pr-10"
                @keydown.enter="handleConfirm"
              />
              <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <template v-if="showPass">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </template>
                  <template v-else>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </template>
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm passphrase (export only) -->
          <div v-if="mode === 'export'">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">確認密碼</label>
            <input
              v-model="confirmPassphrase"
              :type="showPass ? 'text' : 'password'"
              placeholder="再次輸入密碼"
              autocomplete="new-password"
              class="input-field"
              @keydown.enter="handleConfirm"
            />
          </div>

          <!-- Pepper (調味料) -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              調味料
              <span class="ml-1 text-slate-300 font-normal normal-case tracking-normal">（額外秘密，不存入檔案）</span>
            </label>
            <input
              v-model="pepper"
              type="text"
              placeholder="自訂文字，留空則不使用"
              class="input-field font-mono text-sm"
              @keydown.enter="handleConfirm"
            />
          </div>

          <!-- Error -->
          <p v-if="error" class="text-xs text-red-500 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ error }}
          </p>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 pt-2 flex gap-3">
          <button @click="$emit('cancel')" class="flex-1 btn-ghost text-sm border border-slate-200">取消</button>
          <button @click="handleConfirm" :disabled="loading" class="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
            <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            {{ mode === 'export' ? '加密並匯出' : '解密並匯入' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const props = defineProps({
  mode: { type: String, required: true }, // 'export' | 'import'
})
const emit = defineEmits(['confirm', 'cancel'])

const passphrase        = ref('')
const confirmPassphrase = ref('')
const pepper            = ref('')
const showPass          = ref(false)
const error             = ref('')
const loading           = ref(false)
const passphraseInput   = ref(null)

onMounted(() => nextTick(() => passphraseInput.value?.focus()))

function handleConfirm() {
  error.value = ''
  if (!passphrase.value) { error.value = '請輸入密碼'; return }
  if (props.mode === 'export' && passphrase.value !== confirmPassphrase.value) {
    error.value = '兩次輸入的密碼不一致'; return
  }
  loading.value = true
  emit('confirm', { passphrase: passphrase.value, pepper: pepper.value })
}

function setError(msg) {
  error.value = msg
  loading.value = false
}

defineExpose({ setError })
</script>
