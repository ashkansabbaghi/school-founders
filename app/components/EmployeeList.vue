<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Employee, EmployeeTransaction } from '#shared/types/financial'

const props = defineProps<{
  employees: Employee[]
  transactions: EmployeeTransaction[]
  isLoading?: boolean
  isSearchEmpty?: boolean
  searchQuery?: string
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

const transactionsByEmployeeId = computed(() => {
  const map = new Map<string, EmployeeTransaction[]>()
  for (const transaction of props.transactions) {
    const existing = map.get(transaction.employeeId)
    if (existing) {
      existing.push(transaction)
    } else {
      map.set(transaction.employeeId, [transaction])
    }
  }
  return map
})

const schoolById = computed(() => new Map(schools.value.map(school => [school.id, school])))

const rows = computed(() =>
  props.employees.map((employee) => {
    const employeeTransactions = transactionsByEmployeeId.value.get(employee.id) ?? []
    const summary = financeStore.employeeExpenseSummary(employee, employeeTransactions)
    const school = schoolById.value.get(employee.schoolId)

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
  <section>
    <div
      v-if="isLoading"
      aria-busy="true"
      :aria-label="$t('common.loading')"
    >
      <ul class="space-y-3 md:hidden">
        <li
          v-for="n in 5"
          :key="n"
          class="ui-card space-y-2 p-4"
        >
          <div class="ui-skeleton h-5 w-40" />
          <div class="ui-skeleton h-4 w-56" />
          <div class="ui-skeleton h-4 w-32" />
        </li>
      </ul>
      <div class="ui-card hidden overflow-hidden md:block">
        <div class="ui-table-scroll">
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
            <tbody class="ui-divide-y">
              <tr v-for="n in 5" :key="n">
                <td v-for="col in 6" :key="col" class="px-4 py-3">
                  <div class="ui-skeleton h-4" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div
      v-else-if="rows.length === 0"
      class="ui-card"
    >
      <div class="ui-empty-state">
        {{ isSearchEmpty ? $t('common.noSearchResults') : $t('employees.empty') }}
      </div>
    </div>
    <template v-else>
      <TransitionGroup
        tag="ul"
        name="list-item"
        appear
        class="space-y-3 md:hidden"
      >
        <li
          v-for="row in rows"
          :key="row.employee.id"
        >
          <button
            type="button"
            class="ui-card-hover flex w-full items-start justify-between gap-3 p-4 text-start transition-colors duration-200 active:bg-zinc-100 dark:active:bg-zinc-800/50 focus-visible:bg-zinc-100 dark:focus-visible:bg-zinc-800/50 focus-visible:outline-none"
            @click="emit('select', row.employee)"
          >
            <div class="min-w-0 flex-1">
              <div class="truncate text-base font-medium">
                <ListSearchHighlight
                  :text="row.employee.fullName"
                  :query="searchQuery ?? ''"
                />
              </div>
              <div class="mt-0.5 truncate text-sm ui-text-muted">
                {{ row.employee.role }}
              </div>
              <div class="truncate text-sm ui-text-muted">
                {{ row.schoolLabel }}
              </div>
              <div class="mt-1.5 text-sm ui-text-secondary">
                {{ $t('employees.remaining', { amount: numberFormatter.format(row.summary.remaining) }) }}
              </div>
            </div>
            <span
              :class="statusClasses(row.summary.status)"
              class="shrink-0"
            >
              {{ $t(`employees.status.${row.summary.status}`) }}
            </span>
          </button>
        </li>
      </TransitionGroup>
      <div class="ui-card hidden overflow-hidden md:block">
        <div class="ui-table-scroll">
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
              class="ui-divide-y"
            >
              <tr
                v-for="row in rows"
                :key="row.employee.id"
                class="ui-table-row cursor-pointer focus-visible:bg-zinc-100 dark:focus-visible:bg-zinc-800/50 focus-visible:outline-none"
                tabindex="0"
                @click="emit('select', row.employee)"
                @keydown.enter="emit('select', row.employee)"
              >
                <td class="px-4 py-3 font-medium">
                  <ListSearchHighlight
                    :text="row.employee.fullName"
                    :query="searchQuery ?? ''"
                  />
                </td>
                <td class="px-4 py-3 ui-text-secondary">
                  <ListSearchHighlight
                    :text="row.employee.employeeId"
                    :query="searchQuery ?? ''"
                  />
                </td>
                <td class="px-4 py-3 ui-text-secondary">
                  {{ row.employee.role }}
                </td>
                <td class="px-4 py-3 ui-text-muted">
                  {{ row.schoolLabel }}
                </td>
                <td class="px-4 py-3 ui-text-secondary">
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
      </div>
    </template>
  </section>
</template>
