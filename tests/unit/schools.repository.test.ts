import { beforeEach, describe, expect, it } from 'vitest'
import { AppError } from '#shared/errors/appError'
import { listSchools, removeSchool, saveSchool } from '~/db/repositories/schools'
import { resetTestDatabase } from '../helpers/db'

describe('schools repository', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('creates and lists schools', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main Branch' })

    expect(school.id).toBeTruthy()
    expect(school.name).toBe('Test School')
    expect(school.branch).toBe('Main Branch')

    const schools = await listSchools()
    expect(schools).toHaveLength(1)
    expect(schools[0]?.name).toBe('Test School')
  })

  it('updates an existing school', async () => {
    const school = await saveSchool({ name: 'Old Name', branch: 'Branch A' })
    const updated = await saveSchool({ id: school.id, name: 'New Name', branch: 'Branch B' })

    expect(updated.id).toBe(school.id)
    expect(updated.name).toBe('New Name')
    expect(updated.branch).toBe('Branch B')
  })

  it('rejects empty school fields', async () => {
    await expect(saveSchool({ name: '   ', branch: 'Branch' })).rejects.toThrow(AppError)
    await expect(saveSchool({ name: 'School', branch: '   ' })).rejects.toThrow(AppError)
  })

  it('throws when deleting a missing school', async () => {
    await expect(removeSchool('missing-id')).rejects.toMatchObject({
      statusMessage: 'errors.notFound.school',
    })
  })
})
