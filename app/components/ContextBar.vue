<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { termYear, operatorName } = storeToRefs(financeStore)

onMounted(() => {
  void financeStore.hydrateProfile()
})

function onTermYearInput(event: Event) {
  financeStore.setTermYear((event.target as HTMLInputElement).value)
}

function onOperatorInput(event: Event) {
  financeStore.setOperatorName((event.target as HTMLInputElement).value)
}
</script>

<template>
  <div
    class="flex max-w-[min(100vw-8rem,20rem)] items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 sm:max-w-none sm:gap-2 sm:px-2.5"
    role="group"
    :aria-label="t('contextBar.ariaLabel')"
    :title="t('contextBar.tooltip')"
  >
    <label class="sr-only" for="context-term-year">
      {{ t('operator.fields.termYear') }}
    </label>
    <input
      id="context-term-year"
      :value="termYear"
      type="text"
      class="min-w-0 flex-1 rounded-md border border-zinc-700/80 bg-zinc-800/50 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:w-24 sm:flex-none sm:text-sm"
      :placeholder="t('operator.placeholders.termYear')"
      :aria-label="t('operator.fields.termYear')"
      @input="onTermYearInput"
    >
    <span class="hidden text-zinc-600 sm:inline" aria-hidden="true">|</span>
    <label class="sr-only" for="context-operator-name">
      {{ t('operator.fields.operatorName') }}
    </label>
    <input
      id="context-operator-name"
      :value="operatorName"
      type="text"
      class="min-w-0 flex-[1.2] rounded-md border bg-zinc-800/50 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:w-28 sm:flex-none sm:text-sm"
      :class="operatorName.trim() ? 'border-zinc-700/80' : 'border-amber-500/40'"
      :placeholder="t('operator.placeholders.operatorName')"
      :aria-label="t('operator.fields.operatorName')"
      @input="onOperatorInput"
    >
  </div>
</template>
