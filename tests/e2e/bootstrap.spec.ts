import { expect, test } from '@playwright/test'
import { clearIndexedDb, completeOnboardingWizard } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearIndexedDb(page)
})

test('first run shows onboarding wizard and starts empty', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('dialog', { name: 'راه‌اندازی اولیه' })).toBeVisible()

  await completeOnboardingWizard(page)

  await page.goto('/founders')
  await expect(page.getByRole('heading', { name: 'بنیان‌گذاران' })).toBeVisible()
  await expect(page.getByText('هنوز بنیان‌گذاری ثبت نشده است.')).toBeVisible()

  await page.goto('/schools')
  await expect(page.getByRole('heading', { name: 'مدیریت مدارس' })).toBeVisible()
})

test('onboarding shows getting started checklist on dashboard', async ({ page }) => {
  await completeOnboardingWizard(page)

  const checklist = page.getByRole('status')
  await expect(checklist.getByText('شروع کار', { exact: true })).toBeVisible()
  await expect(checklist.getByRole('link', { name: 'رفتن به مدارس' })).toBeVisible()
  await expect(checklist.getByRole('link', { name: 'رفتن به دانش‌آموزان' })).toBeVisible()
  await expect(checklist.getByRole('link', { name: 'رفتن به مالی' })).toBeVisible()
  await expect(checklist.getByRole('link', { name: 'رفتن به تنظیمات' })).toBeVisible()
})

test('direct navigation works for localized routes after onboarding', async ({ page }) => {
  await completeOnboardingWizard(page)

  await page.goto('/en/founders')

  await expect(page.getByRole('heading', { name: 'Founders' })).toBeVisible()
  await expect(page.getByText('No founders yet.')).toBeVisible()
})
