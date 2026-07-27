import { beforeEach, describe, expect, it } from 'vitest'
import { AppError } from '#shared/errors/appError'
import {
  addSchoolClass,
  listSchools,
  removeSchool,
  saveSchool,
  updateSchoolClass,
} from '~/db/repositories/schools'
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
    expect(school.classes).toEqual([])

    const schools = await listSchools()
    expect(schools).toHaveLength(1)
    expect(schools[0]?.name).toBe('Test School')
  })

  it('updates an existing school', async () => {
    const school = await saveSchool({ name: 'Old Name', branch: 'Branch A' })
    const withClass = await addSchoolClass(school.id, { grade: '7' })
    const updated = await saveSchool({ id: school.id, name: 'New Name', branch: 'Branch B' })

    expect(updated.id).toBe(school.id)
    expect(updated.name).toBe('New Name')
    expect(updated.branch).toBe('Branch B')
    expect(updated.classes).toEqual(withClass.classes)
  })

  it('adds a school class with the next number for the grade', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })

    const first = await addSchoolClass(school.id, { grade: '7' })
    expect(first.classes).toHaveLength(1)
    expect(first.classes[0]).toMatchObject({ grade: '7', classNumber: 1 })
    expect(first.classes[0]?.id).toBeTruthy()

    const second = await addSchoolClass(school.id, { grade: '7' })
    expect(second.classes).toHaveLength(2)
    expect(second.classes.map(schoolClass => schoolClass.classNumber).sort()).toEqual([1, 2])

    const otherGrade = await addSchoolClass(school.id, { grade: '8' })
    expect(otherGrade.classes).toHaveLength(3)
    expect(otherGrade.classes.find(schoolClass => schoolClass.grade === '8')).toMatchObject({
      grade: '8',
      classNumber: 1,
    })
  })

  it('updates a school class number while keeping its id', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })
    const withClass = await addSchoolClass(school.id, { grade: '7' })
    const classId = withClass.classes[0]!.id

    const updated = await updateSchoolClass(school.id, classId, { classNumber: 3 })

    expect(updated.classes).toEqual([
      { id: classId, grade: '7', classNumber: 3 },
    ])
  })

  it('rejects duplicate class numbers within the same grade', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })
    await addSchoolClass(school.id, { grade: '7', classNumber: 1 })

    await expect(addSchoolClass(school.id, { grade: '7', classNumber: 1 })).rejects.toMatchObject({
      statusMessage: 'errors.conflict.duplicateSchoolClassNumber',
      data: { values: '7-1' },
    })

    const withClass = await addSchoolClass(school.id, { grade: '7', classNumber: 2 })
    const classId = withClass.classes.find(schoolClass => schoolClass.classNumber === 2)!.id

    await expect(updateSchoolClass(school.id, classId, { classNumber: 1 })).rejects.toMatchObject({
      statusMessage: 'errors.conflict.duplicateSchoolClassNumber',
      data: { values: '7-1' },
    })
  })

  it('allows the same class number across different grades', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })
    await addSchoolClass(school.id, { grade: '7', classNumber: 1 })

    const updated = await addSchoolClass(school.id, { grade: '8', classNumber: 1 })
    expect(updated.classes).toHaveLength(2)
    expect(updated.classes.map(schoolClass => schoolClass.grade).sort()).toEqual(['7', '8'])
  })

  it('throws when updating a missing school class', async () => {
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })

    await expect(updateSchoolClass(school.id, 'missing-class', { classNumber: 2 })).rejects.toMatchObject({
      statusMessage: 'errors.notFound.schoolClass',
      data: { id: 'missing-class' },
    })
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
