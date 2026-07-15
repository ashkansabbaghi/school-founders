import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { DEMO_IDS, getDemoData } from '../../app/db/demoData'
import { clearIndexedDb, completeOnboardingWizard } from './helpers'

test.beforeEach(async ({ page }) => {
  await clearIndexedDb(page)
})

test('creates a founder while offline and keeps it after reload', async ({ page, context }) => {
  await completeOnboardingWizard(page)
  await page.goto('/founders')
  await expect(page.getByText('مؤسس اول')).toBeVisible()

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
  await page.goto('/founders')
  await expect(page.getByText('مؤسس اول')).toBeVisible()

  const demo = getDemoData()
  const backup = {
    schemaVersion: 1,
    dbVersion: 1,
    exportedAt: new Date().toISOString(),
    collections: {
      ...demo,
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

test('exports backup from settings without errors', async ({ page }) => {
  await completeOnboardingWizard(page)
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

  expect(content.schemaVersion).toBe(1)
  expect(content.collections.founders.some((founder: { id: string }) => founder.id === DEMO_IDS.founderA)).toBe(true)
})
