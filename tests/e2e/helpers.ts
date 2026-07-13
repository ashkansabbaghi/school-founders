import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function clearIndexedDb(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('school-fanders')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Failed to delete IndexedDB'))
      request.onblocked = () => resolve()
    })
  })
  await page.reload()
}

interface CompleteOnboardingOptions {
  operatorName?: string
  termYear?: string
  startWithDemo?: boolean
}

export async function completeOnboardingWizard(
  page: Page,
  options: CompleteOnboardingOptions = {},
): Promise<void> {
  const {
    operatorName = 'اپراتور تست',
    termYear = '1404-1405',
    startWithDemo = true,
  } = options

  await page.goto('/')

  const dialog = page.getByRole('dialog', { name: 'راه‌اندازی اولیه' })
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: 'ادامه' }).click()

  await dialog.getByLabel('نام اپراتور').fill(operatorName)
  await dialog.getByLabel('سال تحصیلی').fill(termYear)
  await page.getByRole('button', { name: 'ادامه' }).click()

  if (startWithDemo) {
    await dialog.getByRole('button', { name: 'شروع با داده نمایشی' }).click()
  }
  else {
    await dialog.getByRole('button', { name: 'شروع خالی' }).click()
  }

  await dialog.getByRole('button', { name: 'شروع', exact: true }).click()
  await expect(dialog).not.toBeVisible()
}
