<script setup lang="ts">
const { primaryItems, isActive } = useAppNav()
</script>

<template>
  <nav class="hidden items-center gap-1 md:flex" :aria-label="$t('nav.ariaLabel')">
    <NuxtLink
      v-for="item in primaryItems"
      :key="item.key"
      :to="item.to"
      class="rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
      :class="isActive(item.to, item.key)
        ? 'bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-300'
        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'"
    >
      {{ item.label }}
    </NuxtLink>
    <AppNavMoreMenu />
  </nav>
</template>
