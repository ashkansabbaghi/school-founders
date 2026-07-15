<script setup lang="ts">
import { currentJalaliYear, formatTermYear, parseTermYear } from '#shared/utils/jalaliDate'

const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  id?: string
  required?: boolean
  compact?: boolean
}>(), {
  required: false,
  compact: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const showPicker = ref(false)
const listRef = ref<HTMLElement | null>(null)

const YEAR_FROM = 1393

const years = computed(() => {
  const yearTo = currentJalaliYear() + 1
  return Array.from({ length: yearTo - YEAR_FROM + 1 }, (_, index) => YEAR_FROM + index)
})

const selectedStartYear = computed(() => parseTermYear(props.modelValue).start)

function selectYear(year: number) {
  emit('update:modelValue', formatTermYear(year))
  showPicker.value = false
}

function openPicker() {
  showPicker.value = true
}

function closePicker() {
  showPicker.value = false
}

function scrollToSelectedYear() {
  nextTick(() => {
    const selected = listRef.value?.querySelector('.academic-year-field__year--selected')
    selected?.scrollIntoView({ block: 'center' })
  })
}

watch(showPicker, (open) => {
  if (open) {
    scrollToSelectedYear()
  }
})
</script>

<template>
  <div
    class="academic-year-field"
    :class="{ 'academic-year-field--compact': compact }"
  >
      <input
        :id="id"
        :value="modelValue"
        type="text"
        readonly
        class="academic-year-field__input"
        :placeholder="$t('academicYear.placeholder')"
        :aria-label="$t('academicYear.label')"
        @click="openPicker"
        @keydown.enter.prevent="openPicker"
      >

    <Teleport to="body">
      <div
        v-if="showPicker"
        class="academic-year-field__overlay"
        @click="closePicker"
      />

      <div
        v-if="showPicker"
        class="academic-year-field__dialog"
        role="dialog"
        :aria-label="t('academicYear.label')"
      >
        <ul
          ref="listRef"
          class="academic-year-field__years"
        >
          <li
            v-for="year in years"
            :key="year"
            class="academic-year-field__year"
            :class="{ 'academic-year-field__year--selected': String(year) === selectedStartYear }"
          >
            <button
              type="button"
              class="academic-year-field__year-button"
              @click="selectYear(year)"
            >
              {{ formatTermYear(year) }}
            </button>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.academic-year-field__control {
  position: relative;
}

.academic-year-field__input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border-strong);
  background-color: var(--app-surface-input);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--app-text);
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.academic-year-field__input::placeholder {
  color: var(--app-text-muted);
}

.academic-year-field__input:focus {
  border-color: rgb(139 92 246);
  outline: none;
  box-shadow: 0 0 0 1px rgb(139 92 246);
}

.academic-year-field__overlay {
  position: fixed;
  inset: 0;
  z-index: 119;
  background: var(--app-modal-overlay);
}

.academic-year-field__dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 120;
  display: flex;
  max-height: min(24rem, calc(100vh - 2rem));
  width: min(16rem, calc(100vw - 2rem));
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  box-shadow: 0 10px 40px rgb(0 0 0 / 0.12);
  transform: translate(-50%, -50%);
}

:global(html.dark) .academic-year-field__dialog {
  box-shadow: 0 10px 40px rgb(0 0 0 / 0.45);
}

.academic-year-field__years {
  margin: 0;
  overflow-y: auto;
  padding: 0.5rem;
  list-style: none;
}

.academic-year-field__year {
  margin: 0;
}

.academic-year-field__year-button {
  width: 100%;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--app-text-secondary);
  transition: background-color 150ms ease, color 150ms ease;
}

.academic-year-field__year-button:hover {
  background: rgb(139 92 246 / 0.2);
  color: var(--app-text);
}

.academic-year-field__year--selected .academic-year-field__year-button {
  background: rgb(139 92 246 / 0.2);
  color: var(--app-text);
}

.academic-year-field--compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.academic-year-field--compact .ui-label {
  font-size: 0.75rem;
  line-height: 1rem;
  white-space: nowrap;
}

.academic-year-field--compact .academic-year-field__control {
  min-width: 0;
  flex: 1;
}

.academic-year-field--compact .academic-year-field__input {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
}
</style>
