import { watch } from 'vue'

const fontLoaders = {
  fa: () =>
    Promise.all([
      import('@fontsource/vazirmatn/arabic-400.css'),
      import('@fontsource/vazirmatn/arabic-600.css'),
    ]),
  en: () =>
    Promise.all([
      import('@fontsource/inter/latin-400.css'),
      import('@fontsource/inter/latin-600.css'),
    ]),
} as const

type AppLocale = keyof typeof fontLoaders

function resolveLocale(locale: string): AppLocale {
  return locale in fontLoaders ? (locale as AppLocale) : 'fa'
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const loaded = new Set<AppLocale>()

  async function ensureFonts(locale: string) {
    const key = resolveLocale(locale)
    if (loaded.has(key)) {
      return
    }

    await fontLoaders[key]()
    loaded.add(key)
  }

  const i18n = nuxtApp.$i18n as { locale: { value: string } }
  await ensureFonts(i18n.locale.value)

  watch(
    () => i18n.locale.value,
    locale => void ensureFonts(locale),
  )
})
