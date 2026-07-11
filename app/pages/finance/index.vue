<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: () => t('finance.title'),
})

const financeStore = useFinanceStore()

onMounted(() => {
  void financeStore.init()
})
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-8 p-6">
    <header class="ui-page-header">
      <h1 class="ui-page-title">
        {{ $t('finance.title') }}
      </h1>
      <p class="ui-page-subtitle">
        {{ $t('finance.subtitle') }}
      </p>
    </header>

    <FoundersReportTable />
    <OperatorLogger />
  </main>
</template>
