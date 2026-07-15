import { APP_VERSION } from '~/config/releases'
import {
  evaluateWhatsNewGate,
  getSeenReleaseVersion,
  setSeenReleaseVersion,
} from '~/utils/whatsNewStorage'

export function useWhatsNew() {
  const financeStore = useFinanceStore()
  const showWhatsNew = ref(false)

  function applyWhatsNewGate() {
    const gate = evaluateWhatsNewGate({
      currentVersion: APP_VERSION,
      seenVersion: getSeenReleaseVersion(),
      onboardingComplete: financeStore.onboardingComplete,
    })

    if (gate.shouldPersistSilently) {
      setSeenReleaseVersion(APP_VERSION)
    }

    showWhatsNew.value = gate.shouldShow
  }

  function dismissWhatsNew() {
    setSeenReleaseVersion(APP_VERSION)
    showWhatsNew.value = false
  }

  watch(
    () => financeStore.onboardingComplete,
    (onboardingComplete) => {
      if (onboardingComplete === null) {
        return
      }

      applyWhatsNewGate()
    },
    { immediate: true },
  )

  return {
    showWhatsNew,
    dismissWhatsNew,
  }
}
