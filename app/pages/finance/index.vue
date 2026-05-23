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
    <header>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ $t('finance.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ $t('finance.subtitle') }}
      </p>
    </header>

    <FoundersReportTable />
    <OperatorLogger />
  </main>
</template>
