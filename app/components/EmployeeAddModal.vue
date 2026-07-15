<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Employee } from '#shared/types/financial'

const props = defineProps<{
  defaultSchoolId?: string
}>()

const emit = defineEmits<{
  close: []
  created: [employee: Employee]
}>()

const financeStore = useFinanceStore()
const { schools, isSubmitting } = storeToRefs(financeStore)

const form = reactive({
  fullName: '',
  nationalCode: '',
  employeeId: '',
  role: '',
  schoolId: '',
  baseSalary: '' as number | '',
  insuranceCost: 0,
})

const canSubmit = computed(() =>
  Boolean(
    form.fullName.trim()
    && form.nationalCode.trim()
    && form.employeeId.trim()
    && form.role.trim()
    && form.schoolId
    && form.baseSalary !== ''
    && Number(form.baseSalary) > 0
    && form.insuranceCost !== ''
    && Number(form.insuranceCost) >= 0
    && !isSubmitting.value,
  ),
)

function defaultSchoolIdValue(): string {
  return props.defaultSchoolId || schools.value[0]?.id || ''
}

function resetForm() {
  form.fullName = ''
  form.nationalCode = ''
  form.employeeId = ''
  form.role = ''
  form.schoolId = defaultSchoolIdValue()
  form.baseSalary = ''
  form.insuranceCost = 0
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

  financeStore.clearSubmitFeedback()

  try {
    const employee = await financeStore.saveEmployee({
      fullName: form.fullName.trim(),
      nationalCode: form.nationalCode.trim(),
      employeeId: form.employeeId.trim(),
      role: form.role.trim(),
      schoolId: form.schoolId,
      baseSalary: Number(form.baseSalary),
      insuranceCost: Number(form.insuranceCost),
    })

    resetForm()
    emit('created', employee)
    emit('close')
  }
  catch {
    // Error handled by store
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

watch(
  () => props.defaultSchoolId,
  (schoolId) => {
    if (schoolId) {
      form.schoolId = schoolId
    }
  },
)

onMounted(() => {
  resetForm()
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="ui-modal-overlay"
    @click.self="emit('close')"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="$t('employees.addEmployee')"
      class="ui-modal-panel max-w-3xl sm:my-8"
    >
      <header class="ui-modal-header">
        <h2 class="text-lg font-semibold">
          {{ $t('employees.addEmployee') }}
        </h2>
        <button
          type="button"
          class="ui-modal-close"
          :aria-label="$t('employees.close')"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <div class="scrollbar-thin px-4 py-5 sm:max-h-[calc(100vh-8rem)] sm:overflow-y-auto sm:px-6">
        <form
          class="grid gap-4 sm:grid-cols-2"
          @submit.prevent="submit"
        >
          <label class="block space-y-1 sm:col-span-2">
            <span class="ui-label">{{ $t('employees.fields.fullName') }}</span>
            <input
              v-model="form.fullName"
              type="text"
              required
              class="ui-input"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('employees.fields.nationalCode') }}</span>
            <input
              v-model="form.nationalCode"
              type="text"
              required
              maxlength="10"
              class="ui-input"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('employees.fields.employeeId') }}</span>
            <input
              v-model="form.employeeId"
              type="text"
              required
              class="ui-input"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('employees.fields.role') }}</span>
            <input
              v-model="form.role"
              type="text"
              required
              class="ui-input"
            >
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('employees.fields.school') }}</span>
            <select
              v-model="form.schoolId"
              required
              class="ui-input"
            >
              <option value="" disabled>
                {{ $t('operator.placeholders.selectSchool') }}
              </option>
              <option v-for="school in schools" :key="school.id" :value="school.id">
                {{ school.name }} — {{ school.branch }}
              </option>
            </select>
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('employees.fields.baseSalary') }}</span>
            <CurrencyField
              v-model="form.baseSalary"
              required
            />
          </label>
          <label class="block space-y-1">
            <span class="ui-label">{{ $t('employees.fields.insuranceCost') }}</span>
            <CurrencyField
              v-model="form.insuranceCost"
              :min="0"
              required
            />
          </label>
          <div class="sm:col-span-2">
            <button
              type="submit"
              :disabled="!canSubmit"
              class="ui-btn-primary"
            >
              {{ isSubmitting ? $t('common.saving') : $t('employees.addEmployeeButton') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
