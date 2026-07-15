<script setup lang="ts">
import { META_KEYS } from '#shared/types/meta'
import { loadProfileSettings, resetToDemoData } from '~/db/bootstrap'
import { getMetaValue } from '~/db/repositories/meta'
import {
  exportBackup,
  getStoragePersistenceInfo,
  importBackup,
  parseBackupFile,
  requestStoragePersistence,
  type StoragePersistenceInfo,
} from '~/services/backup'
import {
  getDirectoryBackupStatus,
  reconnectBackupDirectory,
  selectBackupDirectory,
  writeDirectoryBackup,
  type DirectoryBackupStatus,
} from '~/services/directoryBackup'
import { translateApiError } from '~/utils/translateApiError'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { refresh: refreshFounders } = useFounders()
const { $pwa } = useNuxtApp()

useHead({
  title: () => t('settings.title'),
})

const installId = ref('')
const lastBackupAt = ref<string | null>(null)
const storageInfo = ref<StoragePersistenceInfo>({
  supported: false,
  persisted: null,
  usageBytes: null,
  quotaBytes: null,
})

const status = ref<'idle' | 'loading' | 'submitting'>('idle')
const feedback = ref<{ kind: 'success' | 'error', message: string } | null>(null)
const copyState = ref<'idle' | 'copied'>('idle')

const importInput = ref<HTMLInputElement | null>(null)
const pendingImportFile = ref<File | null>(null)

const directoryStatus = ref<DirectoryBackupStatus>({
  supported: false,
  connected: false,
  directoryName: null,
  permission: null,
  lastWrittenAt: null,
  lastWrittenDate: null,
  lastError: null,
  connectedAt: null,
})

function clearFeedback() {
  feedback.value = null
}

function showError(error: unknown) {
  feedback.value = {
    kind: 'error',
    message: translateApiError(error, t),
  }
}

function showSuccess(messageKey: string) {
  feedback.value = {
    kind: 'success',
    message: t(messageKey),
  }
}

async function refreshProfileMeta() {
  const profile = await loadProfileSettings()
  installId.value = profile.installId
  lastBackupAt.value = await getMetaValue(META_KEYS.lastBackupAt)
}

async function refreshStorageInfo() {
  storageInfo.value = await getStoragePersistenceInfo()
}

async function refreshDirectoryBackupStatus() {
  directoryStatus.value = await getDirectoryBackupStatus()
}

async function refreshAll() {
  status.value = 'loading'
  clearFeedback()

  try {
    await financeStore.reload()
    await refreshProfileMeta()
    await refreshStorageInfo()
    await refreshDirectoryBackupStatus()
    status.value = 'idle'
  }
  catch (error) {
    status.value = 'idle'
    showError(error)
  }
}

async function copyInstallId() {
  if (!installId.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(installId.value)
    copyState.value = 'copied'
    window.setTimeout(() => {
      copyState.value = 'idle'
    }, 2000)
  }
  catch {
    showError(new Error(t('settings.profile.copyFailed')))
  }
}

async function handleExport() {
  status.value = 'submitting'
  clearFeedback()

  try {
    const payload = await exportBackup()
    lastBackupAt.value = payload.exportedAt
    showSuccess('messages.backupExported')
    status.value = 'idle'
  }
  catch (error) {
    status.value = 'idle'
    showError(error)
  }
}

function openImportPicker() {
  importInput.value?.click()
}

function onImportFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''

  if (!file) {
    return
  }

  pendingImportFile.value = file
}

async function confirmImport() {
  const file = pendingImportFile.value

  if (!file) {
    return
  }

  status.value = 'submitting'
  clearFeedback()

  try {
    const content = await file.text()
    const raw = parseBackupFile(content)
    await importBackup(raw, { preserveInstallId: installId.value })
    pendingImportFile.value = null
    await refreshAll()
    await refreshFounders()
    showSuccess('messages.backupImported')
    status.value = 'idle'
  }
  catch (error) {
    status.value = 'idle'
    showError(error)
  }
}

function cancelImport() {
  pendingImportFile.value = null
}

function isUserCancelledPicker(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function handleSelectFolder() {
  status.value = 'submitting'
  clearFeedback()

  try {
    directoryStatus.value = await selectBackupDirectory()
    lastBackupAt.value = directoryStatus.value.lastWrittenAt
    showSuccess('messages.directoryBackupSaved')
    status.value = 'idle'
  }
  catch (error) {
    status.value = 'idle'

    if (!isUserCancelledPicker(error)) {
      await refreshDirectoryBackupStatus()
      showError(error)
    }
  }
}

async function handleReconnectFolder() {
  status.value = 'submitting'
  clearFeedback()

  try {
    directoryStatus.value = await reconnectBackupDirectory()
    showSuccess('messages.directoryBackupReconnected')
    status.value = 'idle'
  }
  catch (error) {
    status.value = 'idle'
    await refreshDirectoryBackupStatus()
    showError(error)
  }
}

async function handleSaveToFolder() {
  status.value = 'submitting'
  clearFeedback()

  try {
    await writeDirectoryBackup()
    await refreshDirectoryBackupStatus()
    lastBackupAt.value = directoryStatus.value.lastWrittenAt
    showSuccess('messages.directoryBackupSaved')
    status.value = 'idle'
  }
  catch (error) {
    status.value = 'idle'
    await refreshDirectoryBackupStatus()
    showError(error)
  }
}

async function handleResetToDemo() {
  if (!window.confirm(t('settings.backup.resetConfirm'))) {
    return
  }

  status.value = 'submitting'
  clearFeedback()

  try {
    const profile = await resetToDemoData()
    installId.value = profile.installId
    financeStore.setUserName(profile.userName)
    financeStore.setTermYear(profile.termYear, { immediate: true })
    await financeStore.reload()
    await refreshFounders()
    showSuccess('messages.demoReset')
    status.value = 'idle'
  }
  catch (error) {
    status.value = 'idle'
    showError(error)
  }
}

async function handleRequestPersistence() {
  status.value = 'submitting'
  clearFeedback()

  try {
    const granted = await requestStoragePersistence()
    await refreshStorageInfo()

    if (granted || storageInfo.value.persisted) {
      showSuccess('settings.storage.persistGranted')
    }
    else {
      showSuccess('settings.storage.persistDenied')
    }

    status.value = 'idle'
  }
  catch (error) {
    status.value = 'idle'
    showError(error)
  }
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) {
    return '—'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTimestamp(iso: string | null): string {
  if (!iso) {
    return t('settings.backup.never')
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const storageUsageLabel = computed(() => {
  if (!storageInfo.value.supported) {
    return t('settings.storage.unsupported')
  }

  return t('settings.storage.usage', {
    used: formatBytes(storageInfo.value.usageBytes),
    quota: formatBytes(storageInfo.value.quotaBytes),
  })
})

const persistenceStatusLabel = computed(() => {
  if (!storageInfo.value.supported) {
    return t('settings.storage.unsupported')
  }

  if (storageInfo.value.persisted) {
    return t('settings.storage.persisted')
  }

  return t('settings.storage.notPersisted')
})

const isPwaInstalled = computed(() => Boolean($pwa?.isPWAInstalled))
const canInstallPwa = computed(() => Boolean($pwa?.showInstallPrompt))

const installPlatform = computed<'ios' | 'android' | 'desktop'>(() => {
  if (!import.meta.client) {
    return 'desktop'
  }

  const ua = navigator.userAgent

  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios'
  }

  if (/Android/i.test(ua)) {
    return 'android'
  }

  return 'desktop'
})

const installStatusLabel = computed(() => {
  if (isPwaInstalled.value) {
    return t('settings.pwa.installed')
  }

  if (canInstallPwa.value) {
    return t('settings.pwa.installAvailable')
  }

  return t('settings.pwa.installDismissed')
})

const folderConnectionLabel = computed(() => {
  if (!directoryStatus.value.connected || !directoryStatus.value.directoryName) {
    return t('settings.backup.folder.notConnected')
  }

  return t('settings.backup.folder.connectedFolder', {
    name: directoryStatus.value.directoryName,
  })
})

const folderPermissionLabel = computed(() => {
  if (!directoryStatus.value.connected || !directoryStatus.value.permission) {
    return '—'
  }

  const permissionKey = {
    granted: 'settings.backup.folder.permissionGranted',
    denied: 'settings.backup.folder.permissionDenied',
    prompt: 'settings.backup.folder.permissionPrompt',
  }[directoryStatus.value.permission]

  return t(permissionKey)
})

const needsFolderReconnect = computed(() =>
  directoryStatus.value.connected
  && directoryStatus.value.permission !== 'granted',
)

const canSaveToFolder = computed(() =>
  directoryStatus.value.connected
  && directoryStatus.value.permission === 'granted',
)

async function handleInstallPwa() {
  clearFeedback()

  try {
    await $pwa?.install()
  }
  catch (error) {
    showError(error)
  }
}

onMounted(() => {
  void refreshAll()
})
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
    <header class="ui-page-header">
      <h1 class="ui-page-title">
        {{ $t('settings.title') }}
      </h1>
      <p class="ui-page-subtitle">
        {{ $t('settings.subtitle') }}
      </p>
    </header>

    <div
      v-if="feedback"
      class="rounded-lg border px-4 py-3 text-sm"
      :class="feedback.kind === 'success'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'"
      role="status"
    >
      {{ feedback.message }}
    </div>

    <section class="ui-card space-y-4 p-6">
      <div>
        <h2 class="ui-section-header">
          {{ $t('settings.profile.title') }}
        </h2>
        <p class="mt-1 text-sm ui-text-muted">
          {{ $t('settings.profile.subtitle') }}
        </p>
      </div>

      <div class="space-y-1">
        <span class="ui-label">{{ $t('settings.profile.installId') }}</span>
        <div class="flex gap-2">
          <input
            :value="installId"
            type="text"
            class="ui-input font-mono text-xs"
            readonly
          >
          <button
            type="button"
            class="ui-btn-secondary shrink-0"
            :disabled="!installId"
            @click="copyInstallId"
          >
            {{ copyState === 'copied' ? $t('settings.profile.copied') : $t('settings.profile.copy') }}
          </button>
        </div>
        <p class="text-xs text-zinc-500">
          {{ $t('settings.profile.installIdHint') }}
        </p>
      </div>
    </section>

    <section class="ui-card space-y-4 p-6">
      <div>
        <h2 class="ui-section-header">
          {{ $t('settings.storage.title') }}
        </h2>
        <p class="mt-1 text-sm ui-text-muted">
          {{ $t('settings.storage.subtitle') }}
        </p>
      </div>

      <div
        class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
        role="note"
      >
        {{ $t('settings.storage.warning') }}
      </div>

      <dl class="grid gap-3 text-sm sm:grid-cols-2">
        <div class="ui-inset-panel px-4 py-3">
          <dt class="text-zinc-500">
            {{ $t('settings.storage.persistenceStatus') }}
          </dt>
          <dd class="mt-1 font-medium text-zinc-200">
            {{ persistenceStatusLabel }}
          </dd>
        </div>
        <div class="ui-inset-panel px-4 py-3">
          <dt class="text-zinc-500">
            {{ $t('settings.storage.usageLabel') }}
          </dt>
          <dd class="mt-1 font-medium text-zinc-200">
            {{ storageUsageLabel }}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        class="ui-btn-secondary"
        :disabled="!storageInfo.supported || storageInfo.persisted === true || status === 'submitting'"
        @click="handleRequestPersistence"
      >
        {{ $t('settings.storage.requestPersist') }}
      </button>
    </section>

    <section class="ui-card space-y-4 p-6">
      <div>
        <h2 class="ui-section-header">
          {{ $t('settings.pwa.title') }}
        </h2>
        <p class="mt-1 text-sm ui-text-muted">
          {{ $t('settings.pwa.subtitle') }}
        </p>
      </div>

      <p class="text-sm ui-text-secondary">
        {{ installStatusLabel }}
      </p>

      <button
        v-if="canInstallPwa && !isPwaInstalled"
        type="button"
        class="ui-btn-primary"
        @click="handleInstallPwa"
      >
        {{ $t('settings.pwa.installAction') }}
      </button>

      <div class="space-y-4 text-sm ui-text-muted">
        <div v-if="installPlatform === 'ios'" class="space-y-2">
          <h3 class="font-medium ui-text-secondary">
            {{ $t('settings.pwa.iosTitle') }}
          </h3>
          <ol class="list-decimal space-y-1 ps-5">
            <li>{{ $t('settings.pwa.iosStep1') }}</li>
            <li>{{ $t('settings.pwa.iosStep2') }}</li>
            <li>{{ $t('settings.pwa.iosStep3') }}</li>
          </ol>
        </div>

        <div v-else-if="installPlatform === 'android'" class="space-y-2">
          <h3 class="font-medium ui-text-secondary">
            {{ $t('settings.pwa.androidTitle') }}
          </h3>
          <ol class="list-decimal space-y-1 ps-5">
            <li>{{ $t('settings.pwa.androidStep1') }}</li>
            <li>{{ $t('settings.pwa.androidStep2') }}</li>
          </ol>
        </div>

        <div v-else class="space-y-2">
          <h3 class="font-medium ui-text-secondary">
            {{ $t('settings.pwa.desktopTitle') }}
          </h3>
          <ol class="list-decimal space-y-1 ps-5">
            <li>{{ $t('settings.pwa.desktopStep1') }}</li>
            <li>{{ $t('settings.pwa.desktopStep2') }}</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="ui-card space-y-4 p-6">
      <div>
        <h2 class="ui-section-header">
          {{ $t('settings.backup.title') }}
        </h2>
        <p class="mt-1 text-sm ui-text-muted">
          {{ $t('settings.backup.subtitle') }}
        </p>
      </div>

      <p class="text-sm ui-text-muted">
        {{ $t('settings.backup.lastBackup', { date: formatTimestamp(lastBackupAt) }) }}
      </p>

      <div class="space-y-4 ui-inset-panel">
        <div>
          <h3 class="text-sm font-medium ui-text-secondary">
            {{ $t('settings.backup.folder.title') }}
          </h3>
          <p class="mt-1 text-sm ui-text-muted">
            {{ $t('settings.backup.folder.subtitle') }}
          </p>
        </div>

        <div
          v-if="!directoryStatus.supported"
          class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
          role="note"
        >
          {{ $t('settings.backup.folder.unsupported') }}
        </div>

        <template v-else>
          <dl class="grid gap-3 text-sm sm:grid-cols-2">
            <div class="ui-inset-panel px-4 py-3">
              <dt class="text-zinc-500">
                {{ $t('settings.backup.folder.folderLabel') }}
              </dt>
              <dd class="mt-1 font-medium text-zinc-200">
                {{ folderConnectionLabel }}
              </dd>
            </div>
            <div class="ui-inset-panel px-4 py-3">
              <dt class="text-zinc-500">
                {{ $t('settings.backup.folder.permissionLabel') }}
              </dt>
              <dd
                class="mt-1 font-medium"
                :class="directoryStatus.permission === 'granted'
                  ? 'text-emerald-300'
                  : directoryStatus.permission === 'denied'
                    ? 'text-rose-300'
                    : 'text-amber-300'"
              >
                {{ folderPermissionLabel }}
              </dd>
            </div>
            <div
              v-if="directoryStatus.connected"
              class="ui-inset-panel px-4 py-3 sm:col-span-2"
            >
              <dt class="text-zinc-500">
                {{ $t('settings.backup.folder.lastFolderSave') }}
              </dt>
              <dd class="mt-1 font-medium text-zinc-200">
                {{ formatTimestamp(directoryStatus.lastWrittenAt) }}
              </dd>
            </div>
          </dl>

          <div
            v-if="directoryStatus.lastError"
            class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            role="alert"
          >
            <span class="font-medium">{{ $t('settings.backup.folder.lastError') }}:</span>
            {{ directoryStatus.lastError }}
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              v-if="!directoryStatus.connected"
              type="button"
              class="ui-btn-primary"
              :disabled="status === 'submitting'"
              @click="handleSelectFolder"
            >
              {{ $t('settings.backup.folder.selectFolder') }}
            </button>

            <template v-else>
              <button
                v-if="needsFolderReconnect"
                type="button"
                class="ui-btn-primary"
                :disabled="status === 'submitting'"
                @click="handleReconnectFolder"
              >
                {{ $t('settings.backup.folder.reconnect') }}
              </button>

              <button
                v-if="canSaveToFolder"
                type="button"
                class="ui-btn-primary"
                :disabled="status === 'submitting'"
                @click="handleSaveToFolder"
              >
                {{ status === 'submitting' ? $t('common.saving') : $t('settings.backup.folder.saveNow') }}
              </button>

              <button
                type="button"
                class="ui-btn-secondary"
                :disabled="status === 'submitting'"
                @click="handleSelectFolder"
              >
                {{ $t('settings.backup.folder.changeFolder') }}
              </button>
            </template>
          </div>
        </template>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="ui-btn-primary"
          :disabled="status === 'submitting'"
          @click="handleExport"
        >
          {{ status === 'submitting' ? $t('common.saving') : $t('settings.backup.export') }}
        </button>

        <button
          type="button"
          class="ui-btn-secondary"
          :disabled="status === 'submitting'"
          @click="openImportPicker"
        >
          {{ $t('settings.backup.import') }}
        </button>

        <input
          ref="importInput"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="onImportFileSelected"
        >
      </div>

      <div
        v-if="pendingImportFile"
        class="space-y-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4"
      >
        <p class="text-sm text-zinc-200">
          {{ $t('settings.backup.importConfirm', { filename: pendingImportFile.name }) }}
        </p>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="ui-btn-danger"
            :disabled="status === 'submitting'"
            @click="confirmImport"
          >
            {{ $t('settings.backup.importConfirmAction') }}
          </button>
          <button
            type="button"
            class="ui-btn-secondary"
            :disabled="status === 'submitting'"
            @click="cancelImport"
          >
            {{ $t('settings.backup.importCancel') }}
          </button>
        </div>
      </div>

      <div class="ui-divider-t-only pt-4">
        <h3 class="mb-2 text-sm font-medium ui-text-secondary">
          {{ $t('settings.backup.resetTitle') }}
        </h3>
        <p class="mb-3 text-sm ui-text-muted">
          {{ $t('settings.backup.resetSubtitle') }}
        </p>
        <button
          type="button"
          class="ui-btn-danger"
          :disabled="status === 'submitting'"
          @click="handleResetToDemo"
        >
          {{ $t('settings.backup.reset') }}
        </button>
      </div>
    </section>
  </main>
</template>
