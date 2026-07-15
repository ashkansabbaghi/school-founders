<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: () => t('finance.title'),
})
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
    <header class="ui-page-header">
      <h1 class="ui-page-title">
        {{ $t('finance.title') }}
      </h1>
      <p class="ui-page-subtitle">
        {{ $t('finance.subtitle') }}
      </p>
    </header>

    <LazyFinanceEntryTabs />
  </main>
</template>
