<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { SchoolProfitBreakdown } from '#shared/types/financial'

const { embedded = false } = defineProps<{ embedded?: boolean }>()

const { t, locale } = useI18n()
const financeStore = useFinanceStore()
const { summary, isLoading, termYear } = storeToRefs(financeStore)

const currencyFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

function formatCurrency(value: number): string {
  return currencyFormatter.value.format(value)
}

function barWidth(value: number, max: number): string {
  if (max <= 0) {
    return '0%'
  }
  return `${Math.min(100, (Math.abs(value) / max) * 100)}%`
}

const schoolRows = computed(() => summary.value?.schools ?? [])

const maxRevenue = computed(() =>
  Math.max(0, ...schoolRows.value.map(row => row.revenue)),
)

const maxExpenses = computed(() =>
  Math.max(0, ...schoolRows.value.map(row => row.employeeExpenses)),
)

const maxNetProfit = computed(() =>
  Math.max(0, ...schoolRows.value.map(row => Math.abs(row.netProfit))),
)

const totalEmployeeExpenses = computed(() =>
  schoolRows.value.reduce((sum, row) => sum + row.employeeExpenses, 0),
)

function profitBadgeClass(netProfit: number): string {
  return netProfit >= 0
    ? 'bg-emerald-500/15 text-emerald-400'
    : 'bg-rose-500/15 text-rose-400'
}

function profitBarClass(netProfit: number): string {
  return netProfit >= 0
    ? 'bg-emerald-500 shadow-glow'
    : 'bg-rose-500 shadow-[0_0_20px_-5px_rgba(244,63,94,0.25)]'
}

function profitTextClass(netProfit: number): string {
  return netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
}

function profitLabel(netProfit: number): string {
  return netProfit >= 0 ? t('report.profit') : t('report.loss')
}
</script>

<template>
  <component
    :is="embedded ? 'div' : 'section'"
    :class="embedded ? undefined : 'ui-card overflow-hidden'"
  >
    <header class="ui-card-header">
      <h2 class="text-lg font-semibold">
        {{ $t('report.title') }}
      </h2>
      <p class="mt-1 text-sm ui-text-muted">
        {{ $t('report.subtitle', { termYear }) }}
      </p>
    </header>

    <div class="md:hidden">
      <ul
        v-if="isLoading"
        class="ui-divide-y"
        aria-busy="true"
        :aria-label="$t('common.loading')"
      >
        <li
          v-for="n in 3"
          :key="n"
          class="space-y-3 p-4"
        >
          <div class="ui-skeleton h-5 w-40" />
          <div class="ui-skeleton h-3 w-24" />
          <div class="space-y-2">
            <div class="ui-skeleton h-4 w-full" />
            <div class="ui-skeleton h-2 w-full rounded-full" />
          </div>
          <div class="space-y-2">
            <div class="ui-skeleton h-4 w-full" />
            <div class="ui-skeleton h-2 w-full rounded-full" />
          </div>
        </li>
      </ul>

      <template v-else-if="schoolRows.length">
        <ul class="ui-divide-y">
          <li
            v-for="row in schoolRows as SchoolProfitBreakdown[]"
            :key="row.schoolId"
            class="space-y-3 p-4"
          >
            <div>
              <div class="font-medium">
                {{ row.schoolName }}
              </div>
              <div class="text-sm ui-text-muted">
                {{ row.branch }}
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-sm">
                <span class="ui-text-muted">{{ $t('report.columns.studentIncomes') }}</span>
                <span class="font-medium">{{ formatCurrency(row.revenue) }}</span>
              </div>
              <div class="mt-1.5 h-2 w-full ui-progress-track">
                <div
                  class="h-full rounded-full bg-emerald-500 shadow-glow transition-all"
                  :style="{ width: barWidth(row.revenue, maxRevenue) }"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-sm">
                <span class="ui-text-muted">{{ $t('report.columns.staffExpenses') }}</span>
                <span class="font-medium">{{ formatCurrency(row.employeeExpenses) }}</span>
              </div>
              <div class="mt-1.5 h-2 w-full ui-progress-track">
                <div
                  class="h-full rounded-full bg-rose-500 shadow-[0_0_20px_-5px_rgba(244,63,94,0.25)] transition-all"
                  :style="{ width: barWidth(row.employeeExpenses, maxExpenses) }"
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-sm">
                <span class="ui-text-muted">{{ $t('report.columns.netProfit') }}</span>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="profitBadgeClass(row.netProfit)"
                  >
                    {{ profitLabel(row.netProfit) }}
                  </span>
                  <span
                    class="font-semibold"
                    :class="profitTextClass(row.netProfit)"
                  >
                    {{ formatCurrency(row.netProfit) }}
                  </span>
                </div>
              </div>
              <div class="mt-1.5 h-2 w-full ui-progress-track">
                <div
                  class="h-full rounded-full transition-all"
                  :class="profitBarClass(row.netProfit)"
                  :style="{ width: barWidth(row.netProfit, maxNetProfit) }"
                />
              </div>
            </div>
          </li>
        </ul>

        <div
          v-if="summary"
          class="ui-card-footer"
        >
          <div class="mb-3 text-sm font-semibold">
            {{ $t('common.total') }}
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="ui-text-muted">{{ $t('report.columns.studentIncomes') }}</span>
              <span class="font-semibold">{{ formatCurrency(summary.totalRevenue) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="ui-text-muted">{{ $t('report.columns.staffExpenses') }}</span>
              <span class="font-semibold">{{ formatCurrency(totalEmployeeExpenses) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="ui-text-muted">{{ $t('report.columns.netProfit') }}</span>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="profitBadgeClass(summary.totalNetProfit)"
                >
                  {{ profitLabel(summary.totalNetProfit) }}
                </span>
                <span
                  class="font-semibold"
                  :class="profitTextClass(summary.totalNetProfit)"
                >
                  {{ formatCurrency(summary.totalNetProfit) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div
        v-else
        class="ui-empty-state"
      >
        {{ $t('report.empty') }}
      </div>
    </div>

    <div class="ui-table-scroll hidden md:block">
      <table class="ui-table">
        <thead class="ui-table-head">
          <tr>
            <th scope="col" class="ui-table-th">
              {{ $t('report.columns.schoolName') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('report.columns.studentIncomes') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('report.columns.staffExpenses') }}
            </th>
            <th scope="col" class="ui-table-th">
              {{ $t('report.columns.netProfit') }}
            </th>
          </tr>
        </thead>

        <tbody
          v-if="isLoading"
          class="ui-divide-y"
          aria-busy="true"
          :aria-label="$t('common.loading')"
        >
          <tr v-for="n in 3" :key="n">
            <td v-for="col in 4" :key="col" class="px-6 py-4">
              <div class="ui-skeleton h-4" />
            </td>
          </tr>
        </tbody>

        <tbody
          v-else-if="schoolRows.length"
          class="ui-divide-y"
        >
          <tr
            v-for="row in schoolRows as SchoolProfitBreakdown[]"
            :key="row.schoolId"
            class="ui-table-row"
          >
            <td class="px-6 py-4">
              <div class="font-medium">
                {{ row.schoolName }}
              </div>
              <div class="text-sm ui-text-muted">
                {{ row.branch }}
              </div>
            </td>

            <td class="px-6 py-4">
              <div class="mb-1 text-sm font-medium">
                {{ formatCurrency(row.revenue) }}
              </div>
              <div class="h-2 w-full max-w-xs ui-progress-track">
                <div
                  class="h-full rounded-full bg-emerald-500 shadow-glow transition-all"
                  :style="{ width: barWidth(row.revenue, maxRevenue) }"
                />
              </div>
            </td>

            <td class="px-6 py-4">
              <div class="mb-1 text-sm font-medium">
                {{ formatCurrency(row.employeeExpenses) }}
              </div>
              <div class="h-2 w-full max-w-xs ui-progress-track">
                <div
                  class="h-full rounded-full bg-rose-500 shadow-[0_0_20px_-5px_rgba(244,63,94,0.25)] transition-all"
                  :style="{ width: barWidth(row.employeeExpenses, maxExpenses) }"
                />
              </div>
            </td>

            <td class="px-6 py-4">
              <div class="mb-2 flex items-center gap-2">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="profitBadgeClass(row.netProfit)"
                >
                  {{ profitLabel(row.netProfit) }}
                </span>
                <span
                  class="text-sm font-semibold"
                  :class="profitTextClass(row.netProfit)"
                >
                  {{ formatCurrency(row.netProfit) }}
                </span>
              </div>
              <div class="h-2 w-full max-w-xs ui-progress-track">
                <div
                  class="h-full rounded-full transition-all"
                  :class="profitBarClass(row.netProfit)"
                  :style="{ width: barWidth(row.netProfit, maxNetProfit) }"
                />
              </div>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td colspan="4" class="px-6 py-12 text-center text-sm text-zinc-500">
              {{ $t('report.empty') }}
            </td>
          </tr>
        </tbody>

        <tfoot
          v-if="summary && schoolRows.length"
          class="ui-table-footer"
        >
          <tr>
            <td class="px-6 py-4 text-sm font-semibold">
              {{ $t('common.total') }}
            </td>
            <td class="px-6 py-4 text-sm font-semibold">
              {{ formatCurrency(summary.totalRevenue) }}
            </td>
            <td class="px-6 py-4 text-sm font-semibold">
              {{ formatCurrency(totalEmployeeExpenses) }}
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="profitBadgeClass(summary.totalNetProfit)"
              >
                {{ profitLabel(summary.totalNetProfit) }}
              </span>
              <span
                class="ms-2 text-sm font-semibold"
                :class="profitTextClass(summary.totalNetProfit)"
              >
                {{ formatCurrency(summary.totalNetProfit) }}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </component>
</template>
