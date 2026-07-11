export function useNetworkStatus() {
  const isOnline = ref(true)

  function syncOnlineStatus() {
    if (import.meta.client) {
      isOnline.value = navigator.onLine
    }
  }

  onMounted(() => {
    syncOnlineStatus()
    window.addEventListener('online', syncOnlineStatus)
    window.addEventListener('offline', syncOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', syncOnlineStatus)
    window.removeEventListener('offline', syncOnlineStatus)
  })

  return { isOnline }
}
