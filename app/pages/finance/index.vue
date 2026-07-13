<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { status, error } = storeToRefs(financeStore)

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

    <div
      v-if="status === 'error' && error"
      class="ui-alert-error"
      role="alert"
    >
      {{ error }}
    </div>

    <FoundersReportTable />
    <FixedCostsPanel />
    <OperatorLogger />
  </main>
</template>
