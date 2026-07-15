<script setup lang="ts">
import type { FixedCost, School } from '#shared/types/financial'

const props = defineProps<{
  fixedCosts: FixedCost[]
  schools: School[]
  pending?: boolean
}>()

defineEmits<{
  edit: [cost: FixedCost]
  delete: [id: string]
}>()

const { locale } = useI18n()

const currencyFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const schoolById = computed(() =>
  new Map(props.schools.map(school => [school.id, school])),
)

function formatCurrency(value: number): string {
  return currencyFormatter.value.format(value)
}

function schoolLabel(schoolId: string): string {
  const school = schoolById.value.get(schoolId)

  if (!school) {
    return schoolId
  }

  return `${school.name} — ${school.branch}`
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="ui-section-header">
      {{ $t('fixedCosts.listTitle') }}
    </h2>

    <ul
      v-if="pending"
      class="space-y-3"
      aria-busy="true"
      :aria-label="$t('common.loading')"
    >
      <li
        v-for="n in 3"
        :key="n"
        class="ui-card flex items-center gap-4 p-4"
      >
        <div class="ui-skeleton h-10 w-10 shrink-0 rounded-lg" />
        <div class="flex-1 space-y-2">
          <div class="ui-skeleton h-4 w-32" />
          <div class="ui-skeleton h-3 w-24" />
        </div>
        <div class="ui-skeleton h-8 w-24 rounded-lg" />
      </li>
    </ul>

    <TransitionGroup
      v-else-if="fixedCosts.length"
      tag="ul"
      name="list-item"
      appear
      class="space-y-3"
    >
      <li
        v-for="cost in fixedCosts"
        :key="cost.id"
        class="ui-card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-sm font-semibold text-amber-300"
          aria-hidden="true"
        >
          {{ cost.label.charAt(0) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-medium">
            {{ cost.label }}
          </div>
          <div class="truncate text-sm ui-text-muted">
            {{ schoolLabel(cost.schoolId) }}
          </div>
        </div>
        <div class="flex items-center justify-between gap-3 sm:contents">
          <div class="shrink-0 text-sm font-semibold sm:order-3">
            {{ formatCurrency(cost.amount) }}
          </div>
          <div class="flex shrink-0 gap-2 sm:order-4">
          <button
            type="button"
            class="ui-btn-secondary px-3 py-1.5"
            @click="$emit('edit', cost)"
          >
            {{ $t('common.edit') }}
          </button>
          <button
            type="button"
            class="ui-btn-danger px-3 py-1.5"
            @click="$emit('delete', cost.id)"
          >
            {{ $t('common.delete') }}
          </button>
          </div>
        </div>
      </li>
    </TransitionGroup>

    <div
      v-else
      class="ui-empty-state"
    >
      {{ $t('fixedCosts.empty') }}
    </div>
  </section>
</template>
