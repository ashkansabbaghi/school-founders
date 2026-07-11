import { beforeEach, describe, expect, it } from 'vitest'
import { AppError } from '#shared/errors/appError'
import { META_KEYS } from '#shared/types/meta'
import { seedDemoData } from '~/db/bootstrap'
import { getMetaValue, setMetaValue } from '~/db/repositories/meta'
import {
  BACKUP_SCHEMA_VERSION,
  createBackupPayload,
  importBackup,
  parseBackupFile,
  validateBackupPayload,
} from '~/services/backup'
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

  it('round-trips demo data through export and import', async () => {
    await seedDemoData()
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

  it('rejects backups with broken foreign keys', async () => {
    await seedDemoData()
    const exported = await createBackupPayload()
    const broken = structuredClone(exported)
    broken.collections.students[0]!.schoolId = 'missing-school'

    expect(() => validateBackupPayload(broken)).toThrow(AppError)
  })
})
