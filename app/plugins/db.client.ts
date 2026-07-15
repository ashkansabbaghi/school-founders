import { ensureInitialized, isOnboardingComplete } from '~/db/bootstrap'

export default defineNuxtPlugin({
  name: 'db',
  async setup() {
    await ensureInitialized()

    const financeStore = useFinanceStore()
    const onboardingComplete = await isOnboardingComplete()
    financeStore.setOnboardingComplete(onboardingComplete)

    if (onboardingComplete) {
      await financeStore.ensureReady()
    }
  },
})
