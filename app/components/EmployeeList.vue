<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Employee, EmployeeTransaction } from '#shared/types/financial'

const props = defineProps<{
  employees: Employee[]
  transactions: EmployeeTransaction[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  select: [employee: Employee]
}>()

const { locale } = useI18n()
const financeStore = useFinanceStore()
const { schools } = storeToRefs(financeStore)

const numberFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const rows = computed(() =>
  props.employees.map((employee) => {
    const employeeTransactions = props.transactions.filter(
      transaction => transaction.employeeId === employee.id,
    )
    const summary = financeStore.employeeExpenseSummary(employee, employeeTransactions)
    const school = schools.value.find(item => item.id === employee.schoolId)

    return {
      employee,
      summary,
      schoolLabel: school ? `${school.name} — ${school.branch}` : employee.schoolId,
    }
  }),
)

function statusClasses(status: 'paid' | 'partial' | 'unpaid'): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800'
    case 'partial':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-rose-100 text-rose-800'
  }
}
</script>

<template>
  <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
    <div v-if="isLoading" class="p-6 text-sm text-gray-500">
      {{ $t('common.loading') }}
    </div>
    <div
      v-else-if="rows.length === 0"
      class="p-6 text-center text-sm text-gray-500"
    >
      {{ $t('employees.empty') }}
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('employees.columns.fullName') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('employees.columns.employeeId') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('employees.columns.role') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('employees.columns.school') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('employees.columns.expense') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('employees.columns.status') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="row in rows"
            :key="row.employee.id"
            class="cursor-pointer transition-colors hover:bg-indigo-50"
            tabindex="0"
            @click="emit('select', row.employee)"
            @keydown.enter="emit('select', row.employee)"
          >
            <td class="px-4 py-3 font-medium text-gray-900">
              {{ row.employee.fullName }}
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ row.employee.employeeId }}
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ row.employee.role }}
            </td>
            <td class="px-4 py-3 text-gray-600">
              {{ row.schoolLabel }}
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ numberFormatter.format(row.summary.paid) }} / {{ numberFormatter.format(row.summary.expected) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                :class="statusClasses(row.summary.status)"
              >
                {{ $t(`employees.status.${row.summary.status}`) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
