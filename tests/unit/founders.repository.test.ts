import { beforeEach, describe, expect, it } from 'vitest'
import { AppError } from '#shared/errors/appError'
import { listFounders, removeFounder, saveFounder } from '~/db/repositories/founders'
import { resetTestDatabase } from '../helpers/db'

describe('founders repository', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('creates and lists founders', async () => {
    const founder = await saveFounder({ name: 'Test Founder', school: 'Demo School' })

    expect(founder.id).toBeTruthy()
    expect(founder.name).toBe('Test Founder')

    const founders = await listFounders()
    expect(founders).toHaveLength(1)
    expect(founders[0]?.name).toBe('Test Founder')
  })

  it('rejects empty founder names', async () => {
    await expect(saveFounder({ name: '   ' })).rejects.toThrow(AppError)
  })

  it('throws when deleting a missing founder', async () => {
    await expect(removeFounder('missing-id')).rejects.toMatchObject({
      statusMessage: 'errors.notFound.founder',
    })
  })
})
