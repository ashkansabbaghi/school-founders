export type AppNavItem = {
  key: string
  to: string
  label: string
  shortLabel: string
}

export function useAppNav() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()

  const items = computed<AppNavItem[]>(() => [
    { key: 'dashboard', to: localePath('/'), label: t('nav.dashboard'), shortLabel: t('nav.dashboardShort') },
    { key: 'founders', to: localePath('/founders'), label: t('nav.founders'), shortLabel: t('nav.foundersShort') },
    { key: 'finance', to: localePath('/finance'), label: t('nav.finance'), shortLabel: t('nav.financeShort') },
    { key: 'students', to: localePath('/students'), label: t('nav.students'), shortLabel: t('nav.studentsShort') },
    { key: 'employees', to: localePath('/employees'), label: t('nav.employees'), shortLabel: t('nav.employeesShort') },
  ])

  function isActive(to: string, key: string) {
    if (key === 'dashboard') {
      return route.path === to
    }

    return route.path === to || route.path.startsWith(`${to}/`)
  }

  return { items, isActive }
}
