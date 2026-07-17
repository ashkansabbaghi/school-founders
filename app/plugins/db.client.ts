import { ensureInitialized, isOnboardingComplete } from '~/db/bootstrap'
import { initializeAccountContext } from '~/services/accountContext'

export default defineNuxtPlugin({
  name: 'db',
  async setup() {
    await initializeAccountContext()
    await ensureInitialized()

    const financeStore = useFinanceStore()
    const onboardingComplete = await isOnboardingComplete()
    financeStore.setOnboardingComplete(onboardingComplete)

    if (onboardingComplete) {
      await financeStore.ensureReady()
    }
  },
})
