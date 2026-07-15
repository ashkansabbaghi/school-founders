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

const colorMode = useColorMode()

const pickerStyles = computed(() => {
  const isDark = colorMode.value === 'dark'

  return {
    'primary-color': '#8b5cf6',
    'secondary-color': 'rgba(139, 92, 246, 0.15)',
    'in-range-background': 'rgba(139, 92, 246, 0.2)',
    'text-color': isDark ? '#e4e4e7' : '#3f3f46',
    'hover-color': isDark ? '#fafafa' : '#18181b',
    background: isDark ? '#27272a' : '#ffffff',
    'border-color': isDark ? '#52525b' : '#d4d4d8',
    'icon-background': isDark ? '#3f3f46' : '#f4f4f5',
    'overlay-color': isDark ? 'rgba(9, 9, 11, 0.75)' : 'rgba(0, 0, 0, 0.4)',
    'main-box-shadow': isDark
      ? '0 10px 40px rgba(0, 0, 0, 0.45)'
      : '0 10px 40px rgba(0, 0, 0, 0.12)',
    radius: '0.5rem',
    'z-index': '120',
  }
})

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
      :styles="pickerStyles"
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
  border: 1px solid var(--app-border-strong);
  background-color: var(--app-surface-input);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--app-text);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.persian-date-field :deep(.pdp-input::placeholder) {
  color: var(--app-text-muted);
}

.persian-date-field :deep(.pdp-input:focus) {
  border-color: rgb(139 92 246);
  outline: none;
  box-shadow: 0 0 0 1px rgb(139 92 246);
}

.persian-date-field :deep(.pdp-icon.pdp-inside) {
  color: var(--app-text-muted);
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
