<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const items = computed(() => [
  { key: 'founders', to: localePath('/'), label: t('nav.founders') },
  { key: 'finance', to: localePath('/finance'), label: t('nav.finance') },
  { key: 'students', to: localePath('/students'), label: t('nav.students') },
  { key: 'employees', to: localePath('/employees'), label: t('nav.employees') },
])

function isActive(to: string, key: string) {
  if (key === 'founders') {
    return route.path === to
  }

  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <nav class="flex flex-wrap items-center gap-1" :aria-label="$t('nav.ariaLabel')">
    <NuxtLink
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      :class="isActive(item.to, item.key)
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
