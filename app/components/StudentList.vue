<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Student, StudentTransaction } from '#shared/types/financial'

const props = defineProps<{
  students: Student[]
  transactions: StudentTransaction[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  select: [student: Student]
}>()

const { locale } = useI18n()
const financeStore = useFinanceStore()
const { schools } = storeToRefs(financeStore)

const numberFormatter = computed(() =>
  new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US'),
)

const rows = computed(() =>
  props.students.map((student) => {
    const studentTransactions = props.transactions.filter(
      transaction => transaction.studentId === student.id,
    )
    const summary = financeStore.studentPaymentSummary(student, studentTransactions)
    const school = schools.value.find(item => item.id === student.schoolId)

    return {
      student,
      summary,
      schoolLabel: school ? `${school.name} — ${school.branch}` : student.schoolId,
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
      {{ $t('students.empty') }}
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('students.columns.fullName') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('students.columns.studentId') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('students.columns.grade') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('students.columns.school') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('students.columns.payment') }}
            </th>
            <th class="px-4 py-3 text-start font-medium text-gray-600">
              {{ $t('students.columns.status') }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr
            v-for="row in rows"
            :key="row.student.id"
            class="cursor-pointer transition-colors hover:bg-indigo-50"
            tabindex="0"
            @click="emit('select', row.student)"
            @keydown.enter="emit('select', row.student)"
          >
            <td class="px-4 py-3 font-medium text-gray-900">
              {{ row.student.fullName }}
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ row.student.studentId }}
            </td>
            <td class="px-4 py-3 text-gray-700">
              {{ row.student.grade }}
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
                {{ $t(`students.status.${row.summary.status}`) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
