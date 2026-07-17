<script setup lang="ts">
const props = defineProps<{
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
}>()

const modelValue = defineModel<string>({ default: '' })

const { t } = useI18n()

const placeholderText = computed(() => props.placeholder ?? t('common.searchPlaceholder'))
const ariaLabelText = computed(() => props.ariaLabel ?? t('common.search'))
</script>

<template>
  <input
    v-model="modelValue"
    type="search"
    class="ui-input"
    :placeholder="placeholderText"
    :aria-label="ariaLabelText"
    :disabled="disabled"
  >
</template>
