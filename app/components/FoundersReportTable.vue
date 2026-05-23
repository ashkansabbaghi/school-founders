<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { SchoolProfitBreakdown } from '#shared/types/financial'

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
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-rose-100 text-rose-800'
}

function profitBarClass(netProfit: number): string {
  return netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
}

function profitLabel(netProfit: number): string {
  return netProfit >= 0 ? t('report.profit') : t('report.loss')
}
</script>

<template>
  <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
    <header class="border-b border-gray-200 px-6 py-4">
      <h2 class="text-lg font-semibold text-gray-900">
        {{ $t('report.title') }}
      </h2>
      <p class="mt-1 text-sm text-gray-500">
        {{ $t('report.subtitle', { termYear }) }}
      </p>
    </header>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              {{ $t('report.columns.schoolName') }}
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              {{ $t('report.columns.studentIncomes') }}
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              {{ $t('report.columns.staffExpenses') }}
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              {{ $t('report.columns.netProfit') }}
            </th>
          </tr>
        </thead>

        <tbody v-if="isLoading" class="divide-y divide-gray-100 bg-white">
          <tr v-for="n in 3" :key="n">
            <td v-for="col in 4" :key="col" class="px-6 py-4">
              <div class="h-4 animate-pulse rounded bg-gray-200" />
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="schoolRows.length" class="divide-y divide-gray-100 bg-white">
          <tr v-for="row in schoolRows as SchoolProfitBreakdown[]" :key="row.schoolId" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900">
                {{ row.schoolName }}
              </div>
              <div class="text-sm text-gray-500">
                {{ row.branch }}
              </div>
            </td>

            <td class="px-6 py-4">
              <div class="mb-1 text-sm font-medium text-gray-900">
                {{ formatCurrency(row.revenue) }}
              </div>
              <div class="h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
                <div
                  class="h-full rounded-full bg-emerald-500 transition-all"
                  :style="{ width: barWidth(row.revenue, maxRevenue) }"
                />
              </div>
            </td>

            <td class="px-6 py-4">
              <div class="mb-1 text-sm font-medium text-gray-900">
                {{ formatCurrency(row.employeeExpenses) }}
              </div>
              <div class="h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
                <div
                  class="h-full rounded-full bg-rose-500 transition-all"
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
                <span class="text-sm font-semibold" :class="row.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'">
                  {{ formatCurrency(row.netProfit) }}
                </span>
              </div>
              <div class="h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
                <div
                  class="h-full rounded-full transition-all"
                  :class="profitBarClass(row.netProfit)"
                  :style="{ width: barWidth(row.netProfit, maxNetProfit) }"
                />
              </div>
            </td>
          </tr>
        </tbody>

        <tbody v-else class="bg-white">
          <tr>
            <td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500">
              {{ $t('report.empty') }}
            </td>
          </tr>
        </tbody>

        <tfoot v-if="summary && schoolRows.length" class="border-t border-gray-200 bg-gray-50">
          <tr>
            <td class="px-6 py-4 text-sm font-semibold text-gray-900">
              {{ $t('common.total') }}
            </td>
            <td class="px-6 py-4 text-sm font-semibold text-gray-900">
              {{ formatCurrency(summary.totalRevenue) }}
            </td>
            <td class="px-6 py-4 text-sm font-semibold text-gray-900">
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
                class="ml-2 text-sm font-semibold"
                :class="summary.totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'"
              >
                {{ formatCurrency(summary.totalNetProfit) }}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>
