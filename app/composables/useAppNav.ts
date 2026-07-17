export type AppNavItem = {
  key: string
  to: string
  label: string
  shortLabel: string
}

const PRIMARY_NAV_KEYS = ['dashboard', 'finance', 'students'] as const
const DRAWER_NAV_KEYS = ['employees', 'schools', 'founders', 'help', 'settings'] as const

export function useAppNav() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()

  const items = computed<AppNavItem[]>(() => [
    { key: 'dashboard', to: localePath('/'), label: t('nav.dashboard'), shortLabel: t('nav.dashboardShort') },
    { key: 'finance', to: localePath('/finance'), label: t('nav.finance'), shortLabel: t('nav.financeShort') },
    { key: 'students', to: localePath('/students'), label: t('nav.students'), shortLabel: t('nav.studentsShort') },
    { key: 'employees', to: localePath('/employees'), label: t('nav.employees'), shortLabel: t('nav.employeesShort') },
    { key: 'schools', to: localePath('/schools'), label: t('nav.schools'), shortLabel: t('nav.schoolsShort') },
    { key: 'founders', to: localePath('/founders'), label: t('nav.founders'), shortLabel: t('nav.foundersShort') },
    { key: 'help', to: localePath('/help'), label: t('nav.help'), shortLabel: t('nav.helpShort') },
    { key: 'settings', to: localePath('/settings'), label: t('nav.settings'), shortLabel: t('nav.settingsShort') },
  ])

  const primaryItems = computed(() =>
    items.value.filter(item => (PRIMARY_NAV_KEYS as readonly string[]).includes(item.key)),
  )

  const drawerItems = computed(() =>
    items.value.filter(item => (DRAWER_NAV_KEYS as readonly string[]).includes(item.key)),
  )

  function isActive(to: string, key: string) {
    if (key === 'dashboard') {
      return route.path === to
    }

    return route.path === to || route.path.startsWith(`${to}/`)
  }

  function isDrawerActive() {
    return drawerItems.value.some(item => isActive(item.to, item.key))
  }

  return { items, primaryItems, drawerItems, isActive, isDrawerActive }
}
