import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function clearIndexedDb(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('pardisan')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Failed to delete IndexedDB'))
      request.onblocked = () => resolve()
    })
  })
  await page.reload()
}

async function selectAcademicYear(
  page: Page,
  scope: Locator,
  termYear: string,
): Promise<void> {
  const input = scope.locator('#onboarding-term-year')
  const currentValue = await input.inputValue()

  if (currentValue === termYear) {
    return
  }

  await input.click()

  const yearPicker = page.getByRole('dialog', { name: 'سال تحصیلی' })
  await expect(yearPicker).toBeVisible()
  await yearPicker.getByRole('button', { name: termYear, exact: true }).click()
  await expect(yearPicker).not.toBeVisible()
}

interface CompleteOnboardingOptions {
  userName?: string
  termYear?: string
  startWithDemo?: boolean
}

export async function completeOnboardingWizard(
  page: Page,
  options: CompleteOnboardingOptions = {},
): Promise<void> {
  const {
    userName = 'کاربر تست',
    termYear = '1404-1405',
    startWithDemo = true,
  } = options

  await page.goto('/')

  const dialog = page.getByRole('dialog', { name: 'راه‌اندازی اولیه' })
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: 'ادامه' }).click()

  await dialog.getByLabel('نام شما').fill(userName)
  await selectAcademicYear(page, dialog, termYear)
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
