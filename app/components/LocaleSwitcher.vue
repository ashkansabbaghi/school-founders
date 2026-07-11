<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() =>
  locales.value.filter(l => typeof l === 'object' && l.code !== locale.value),
)
</script>

<template>
  <nav
    class="flex shrink-0 items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5"
    aria-label="Language"
  >
    <button
      v-for="loc in availableLocales"
      :key="loc.code"
      type="button"
      class="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-zinc-800/60 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
      @click="setLocale(loc.code)"
    >
      {{ typeof loc === 'object' ? loc.name : loc }}
    </button>
  </nav>
</template>
