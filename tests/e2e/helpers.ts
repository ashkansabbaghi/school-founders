import type { Page } from '@playwright/test'

export async function clearIndexedDb(page: Page): Promise<void> {
  await page.goto('about:blank')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('school-fanders')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Failed to delete IndexedDB'))
      request.onblocked = () => resolve()
    })
  })
}
