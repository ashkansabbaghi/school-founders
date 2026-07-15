# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bootstrap.spec.ts >> first run shows onboarding wizard and can start with demo data
- Location: tests/e2e/bootstrap.spec.ts:8:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'بنیان‌گذاران' })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: 'بنیان‌گذاران' }) resolved to 2 elements:
    1) <h1 class="ui-page-title">بنیان‌گذاران</h1> aka locator('h1')
    2) <h2 class="ui-section-header">بنیان‌گذاران</h2> aka locator('h2')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'بنیان‌گذاران' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - link "School Fanders" [ref=e8] [cursor=pointer]:
          - /url: /
        - navigation "ناوبری اصلی" [ref=e9]:
          - link "داشبورد" [ref=e10] [cursor=pointer]:
            - /url: /
          - link "داشبورد مالی" [ref=e11] [cursor=pointer]:
            - /url: /finance
          - link "مدیریت دانش‌آموزان" [ref=e12] [cursor=pointer]:
            - /url: /students
          - link "مدیریت پرسنل" [ref=e13] [cursor=pointer]:
            - /url: /employees
          - link "مدیریت مدارس" [ref=e14] [cursor=pointer]:
            - /url: /schools
          - link "بنیان‌گذاران" [ref=e15] [cursor=pointer]:
            - /url: /founders
          - link "تنظیمات" [ref=e16] [cursor=pointer]:
            - /url: /settings
      - generic [ref=e17]:
        - group "سال تحصیلی سراسری" [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: سال تحصیلی
            - generic [ref=e21]:
              - textbox "سال تحصیلی" [ref=e22] [cursor=pointer]:
                - /placeholder: ۱۴۰۴-۱۴۰۵
                - text: 1404-1405
              - button "سال تحصیلی" [ref=e23] [cursor=pointer]:
                - img [ref=e24]
              - generic [ref=e27]:
                - img [ref=e29]
                - textbox [ref=e38]
                - button [ref=e39] [cursor=pointer]:
                  - img [ref=e40]
        - button "تغییر به English" [ref=e43] [cursor=pointer]:
          - img [ref=e44]
          - generic [ref=e46]: English
  - status [ref=e47]: بنیان‌گذاران
  - main [ref=e49]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - heading "بنیان‌گذاران" [level=1] [ref=e53]
        - paragraph [ref=e54]: افزودن و مدیریت مخاطبین و سهامداران مدرسه.
      - button "افزودن بنیان‌گذار" [ref=e55] [cursor=pointer]: +
    - generic [ref=e56]:
      - heading "بنیان‌گذاران" [level=2] [ref=e57]
      - list [ref=e58]:
        - listitem [ref=e59]:
          - generic [ref=e60]: ما
          - generic [ref=e61]:
            - generic [ref=e62]: مؤسس اول
            - generic [ref=e63]: مدرسه نمونه
          - button "حذف" [ref=e64] [cursor=pointer]
        - listitem [ref=e65]:
          - generic [ref=e66]: مد
          - generic [ref=e67]:
            - generic [ref=e68]: مؤسس دوم
            - generic [ref=e69]: مدرسه نمونه
          - button "حذف" [ref=e70] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { clearIndexedDb, completeOnboardingWizard } from './helpers'
  3  | 
  4  | test.beforeEach(async ({ page }) => {
  5  |   await clearIndexedDb(page)
  6  | })
  7  | 
  8  | test('first run shows onboarding wizard and can start with demo data', async ({ page }) => {
  9  |   await page.goto('/')
  10 | 
  11 |   await expect(page.getByRole('dialog', { name: 'راه‌اندازی اولیه' })).toBeVisible()
  12 | 
  13 |   await completeOnboardingWizard(page, { startWithDemo: true })
  14 | 
  15 |   await page.goto('/founders')
> 16 |   await expect(page.getByRole('heading', { name: 'بنیان‌گذاران' })).toBeVisible()
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  17 |   await expect(page.getByText('مؤسس اول')).toBeVisible()
  18 |   await expect(page.getByText('مؤسس دوم')).toBeVisible()
  19 | 
  20 |   await page.goto('/schools')
  21 |   await expect(page.getByRole('heading', { name: 'مدیریت مدارس' })).toBeVisible()
  22 |   await expect(page.getByText('مدرسه نمونه')).toBeVisible()
  23 | })
  24 | 
  25 | test('onboarding empty start shows first payment CTA on dashboard', async ({ page }) => {
  26 |   await completeOnboardingWizard(page, { startWithDemo: false })
  27 | 
  28 |   await expect(page.getByText('اولین پرداخت را ثبت کنید')).toBeVisible()
  29 |   await expect(page.getByRole('link', { name: 'رفتن به مالی' })).toBeVisible()
  30 | })
  31 | 
  32 | test('direct navigation works for localized routes after onboarding', async ({ page }) => {
  33 |   await completeOnboardingWizard(page)
  34 | 
  35 |   await page.goto('/en/founders')
  36 | 
  37 |   await expect(page.getByRole('heading', { name: 'Founders' })).toBeVisible()
  38 |   await expect(page.getByText('مؤسس اول')).toBeVisible()
  39 | })
  40 | 
```