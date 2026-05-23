<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() =>
  locales.value.filter(l => typeof l === 'object' && l.code !== locale.value),
)
</script>

<template>
  <nav class="flex items-center gap-2" aria-label="Language">
    <button
      v-for="loc in availableLocales"
      :key="loc.code"
      type="button"
      class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      @click="setLocale(loc.code)"
    >
      {{ typeof loc === 'object' ? loc.name : loc }}
    </button>
  </nav>
</template>
