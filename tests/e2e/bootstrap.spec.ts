import { expect, test } from '@playwright/test'
import { clearIndexedDb, completeOnboardingWizard } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearIndexedDb(page)
})

test('first run shows onboarding wizard and can start with demo data', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('dialog', { name: 'راه‌اندازی اولیه' })).toBeVisible()

  await completeOnboardingWizard(page, { startWithDemo: true })

  await page.goto('/founders')
  await expect(page.getByRole('heading', { name: 'بنیان‌گذاران' })).toBeVisible()
  await expect(page.getByText('مؤسس اول')).toBeVisible()
  await expect(page.getByText('مؤسس دوم')).toBeVisible()

  await page.goto('/schools')
  await expect(page.getByRole('heading', { name: 'مدیریت مدارس' })).toBeVisible()
  await expect(page.getByText('مدرسه نمونه')).toBeVisible()
})

test('onboarding empty start shows first payment CTA on dashboard', async ({ page }) => {
  await completeOnboardingWizard(page, { startWithDemo: false })

  await expect(page.getByText('اولین پرداخت را ثبت کنید')).toBeVisible()
  await expect(page.getByRole('link', { name: 'رفتن به مالی' })).toBeVisible()
})

test('direct navigation works for localized routes after onboarding', async ({ page }) => {
  await completeOnboardingWizard(page)

  await page.goto('/en/founders')

  await expect(page.getByRole('heading', { name: 'Founders' })).toBeVisible()
  await expect(page.getByText('مؤسس اول')).toBeVisible()
})
