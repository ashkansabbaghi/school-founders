import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { FIXTURE_IDS, getTestData } from '../helpers/fixtures'
import { clearIndexedDb, completeOnboardingWizard } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearIndexedDb(page)
})

test('creates a founder while offline and keeps it after reload', async ({ page, context }) => {
  await completeOnboardingWizard(page)
  await page.goto('/founders')

  // Workbox activates the service worker only after precaching completes,
  // so waiting for `ready` guarantees offline navigation is fully cached.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })

  await context.setOffline(true)

  await page.getByRole('button', { name: 'افزودن بنیان‌گذار' }).click()
  await page.getByRole('dialog', { name: 'افزودن بنیان‌گذار' }).getByLabel('نام').fill('بنیان‌گذار آفلاین')
  await page.getByRole('button', { name: 'افزودن بنیان‌گذار' }).last().click()

  await expect(page.getByText('بنیان‌گذار آفلاین')).toBeVisible()

  await context.setOffline(false)
  await page.reload()

  await expect(page.getByText('بنیان‌گذار آفلاین')).toBeVisible()
})

test('imports a backup file from settings', async ({ page }) => {
  await completeOnboardingWizard(page)

  const fixture = getTestData()
  const backup = {
    schemaVersion: 1,
    dbVersion: 1,
    exportedAt: new Date().toISOString(),
    collections: {
      ...fixture,
      founders: [
        {
          id: 'imported-founder-id',
          name: 'Imported Founder',
          school: 'Imported School',
        },
      ],
      meta: {
        installId: 'playwright-install-id',
        initialized: 'true',
        operatorName: 'اپراتور',
        termYear: '1404-1405',
      },
    },
  }

  const backupPath = join(test.info().outputDir, 'import-backup.json')
  mkdirSync(test.info().outputDir, { recursive: true })
  writeFileSync(backupPath, JSON.stringify(backup, null, 2))

  await page.goto('/settings')
  await page.getByRole('button', { name: 'بازیابی از فایل' }).click()
  await page.locator('input[type="file"]').setInputFiles(backupPath)
  await page.getByRole('button', { name: 'جایگزینی کامل' }).click()

  await expect(page.getByText('داده‌ها با موفقیت بازیابی شد.')).toBeVisible()

  await page.goto('/founders')
  await expect(page.getByText('Imported Founder')).toBeVisible()
  await expect(page.getByText('مؤسس اول')).toHaveCount(0)
})

test('keeps data isolated between two accounts across repeated switches', async ({ page }) => {
  await completeOnboardingWizard(page, { userName: 'اکانت اول' })

  // Seed a founder in the first account.
  await page.goto('/founders')
  await page.getByRole('button', { name: 'افزودن بنیان‌گذار' }).click()
  await page.getByRole('dialog', { name: 'افزودن بنیان‌گذار' }).getByLabel('نام').fill('بنیان‌گذار اول')
  await page.getByRole('button', { name: 'افزودن بنیان‌گذار' }).last().click()
  await expect(page.getByText('بنیان‌گذار اول')).toBeVisible()

  // Create and activate a second account from settings.
  await page.goto('/settings')
  await page.getByLabel('اکانت جدید').fill('اکانت دوم')
  await page.getByRole('button', { name: 'ساخت اکانت' }).click()
  await expect(page.getByText('اکانت جدید ساخته شد.')).toBeVisible()

  const secondAccountRow = page.locator('li').filter({ hasText: 'اکانت دوم' })
  await secondAccountRow.getByRole('button', { name: 'فعال‌سازی این اکانت' }).click()
  await expect(page.getByText('اکانت «اکانت دوم» فعال شد.')).toBeVisible()

  // The second account starts empty and gets its own founder.
  await page.goto('/founders')
  await expect(page.getByText('بنیان‌گذار اول')).toHaveCount(0)

  await page.getByRole('button', { name: 'افزودن بنیان‌گذار' }).click()
  await page.getByRole('dialog', { name: 'افزودن بنیان‌گذار' }).getByLabel('نام').fill('بنیان‌گذار دوم')
  await page.getByRole('button', { name: 'افزودن بنیان‌گذار' }).last().click()
  await expect(page.getByText('بنیان‌گذار دوم')).toBeVisible()

  // Switch back to the first account.
  await page.goto('/settings')
  const firstAccountRow = page.locator('li').filter({ hasText: 'اکانت اول' })
  await firstAccountRow.getByRole('button', { name: 'فعال‌سازی این اکانت' }).click()
  await expect(page.getByText('اکانت «اکانت اول» فعال شد.')).toBeVisible()

  await page.goto('/founders')
  await expect(page.getByText('بنیان‌گذار اول')).toBeVisible()
  await expect(page.getByText('بنیان‌گذار دوم')).toHaveCount(0)

  // Switch once more and confirm the second account still only has its own data.
  await page.goto('/settings')
  await secondAccountRow.getByRole('button', { name: 'فعال‌سازی این اکانت' }).click()
  await expect(page.getByText('اکانت «اکانت دوم» فعال شد.')).toBeVisible()

  await page.goto('/founders')
  await expect(page.getByText('بنیان‌گذار دوم')).toBeVisible()
  await expect(page.getByText('بنیان‌گذار اول')).toHaveCount(0)

  // Data survives a full reload with the second account still active.
  await page.reload()
  await expect(page.getByText('بنیان‌گذار دوم')).toBeVisible()
  await expect(page.getByText('بنیان‌گذار اول')).toHaveCount(0)
})

test('exports backup from settings without errors', async ({ page }) => {
  await completeOnboardingWizard(page)
  await page.goto('/founders')

  await page.getByRole('button', { name: 'افزودن بنیان‌گذار' }).click()
  await page.getByRole('dialog', { name: 'افزودن بنیان‌گذار' }).getByLabel('نام').fill('بنیان‌گذار خروجی')
  await page.getByRole('button', { name: 'افزودن بنیان‌گذار' }).last().click()
  await expect(page.getByText('بنیان‌گذار خروجی')).toBeVisible()

  await page.goto('/settings')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'خروجی JSON' }).click()

  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^pardisan-backup-\d{4}-\d{2}-\d{2}\.json$/)

  const content = await download.createReadStream().then(async (stream) => {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  })

  expect(content.schemaVersion).toBe(2)
  expect(content.account).toMatchObject({
    name: expect.any(String),
    folderName: expect.any(String),
  })
  expect(content.collections.founders.some(
    (founder: { name: string }) => founder.name === 'بنیان‌گذار خروجی',
  )).toBe(true)
  expect(content.collections.founders.some(
    (founder: { id: string }) => founder.id === FIXTURE_IDS.founderA,
  )).toBe(false)
})
