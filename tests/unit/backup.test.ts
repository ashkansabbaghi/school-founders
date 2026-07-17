import { beforeEach, describe, expect, it } from 'vitest'
import { AppError } from '#shared/errors/appError'
import { META_KEYS } from '#shared/types/meta'
import { getMetaValue, setMetaValue } from '~/db/repositories/meta'
import {
  BACKUP_SCHEMA_VERSION,
  LEGACY_BACKUP_SCHEMA_VERSION,
  createBackupPayload,
  importBackup,
  parseBackupFile,
  validateBackupPayload,
} from '~/services/backup'
import { seedTestData } from '../helpers/fixtures'
import { resetTestDatabase } from '../helpers/db'

describe('backup', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('validateBackupPayload rejects malformed payloads', () => {
    expect(() => validateBackupPayload(null)).toThrow(AppError)
    expect(() => validateBackupPayload({ schemaVersion: 99 })).toThrow(AppError)
  })

  it('parseBackupFile rejects invalid JSON', () => {
    expect(() => parseBackupFile('{not-json')).toThrow(AppError)
  })

  it('exports schema v2 payloads with active account metadata', async () => {
    await seedTestData()
    const exported = await createBackupPayload()

    expect(exported.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(exported.account).toEqual({
      id: 'test-account',
      name: 'Test Account',
      folderName: 'test-account',
    })
  })

  it('round-trips data through export and import', async () => {
    await seedTestData()
    await setMetaValue(META_KEYS.installId, 'install-test-123')
    await setMetaValue(META_KEYS.initialized, 'true')

    const exported = await createBackupPayload()
    const installId = await getMetaValue(META_KEYS.installId)

    expect(exported.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(exported.collections.founders).toHaveLength(2)

    await resetTestDatabase()
    await importBackup(exported, { preserveInstallId: installId ?? 'install-test-123' })

    const restored = await createBackupPayload()
    expect(restored.collections.schools).toEqual(exported.collections.schools)
    expect(restored.collections.students).toEqual(exported.collections.students)
    expect(restored.collections.founders).toEqual(exported.collections.founders)
    expect(await getMetaValue(META_KEYS.installId)).toBe('install-test-123')
  })

  it('imports legacy schema v1 payloads into the active account', async () => {
    await seedTestData()
    const exported = await createBackupPayload()
    const legacy = {
      ...exported,
      schemaVersion: LEGACY_BACKUP_SCHEMA_VERSION,
    }
    delete (legacy as { account?: unknown }).account

    const validated = validateBackupPayload(legacy)
    expect(validated.schemaVersion).toBe(LEGACY_BACKUP_SCHEMA_VERSION)
    expect(validated.account).toBeUndefined()

    await resetTestDatabase()
    await importBackup(legacy, { preserveInstallId: 'install-legacy' })

    const restored = await createBackupPayload()
    expect(restored.collections.schools).toEqual(exported.collections.schools)
    expect(restored.schemaVersion).toBe(BACKUP_SCHEMA_VERSION)
    expect(await getMetaValue(META_KEYS.installId)).toBe('install-legacy')
  })

  it('imports a hand-written legacy v1 file without account metadata', async () => {
    const legacyFile = {
      schemaVersion: LEGACY_BACKUP_SCHEMA_VERSION,
      dbVersion: 1,
      exportedAt: '2025-01-01T00:00:00.000Z',
      collections: {
        schools: [],
        students: [],
        employees: [],
        studentTransactions: [],
        employeeTransactions: [],
        fixedCosts: [],
        founders: [
          { id: 'legacy-founder', name: 'Legacy Founder', school: 'Legacy School' },
        ],
        meta: {
          installId: 'old-install',
          initialized: 'true',
          operatorName: 'Operator',
        },
      },
    }

    await importBackup(legacyFile, { preserveInstallId: 'current-install' })

    const restored = await createBackupPayload()
    expect(restored.collections.founders).toEqual([
      { id: 'legacy-founder', name: 'Legacy Founder', school: 'Legacy School' },
    ])
    // The importing install keeps its own id instead of the one in the file.
    expect(await getMetaValue(META_KEYS.installId)).toBe('current-install')
  })

  it('imports a v2 payload from another account into the active account', async () => {
    await seedTestData()
    const exported = await createBackupPayload()
    const foreign = structuredClone(exported)
    foreign.account = {
      id: 'other-account',
      name: 'Other Account',
      folderName: 'other-account',
    }

    await resetTestDatabase()
    await importBackup(foreign, { preserveInstallId: 'install-x' })

    const restored = await createBackupPayload()
    expect(restored.collections.schools).toEqual(exported.collections.schools)
    // Export reflects the active account, not the account stored in the file.
    expect(restored.account?.id).toBe('test-account')
  })

  it('rejects v2 payloads with malformed account metadata', async () => {
    await seedTestData()
    const exported = await createBackupPayload()

    const withBadAccount = structuredClone(exported) as Record<string, unknown>
    withBadAccount.account = { id: '', name: 'X', folderName: 'x' }
    expect(() => validateBackupPayload(withBadAccount)).toThrow(AppError)

    const withNonObjectAccount = structuredClone(exported) as Record<string, unknown>
    withNonObjectAccount.account = 'not-an-object'
    expect(() => validateBackupPayload(withNonObjectAccount)).toThrow(AppError)
  })

  it('rejects backups with broken foreign keys', async () => {
    await seedTestData()
    const exported = await createBackupPayload()
    const broken = structuredClone(exported)
    broken.collections.students[0]!.schoolId = 'missing-school'

    expect(() => validateBackupPayload(broken)).toThrow(AppError)
  })
})
