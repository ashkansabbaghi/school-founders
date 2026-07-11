import { ensureInitialized } from '~/db/bootstrap'

export default defineNuxtPlugin(async () => {
  await ensureInitialized()
})
