# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bootstrap.spec.ts >> direct navigation works for localized routes after onboarding
- Location: tests/e2e/bootstrap.spec.ts:32:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Founders' })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: 'Founders' }) resolved to 2 elements:
    1) <h1 class="ui-page-title">Founders</h1> aka locator('h1')
    2) <h2 class="ui-section-header">Founders</h2> aka locator('h2')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Founders' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - link "School Fanders" [ref=e8] [cursor=pointer]:
          - /url: /en
        - navigation "Main navigation" [ref=e9]:
          - link "Dashboard" [ref=e10] [cursor=pointer]:
            - /url: /en
          - link "Finance Dashboard" [ref=e11] [cursor=pointer]:
            - /url: /en/finance
          - link "Student Management" [ref=e12] [cursor=pointer]:
            - /url: /en/students
          - link "Staff Management" [ref=e13] [cursor=pointer]:
            - /url: /en/employees
          - link "School Management" [ref=e14] [cursor=pointer]:
            - /url: /en/schools
          - link "Founders" [ref=e15] [cursor=pointer]:
            - /url: /en/founders
          - link "Settings" [ref=e16] [cursor=pointer]:
            - /url: /en/settings
      - generic [ref=e17]:
        - group "Global academic year" [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: Academic year
            - generic [ref=e21]:
              - textbox "Academic year" [ref=e22] [cursor=pointer]:
                - /placeholder: 1404-1405
                - text: 1404-1405
              - button "Academic year" [ref=e23] [cursor=pointer]:
                - img [ref=e24]
              - generic [ref=e27]:
                - img [ref=e29]
                - textbox [ref=e38]
                - button [ref=e39] [cursor=pointer]:
                  - img [ref=e40]
        - button "Switch to فارسی" [ref=e43] [cursor=pointer]:
          - img [ref=e44]
          - generic [ref=e46]: فارسی
  - status [ref=e47]: Founders
  - main [ref=e49]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - heading "Founders" [level=1] [ref=e53]
        - paragraph [ref=e54]: Add and manage school contacts and stakeholders.
      - button "Add founder" [ref=e55] [cursor=pointer]: +
    - generic [ref=e56]:
      - heading "Founders" [level=2] [ref=e57]
      - list [ref=e58]:
        - listitem [ref=e59]:
          - generic [ref=e60]: ما
          - generic [ref=e61]:
            - generic [ref=e62]: مؤسس اول
            - generic [ref=e63]: مدرسه نمونه
          - button "Delete" [ref=e64] [cursor=pointer]
        - listitem [ref=e65]:
          - generic [ref=e66]: مد
          - generic [ref=e67]:
            - generic [ref=e68]: مؤسس دوم
            - generic [ref=e69]: مدرسه نمونه
          - button "Delete" [ref=e70] [cursor=pointer]
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
  16 |   await expect(page.getByRole('heading', { name: 'بنیان‌گذاران' })).toBeVisible()
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
> 37 |   await expect(page.getByRole('heading', { name: 'Founders' })).toBeVisible()
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  38 |   await expect(page.getByText('مؤسس اول')).toBeVisible()
  39 | })
  40 | 
```