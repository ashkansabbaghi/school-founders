<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  id?: string
  required?: boolean
  compact?: boolean
  disabled?: boolean
}>(), {
  required: false,
  compact: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// const pickerStyles = {
//   'primary-color': '#8b5cf6',
//   'secondary-color': 'rgba(139, 92, 246, 0.15)',
//   'in-range-background': 'rgba(139, 92, 246, 0.2)',
//   'text-color': '#e4e4e7',
//   'hover-color': '#fafafa',
//   background: '#27272a',
//   'border-color': '#52525b',
//   'icon-background': '#3f3f46',
//   'overlay-color': 'rgba(9, 9, 11, 0.75)',
//   'main-box-shadow': '0 10px 40px rgba(0, 0, 0, 0.45)',
//   radius: '0.5rem',
//   'z-index': 120,
// } as const

function onUpdate(value: string | string[]) {
  const nextValue = Array.isArray(value) ? value[0] : value
  emit('update:modelValue', nextValue ?? '')
}
</script>

<template>
  <div
    class="persian-date-field"
    :class="{ 'persian-date-field--compact': compact, 'persian-date-field--disabled': disabled }"
  >
    <DatePicker
      :id="id"
      :model-value="modelValue"
      :column="1"
      :label="label"
      mode="single"
      type="date"
      format="YYYY-MM-DD"
      input-format="jYYYY/jMM/jDD"
      display-format="jD jMMMM jYYYY"
      locale="fa"
      color="purple"
      :auto-submit="false"
      :modal="true"
      :clearable="!required"
      :icon-inside="true"
      @update:model-value="onUpdate"
    >
    </DatePicker>
  </div>
</template>

<style scoped>
.persian-date-field :deep(.pdp) {
  width: 100%;
}

.persian-date-field :deep(.pdp-input) {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(63 63 70 / 0.8);
  background: rgb(39 39 42 / 0.5);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: rgb(244 244 245);
}

.persian-date-field :deep(.pdp-input:focus) {
  border-color: rgb(139 92 246);
  outline: none;
  box-shadow: 0 0 0 1px rgb(139 92 246);
}

.persian-date-field--compact :deep(.pdp-input) {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
}

.persian-date-field--compact :deep(.pdp-icon) {
  padding: 0.25rem;
}

.persian-date-field--disabled :deep(.pdp-input) {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
