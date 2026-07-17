export type ReleaseLocale = 'fa' | 'en'

export type ReleaseNoteItem = Record<ReleaseLocale, string>

export const APP_VERSION = '1.0.0'

export const CURRENT_RELEASE = {
  version: APP_VERSION,
  items: [
    {
      fa: 'پشتیبانی از حالت تاریک و تم خودکار بر اساس تنظیمات سیستم',
      en: 'Dark mode and automatic theme based on system preferences',
    },
    {
      fa: 'فیلدهای تاریخ شمسی و مبلغ ریالی برای ثبت‌های مالی دقیق‌تر',
      en: 'Persian calendar and Rial currency fields for more accurate financial entries',
    },
    {
      fa: 'راهنمای شروع کار برای کاربران تازه‌وارد',
      en: 'Onboarding wizard and getting-started checklist for new users',
    },
    {
      fa: 'نصب به‌صورت PWA و کار آفلاین با به‌روزرسانی خودکار',
      en: 'PWA install with offline use and automatic updates',
    },
  ] satisfies ReleaseNoteItem[],
} as const

export function resolveReleaseLocale(locale: string): ReleaseLocale {
  return locale.startsWith('en') ? 'en' : 'fa'
}

export function getReleaseNoteItems(locale: string): string[] {
  const lang = resolveReleaseLocale(locale)
  return CURRENT_RELEASE.items.map(item => item[lang])
}
