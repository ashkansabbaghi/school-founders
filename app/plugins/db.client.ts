import { ensureInitialized, isOnboardingComplete } from '~/db/bootstrap'

export default defineNuxtPlugin(async () => {
  await ensureInitialized()

  const financeStore = useFinanceStore()
  const onboardingComplete = await isOnboardingComplete()
  financeStore.setOnboardingComplete(onboardingComplete)

  if (onboardingComplete) {
    await financeStore.ensureReady()
  }
})
