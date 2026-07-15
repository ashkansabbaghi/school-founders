<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { termYear } = storeToRefs(financeStore)

onMounted(() => {
  void financeStore.hydrateProfile()
})

function onTermYearUpdate(value: string) {
  financeStore.setTermYear(value)
}
</script>

<template>
  <div
    class="flex w-full items-center md:w-auto"
    role="group"
    :aria-label="t('contextBar.ariaLabel')"
    :title="t('contextBar.tooltip')"
  >
    <AcademicYearField
      id="context-term-year"
      :model-value="termYear"
      :label="t('academicYear.label')"
      compact
      @update:model-value="onTermYearUpdate"
    />
  </div>
</template>
