<script setup lang="ts">
import type { Account } from '#shared/types/account'
import {
  createInitializedAccount,
  deleteAccount,
  getAccountLastBackupAt,
  getActiveAccountId,
  listAccounts,
  renameAccountDisplayName,
  switchActiveAccount,
} from '~/services/accountContext'
import { translateApiError } from '~/utils/translateApiError'

const emit = defineEmits<{ switched: [] }>()

const { t } = useI18n()
const { show: showToast } = useAppToast()

const accounts = ref<Account[]>([])
const activeAccountId = ref<string | null>(null)
const lastBackupByAccount = ref<Record<string, string | null>>({})
const busy = ref(false)

const newAccountName = ref('')
const renamingAccountId = ref<string | null>(null)
const renameValue = ref('')
const deletingAccountId = ref<string | null>(null)

const canDeleteAccounts = computed(() => accounts.value.length > 1)
const canCreate = computed(() => Boolean(newAccountName.value.trim()) && !busy.value)

const deletingAccount = computed(() =>
  accounts.value.find(account => account.id === deletingAccountId.value) ?? null,
)

function showError(error: unknown) {
  showToast('error', translateApiError(error, t))
}

function formatTimestamp(iso: string | null): string {
  if (!iso) {
    return t('settings.accounts.never')
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

async function refresh() {
  const [list, activeId] = await Promise.all([
    listAccounts(),
    getActiveAccountId(),
  ])

  accounts.value = list
  activeAccountId.value = activeId

  const backups: Record<string, string | null> = {}

  await Promise.all(list.map(async (account) => {
    try {
      backups[account.id] = await getAccountLastBackupAt(account.id)
    }
    catch {
      backups[account.id] = null
    }
  }))

  lastBackupByAccount.value = backups
}

async function handleCreate() {
  if (!canCreate.value) {
    return
  }

  busy.value = true

  try {
    await createInitializedAccount(newAccountName.value)
    newAccountName.value = ''
    await refresh()
    showToast('success', t('messages.accountCreated'))
  }
  catch (error) {
    showError(error)
  }
  finally {
    busy.value = false
  }
}

async function handleSwitch(account: Account) {
  if (busy.value || account.id === activeAccountId.value) {
    return
  }

  busy.value = true

  try {
    await switchActiveAccount(account.id)
    await refresh()
    emit('switched')
    showToast('success', t('messages.accountSwitched', { name: account.name }))
  }
  catch (error) {
    showError(error)
  }
  finally {
    busy.value = false
  }
}

function startRename(account: Account) {
  deletingAccountId.value = null
  renamingAccountId.value = account.id
  renameValue.value = account.name
}

function cancelRename() {
  renamingAccountId.value = null
  renameValue.value = ''
}

async function confirmRename() {
  const accountId = renamingAccountId.value

  if (!accountId || !renameValue.value.trim() || busy.value) {
    return
  }

  busy.value = true

  try {
    await renameAccountDisplayName(accountId, renameValue.value)
    cancelRename()
    await refresh()
    showToast('success', t('messages.accountRenamed'))
  }
  catch (error) {
    showError(error)
  }
  finally {
    busy.value = false
  }
}

function startDelete(account: Account) {
  renamingAccountId.value = null
  deletingAccountId.value = account.id
}

function cancelDelete() {
  deletingAccountId.value = null
}

async function confirmDelete() {
  const account = deletingAccount.value

  if (!account || busy.value) {
    return
  }

  busy.value = true

  try {
    // Deleting the active account: activate another one first so the app
    // never points at a deleted database.
    if (account.id === activeAccountId.value) {
      const fallback = accounts.value.find(entry => entry.id !== account.id)

      if (fallback) {
        await switchActiveAccount(fallback.id, { skipBackup: true })
        emit('switched')
      }
    }

    await deleteAccount(account.id)
    deletingAccountId.value = null
    await refresh()
    showToast('success', t('messages.accountDeleted'))
  }
  catch (error) {
    showError(error)
  }
  finally {
    busy.value = false
  }
}

onMounted(() => {
  void refresh().catch(showError)
})
</script>

<template>
  <section class="ui-card space-y-4 p-6">
    <div>
      <h2 class="ui-section-header">
        {{ $t('settings.accounts.title') }}
      </h2>
      <p class="mt-1 text-sm ui-text-muted">
        {{ $t('settings.accounts.subtitle') }}
      </p>
    </div>

    <ul class="space-y-3">
      <li
        v-for="account in accounts"
        :key="account.id"
        class="space-y-3 ui-inset-panel"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="flex items-center gap-2 font-medium ui-text-secondary">
              <span class="truncate">{{ account.name }}</span>
              <span
                v-if="account.id === activeAccountId"
                class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400"
              >
                {{ $t('settings.accounts.activeBadge') }}
              </span>
            </p>
            <p class="mt-1 text-xs ui-text-muted" dir="ltr">
              {{ account.folderName }}
            </p>
            <p class="mt-1 text-xs ui-text-muted">
              {{ $t('settings.accounts.lastBackup', {
                date: formatTimestamp(lastBackupByAccount[account.id] ?? null),
              }) }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-if="account.id !== activeAccountId"
              type="button"
              class="ui-btn-primary"
              :disabled="busy"
              @click="handleSwitch(account)"
            >
              {{ $t('settings.accounts.switchAction') }}
            </button>
            <button
              type="button"
              class="ui-btn-secondary"
              :disabled="busy"
              @click="startRename(account)"
            >
              {{ $t('settings.accounts.renameAction') }}
            </button>
            <button
              v-if="canDeleteAccounts"
              type="button"
              class="ui-btn-danger"
              :disabled="busy"
              @click="startDelete(account)"
            >
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>

        <form
          v-if="renamingAccountId === account.id"
          class="flex flex-wrap items-center gap-2"
          @submit.prevent="confirmRename"
        >
          <label class="sr-only" :for="`rename-account-${account.id}`">
            {{ $t('settings.accounts.renameLabel') }}
          </label>
          <input
            :id="`rename-account-${account.id}`"
            v-model="renameValue"
            type="text"
            class="ui-input max-w-xs"
            :placeholder="$t('settings.accounts.namePlaceholder')"
            required
          >
          <button
            type="submit"
            class="ui-btn-primary"
            :disabled="busy || !renameValue.trim()"
          >
            {{ $t('common.save') }}
          </button>
          <button
            type="button"
            class="ui-btn-secondary"
            :disabled="busy"
            @click="cancelRename"
          >
            {{ $t('settings.accounts.cancel') }}
          </button>
        </form>

        <div
          v-if="deletingAccountId === account.id"
          class="space-y-3 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4"
        >
          <p class="text-sm ui-text-secondary">
            {{ $t('settings.accounts.deleteConfirm', { name: account.name }) }}
          </p>
          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="ui-btn-danger"
              :disabled="busy"
              @click="confirmDelete"
            >
              {{ $t('settings.accounts.deleteConfirmAction') }}
            </button>
            <button
              type="button"
              class="ui-btn-secondary"
              :disabled="busy"
              @click="cancelDelete"
            >
              {{ $t('settings.accounts.cancel') }}
            </button>
          </div>
        </div>
      </li>
    </ul>

    <form
      class="space-y-2 ui-inset-panel"
      @submit.prevent="handleCreate"
    >
      <label class="ui-label" for="new-account-name">
        {{ $t('settings.accounts.createLabel') }}
      </label>
      <div class="flex flex-wrap items-center gap-2">
        <input
          id="new-account-name"
          v-model="newAccountName"
          type="text"
          class="ui-input max-w-xs"
          :placeholder="$t('settings.accounts.namePlaceholder')"
          required
        >
        <button
          type="submit"
          class="ui-btn-primary"
          :disabled="!canCreate"
        >
          {{ busy ? $t('common.saving') : $t('settings.accounts.createAction') }}
        </button>
      </div>
      <p class="text-xs ui-text-muted">
        {{ $t('settings.accounts.createHint') }}
      </p>
    </form>
  </section>
</template>
