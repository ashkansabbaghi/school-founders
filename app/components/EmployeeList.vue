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
      return 'ui-badge-paid'
    case 'partial':
      return 'ui-badge-warning'
    default:
      return 'ui-badge-danger'
  }
}
</script>

<template>
  <section class="ui-card overflow-hidden">
    <div
      v-if="isLoading"
      class="scrollbar-thin overflow-x-auto"
      aria-busy="true"
      :aria-label="$t('common.loading')"
    >
      <table class="ui-table">
        <thead class="ui-table-head">
          <tr>
            <th class="ui-table-th">
              {{ $t('employees.columns.fullName') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.employeeId') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.role') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.school') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.expense') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.status') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800">
          <tr v-for="n in 5" :key="n">
            <td v-for="col in 6" :key="col" class="px-4 py-3">
              <div class="ui-skeleton h-4" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-else-if="rows.length === 0"
      class="ui-empty-state"
    >
      {{ $t('employees.empty') }}
    </div>
    <div v-else class="scrollbar-thin overflow-x-auto">
      <table class="ui-table">
        <thead class="ui-table-head">
          <tr>
            <th class="ui-table-th">
              {{ $t('employees.columns.fullName') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.employeeId') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.role') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.school') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.expense') }}
            </th>
            <th class="ui-table-th">
              {{ $t('employees.columns.status') }}
            </th>
          </tr>
        </thead>
        <TransitionGroup
          tag="tbody"
          name="list-item"
          appear
          class="divide-y divide-zinc-800"
        >
          <tr
            v-for="row in rows"
            :key="row.employee.id"
            class="ui-table-row cursor-pointer focus-visible:bg-zinc-800/50 focus-visible:outline-none"
            tabindex="0"
            @click="emit('select', row.employee)"
            @keydown.enter="emit('select', row.employee)"
          >
            <td class="px-4 py-3 font-medium text-zinc-100">
              {{ row.employee.fullName }}
            </td>
            <td class="px-4 py-3 text-zinc-300">
              {{ row.employee.employeeId }}
            </td>
            <td class="px-4 py-3 text-zinc-300">
              {{ row.employee.role }}
            </td>
            <td class="px-4 py-3 text-zinc-400">
              {{ row.schoolLabel }}
            </td>
            <td class="px-4 py-3 text-zinc-300">
              {{ numberFormatter.format(row.summary.paid) }} / {{ numberFormatter.format(row.summary.expected) }}
            </td>
            <td class="px-4 py-3">
              <span :class="statusClasses(row.summary.status)">
                {{ $t(`employees.status.${row.summary.status}`) }}
              </span>
            </td>
          </tr>
        </TransitionGroup>
      </table>
    </div>
  </section>
</template>
