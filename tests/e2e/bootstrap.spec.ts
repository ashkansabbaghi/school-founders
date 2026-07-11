import { expect, test } from '@playwright/test'
import { clearIndexedDb } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearIndexedDb(page)
})

test('first run seeds demo founders', async ({ page }) => {
  await page.goto('/founders')

  await expect(page.getByRole('heading', { name: 'بنیان‌گذاران مدارس' })).toBeVisible()
  await expect(page.getByText('مؤسس اول')).toBeVisible()
  await expect(page.getByText('مؤسس دوم')).toBeVisible()
})

test('direct navigation works for localized routes', async ({ page }) => {
  await page.goto('/en/founders')

  await expect(page.getByRole('heading', { name: 'School Founders' })).toBeVisible()
  await expect(page.getByText('مؤسس اول')).toBeVisible()
})
