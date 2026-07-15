<script setup lang="ts">
const { t } = useI18n()
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const label = computed(() =>
  isDark.value ? t('theme.switchToLight') : t('theme.switchToDark'),
)

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    class="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white/80 p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 sm:min-h-0 sm:min-w-0"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <svg
      v-if="isDark"
      class="h-5 w-5 shrink-0 stroke-[1.75]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
    <svg
      v-else
      class="h-5 w-5 shrink-0 stroke-[1.75]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
      />
    </svg>
    <span class="sr-only">{{ label }}</span>
  </button>
</template>
