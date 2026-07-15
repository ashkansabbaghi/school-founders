<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()

const alternateLocale = computed(() =>
  locales.value.find(l => typeof l === 'object' && l.code !== locale.value),
)

const alternateLabel = computed(() =>
  typeof alternateLocale.value === 'object' ? alternateLocale.value.name : '',
)

function switchLocale() {
  if (alternateLocale.value && typeof alternateLocale.value === 'object') {
    setLocale(alternateLocale.value.code)
  }
}
</script>

<template>
  <button
    v-if="alternateLocale"
    type="button"
    class="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white/80 p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 sm:min-h-0 sm:min-w-0"
    :aria-label="t('locale.switchTo', { language: alternateLabel })"
    :title="t('locale.switchTo', { language: alternateLabel })"
    @click="switchLocale"
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
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
    <span class="sr-only">{{ alternateLabel }}</span>
  </button>
</template>
