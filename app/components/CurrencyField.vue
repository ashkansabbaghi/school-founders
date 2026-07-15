<script setup lang="ts">
import {
  formatAmountDisplay,
  formatAmountInPersianWords,
  parseAmountDigits,
} from '#shared/utils/currencyAmount'

const props = withDefaults(defineProps<{
  modelValue: number | ''
  id?: string
  required?: boolean
  disabled?: boolean
  min?: number
}>(), {
  required: false,
  disabled: false,
  min: 1,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | '']
}>()

const { locale } = useI18n()

const inputRef = ref<HTMLInputElement | null>(null)
const displayValue = ref('')

const displayLocale = computed(() => (locale.value === 'fa' ? 'fa' : 'en') as 'fa' | 'en')

const wordsHint = computed(() => {
  if (props.modelValue === '' || props.modelValue <= 0) {
    return ''
  }

  return formatAmountInPersianWords(props.modelValue)
})

function syncDisplayFromModel() {
  displayValue.value = formatAmountDisplay(props.modelValue, displayLocale.value)
}

watch(() => props.modelValue, syncDisplayFromModel, { immediate: true })
watch(displayLocale, syncDisplayFromModel)

function countDigitsBeforeCursor(raw: string, cursorPos: number): number {
  const parsed = parseAmountDigits(raw.slice(0, cursorPos))

  if (parsed === '') {
    return 0
  }

  return String(parsed).length
}

function cursorAfterDigitCount(formatted: string, digitCount: number): number {
  if (digitCount <= 0) {
    return 0
  }

  let seen = 0

  for (let index = 0; index < formatted.length; index += 1) {
    if (/[0-9۰-۹٠-٩]/.test(formatted[index]!)) {
      seen += 1

      if (seen >= digitCount) {
        return index + 1
      }
    }
  }

  return formatted.length
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const raw = input.value
  const cursorPos = input.selectionStart ?? raw.length
  const digitsBeforeCursor = countDigitsBeforeCursor(raw, cursorPos)
  const parsed = parseAmountDigits(raw)

  emit('update:modelValue', parsed)

  const formatted = formatAmountDisplay(parsed, displayLocale.value)
  displayValue.value = formatted

  nextTick(() => {
    if (!inputRef.value) {
      return
    }

    const nextCursor = cursorAfterDigitCount(formatted, digitsBeforeCursor)
    inputRef.value.setSelectionRange(nextCursor, nextCursor)
  })
}
</script>

<template>
  <div class="currency-field">
    <input
      :id="id"
      ref="inputRef"
      :value="displayValue"
      type="text"
      inputmode="numeric"
      :required="required"
      :disabled="disabled"
      class="ui-input disabled:cursor-not-allowed disabled:opacity-50"
      @input="onInput"
    >
    <p v-if="wordsHint" class="text-xs text-zinc-500">
      {{ wordsHint }}
    </p>
  </div>
</template>
