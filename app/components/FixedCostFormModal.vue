<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { FixedCost } from '#shared/types/financial'
import { translateApiError } from '~/utils/translateApiError'

const props = defineProps<{
  fixedCost?: FixedCost | null
}>()

const emit = defineEmits<{
  close: []
  saved: [cost: FixedCost]
}>()

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools, termYear } = storeToRefs(financeStore)
const { createFixedCost, updateFixedCost } = useFixedCosts()

const isEditing = computed(() => Boolean(props.fixedCost))

const form = reactive({
  schoolId: '',
  label: '',
  amount: '' as number | '',
})

const isSubmitting = ref(false)
const error = ref('')

const canSubmit = computed(() =>
  Boolean(
    form.schoolId
    && form.label.trim()
    && form.amount !== ''
    && Number(form.amount) > 0
    && !isSubmitting.value,
  ),
)

function resetForm() {
  form.schoolId = props.fixedCost?.schoolId ?? schools.value[0]?.id ?? ''
  form.label = props.fixedCost?.label ?? ''
  form.amount = props.fixedCost?.amount ?? ''
  error.value = ''
}

async function submit() {
  if (!canSubmit.value) {
    return
  }

  error.value = ''
  isSubmitting.value = true

  try {
    const payload = {
      schoolId: form.schoolId,
      label: form.label.trim(),
      amount: Number(form.amount),
    }

    const cost = isEditing.value && props.fixedCost
      ? await updateFixedCost(props.fixedCost.id, payload)
      : await createFixedCost(payload)

    resetForm()
    emit('saved', cost)
    emit('close')
  }
  catch (err) {
    error.value = translateApiError(err, t)
  }
  finally {
    isSubmitting.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

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
      :aria-label="isEditing ? $t('fixedCosts.editTitle') : $t('fixedCosts.addTitle')"
      class="ui-modal-panel max-w-xl sm:my-8"
    >
      <header class="ui-modal-header">
        <h2 class="text-lg font-semibold">
          {{ isEditing ? $t('fixedCosts.editTitle') : $t('fixedCosts.addTitle') }}
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
        <div
          v-if="error"
          class="ui-alert-error mb-4"
          role="alert"
        >
          {{ error }}
        </div>

        <form
          class="grid gap-4 sm:grid-cols-2"
          @submit.prevent="submit"
        >
          <label class="block space-y-1 sm:col-span-2">
            <span class="ui-label">{{ $t('fixedCosts.fields.school') }}</span>
            <select
              v-model="form.schoolId"
              required
              class="ui-input"
            >
              <option
                v-if="!schools.length"
                disabled
                value=""
              >
                {{ $t('operator.placeholders.selectSchool') }}
              </option>
              <option
                v-for="school in schools"
                :key="school.id"
                :value="school.id"
              >
                {{ school.name }} — {{ school.branch }}
              </option>
            </select>
          </label>

          <label class="block space-y-1">
            <span class="ui-label">{{ $t('fixedCosts.fields.label') }}</span>
            <input
              v-model="form.label"
              type="text"
              required
              class="ui-input"
              :placeholder="$t('fixedCosts.labelPlaceholder')"
            >
          </label>

          <label class="block space-y-1">
            <span class="ui-label">{{ $t('fixedCosts.fields.amount') }}</span>
            <CurrencyField
              v-model="form.amount"
              required
            />
          </label>

          <div class="block space-y-1 sm:col-span-2">
            <span class="ui-label">{{ $t('fixedCosts.fields.termYear') }}</span>
            <p class="text-sm ui-text-muted">
              {{ termYear }}
            </p>
          </div>

          <div class="sm:col-span-2">
            <button
              type="submit"
              :disabled="!canSubmit"
              class="ui-btn-primary"
            >
              {{ isSubmitting ? $t('common.saving') : (isEditing ? $t('common.save') : $t('fixedCosts.addTitle')) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
