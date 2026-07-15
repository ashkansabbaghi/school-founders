export type AppToastKind = 'success' | 'error'

export interface AppToastState {
  kind: AppToastKind
  message: string
}

export const TOAST_DURATION_MS = 3000

let dismissTimer: ReturnType<typeof setTimeout> | null = null

export function useAppToast() {
  const toast = useState<AppToastState | null>('app-toast', () => null)

  function clear() {
    if (dismissTimer !== null) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }

    toast.value = null
  }

  function show(kind: AppToastKind, message: string) {
    if (dismissTimer !== null) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }

    toast.value = { kind, message }

    if (import.meta.client) {
      dismissTimer = setTimeout(() => {
        dismissTimer = null
        toast.value = null
      }, TOAST_DURATION_MS)
    }
  }

  return {
    toast,
    show,
    clear,
  }
}
