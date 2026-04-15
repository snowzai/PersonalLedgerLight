import { ref, watchEffect } from 'vue'

const isDark = ref(false)

export function useDarkMode() {
  function init() {
    const stored = localStorage.getItem('dark_mode')
    if (stored !== null) {
      isDark.value = stored === 'true'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    apply()
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('dark_mode', isDark.value)
    apply()
  }

  function apply() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  return { isDark, init, toggle }
}
