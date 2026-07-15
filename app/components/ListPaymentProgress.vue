<script setup lang="ts">
import type { EmployeeExpenseStatus, StudentPaymentStatus } from '#shared/types/financial'

const props = defineProps<{
  paid: number
  expected: number
  status: StudentPaymentStatus | EmployeeExpenseStatus
}>()

const { locale } = useI18n()

const numberFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const progressPercent = computed(() => {
  if (props.expected <= 0) {
    return 0
  }

  return Math.min(100, (props.paid / props.expected) * 100)
})

const barClass = computed(() => {
  switch (props.status) {
    case 'paid':
      return 'bg-emerald-500'
    case 'partial':
      return 'bg-amber-500'
    default:
      return 'bg-rose-500'
  }
})
</script>

<template>
  <div>
    <div class="ui-text-secondary">
      {{ numberFormatter.format(paid) }} / {{ numberFormatter.format(expected) }}
    </div>
    <div class="mt-1.5 h-1.5 max-w-[10rem] ui-progress-track">
      <div
        class="h-full rounded-full transition-all"
        :class="barClass"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>
  </div>
</template>
