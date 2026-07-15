import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const stateMap = vi.hoisted(() => new Map<string, ReturnType<typeof ref>>())

vi.stubGlobal('useState', <T>(key: string, init?: () => T) => {
  if (!stateMap.has(key)) {
    stateMap.set(key, ref(init?.() ?? null))
  }

  return stateMap.get(key)! as ReturnType<typeof ref<T>>
})

const { TOAST_DURATION_MS, useAppToast } = await import('~/composables/useAppToast')

describe('useAppToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stateMap.clear()
  })

  afterEach(() => {
    const { clear } = useAppToast()
    clear()
    vi.useRealTimers()
  })

  it('shows a toast with the correct kind and message', () => {
    const { toast, show } = useAppToast()

    show('success', 'Saved successfully')

    expect(toast.value).toEqual({
      kind: 'success',
      message: 'Saved successfully',
    })
  })

  it('auto-dismisses the toast after TOAST_DURATION_MS', () => {
    const { toast, show } = useAppToast()

    show('error', 'Something went wrong')
    expect(toast.value).not.toBeNull()

    vi.advanceTimersByTime(TOAST_DURATION_MS - 1)
    expect(toast.value).toEqual({
      kind: 'error',
      message: 'Something went wrong',
    })

    vi.advanceTimersByTime(1)
    expect(toast.value).toBeNull()
  })

  it('replaces the previous toast when a new message is shown', () => {
    const { toast, show } = useAppToast()

    show('success', 'First message')
    vi.advanceTimersByTime(1000)

    show('error', 'Second message')

    expect(toast.value).toEqual({
      kind: 'error',
      message: 'Second message',
    })

    vi.advanceTimersByTime(TOAST_DURATION_MS - 1)
    expect(toast.value).toEqual({
      kind: 'error',
      message: 'Second message',
    })

    vi.advanceTimersByTime(1)
    expect(toast.value).toBeNull()
  })

  it('clears the toast immediately when clear() is called', () => {
    const { toast, show, clear } = useAppToast()

    show('success', 'Saved successfully')
    clear()

    expect(toast.value).toBeNull()

    vi.advanceTimersByTime(TOAST_DURATION_MS)
    expect(toast.value).toBeNull()
  })
})
