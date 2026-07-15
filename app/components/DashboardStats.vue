<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { t, locale } = useI18n()
const financeStore = useFinanceStore()
const { summary, isLoading, termYear, schools, students, employees } = storeToRefs(financeStore)

const currencyFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const countFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

function formatCurrency(value: number): string {
  return currencyFormatter.value.format(value)
}

function formatCount(value: number): string {
  return countFormatter.value.format(value)
}

const totalEmployeeExpenses = computed(() =>
  (summary.value?.schools ?? []).reduce((sum, row) => sum + row.employeeExpenses, 0),
)

const stats = computed(() => {
  const netProfit = summary.value?.totalNetProfit ?? 0

  return [
    {
      key: 'revenue',
      label: t('dashboard.stats.revenue'),
      value: formatCurrency(summary.value?.totalRevenue ?? 0),
      accent: 'text-emerald-400',
      glow: 'shadow-glow',
    },
    {
      key: 'expenses',
      label: t('dashboard.stats.expenses'),
      value: formatCurrency(totalEmployeeExpenses.value),
      accent: 'text-rose-400',
      glow: 'shadow-[0_0_20px_-5px_rgba(244,63,94,0.25)]',
    },
    {
      key: 'netProfit',
      label: t('dashboard.stats.netProfit'),
      value: formatCurrency(netProfit),
      accent: netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400',
      glow: netProfit >= 0 ? 'shadow-glow' : 'shadow-[0_0_20px_-5px_rgba(244,63,94,0.25)]',
    },
    {
      key: 'schools',
      label: t('dashboard.stats.schools'),
      value: formatCount(schools.value.length),
      accent: 'text-violet-300',
      glow: '',
    },
    {
      key: 'students',
      label: t('dashboard.stats.students'),
      value: formatCount(students.value.length),
      accent: 'text-sky-300',
      glow: '',
    },
    {
      key: 'employees',
      label: t('dashboard.stats.employees'),
      value: formatCount(employees.value.length),
      accent: 'text-amber-300',
      glow: '',
    },
  ]
})
</script>

<template>
  <section>
    <header class="mb-4">
      <h2 class="text-lg font-semibold">
        {{ $t('dashboard.stats.title') }}
      </h2>
      <p class="mt-1 text-sm ui-text-muted">
        {{ $t('dashboard.stats.subtitle', { termYear }) }}
      </p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="stat in stats"
        :key="stat.key"
        class="ui-card p-5"
        :class="stat.glow"
      >
        <div
          v-if="isLoading"
          class="space-y-3"
          aria-busy="true"
          :aria-label="$t('common.loading')"
        >
          <div class="ui-skeleton h-3 w-24" />
          <div class="ui-skeleton h-8 w-32" />
        </div>
        <template v-else>
          <p class="text-sm ui-text-muted">
            {{ stat.label }}
          </p>
          <p
            class="mt-2 text-2xl font-semibold tracking-tight"
            :class="stat.accent"
          >
            {{ stat.value }}
          </p>
        </template>
      </div>
    </div>
  </section>
</template>
