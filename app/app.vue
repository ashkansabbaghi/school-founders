<script setup lang="ts">
const { locale, localeProperties } = useI18n()

useHead({
  htmlAttrs: {
    lang: () => locale.value,
    dir: () => localeProperties.value.dir ?? 'ltr',
  },
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <AppNav />
        <LocaleSwitcher />
      </div>
    </header>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
