<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const to = computed(() => localePath('/help'))
const label = computed(() => t('nav.help'))
const isActive = computed(() => {
  const path = to.value
  return route.path === path || route.path.startsWith(`${path}/`)
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white/80 p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 sm:min-h-0 sm:min-w-0"
    :class="isActive
      ? 'bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-300'
      : ''"
    :aria-label="label"
    :title="label"
    :aria-current="isActive ? 'page' : undefined"
  >
    <svg
      class="h-5 w-5 shrink-0 stroke-[1.75]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
      />
    </svg>
    <span class="sr-only">{{ label }}</span>
  </NuxtLink>
</template>
