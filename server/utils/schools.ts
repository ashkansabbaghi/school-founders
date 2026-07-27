import type { School, SchoolClass } from '../types/financial'
import {
  formatClassLabel,
  hasDuplicateClassNumber,
  nextClassNumber,
  normalizeSchoolClasses,
} from '../../shared/utils/schoolClass'

const FILE = 'schools.json'

function withNormalizedClasses(school: School): School {
  return {
    ...school,
    classes: normalizeSchoolClasses(school.classes),
  }
}

function assertUniqueClassNumber(
  classes: SchoolClass[],
  grade: string,
  classNumber: number,
  excludeId?: string,
): void {
  if (hasDuplicateClassNumber(classes, grade, classNumber, excludeId)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'errors.conflict.duplicateSchoolClassNumber',
      data: { values: formatClassLabel(grade, classNumber) },
    })
  }
}

function normalizeIncomingClasses(classes: SchoolClass[]): SchoolClass[] {
  const normalized = classes.map((schoolClass) => {
    const id = assertNonEmptyString(schoolClass.id, 'id')
    const grade = assertNonEmptyString(schoolClass.grade, 'grade')
    const classNumber = assertPositiveInteger(schoolClass.classNumber, 'classNumber')

    return { id, grade, classNumber }
  })

  for (const schoolClass of normalized) {
    assertUniqueClassNumber(normalized, schoolClass.grade, schoolClass.classNumber, schoolClass.id)
  }

  return normalized
}

export async function listSchools(): Promise<School[]> {
  const schools = await readCollection<School>(FILE)
  return schools.map(withNormalizedClasses)
}

export async function getSchool(id: string): Promise<School | null> {
  const school = await getById<School>(FILE, id)
  return school ? withNormalizedClasses(school) : null
}

export async function saveSchool(input: {
  id?: string
  name?: string
  branch?: string
  classes?: SchoolClass[]
}): Promise<School> {
  const id = input.id?.trim() || crypto.randomUUID()
  const existing = await getById<School>(FILE, id)

  const classes = input.classes !== undefined
    ? normalizeIncomingClasses(input.classes)
    : normalizeSchoolClasses(existing?.classes)

  const school: School = {
    id,
    name: assertNonEmptyString(input.name, 'name'),
    branch: assertNonEmptyString(input.branch, 'branch'),
    classes,
  }

  return upsertById(FILE, school)
}

export async function addSchoolClass(
  schoolId: string,
  input: {
    grade?: string
    classNumber?: number
  },
): Promise<School> {
  const school = await assertSchoolExists(schoolId)
  const grade = assertNonEmptyString(input.grade, 'grade')
  const classes = normalizeSchoolClasses(school.classes)
  const classNumber = input.classNumber !== undefined
    ? assertPositiveInteger(input.classNumber, 'classNumber')
    : nextClassNumber(classes, grade)

  assertUniqueClassNumber(classes, grade, classNumber)

  const updated: School = {
    ...school,
    classes: [
      ...classes,
      {
        id: crypto.randomUUID(),
        grade,
        classNumber,
      },
    ],
  }

  return upsertById(FILE, updated)
}

export async function updateSchoolClass(
  schoolId: string,
  classId: string,
  input: {
    classNumber?: number
  },
): Promise<School> {
  const school = await assertSchoolExists(schoolId)
  const classes = normalizeSchoolClasses(school.classes)
  const existingClass = classes.find(schoolClass => schoolClass.id === classId)

  if (!existingClass) {
    throw createError({
      statusCode: 404,
      statusMessage: 'errors.notFound.schoolClass',
      data: { id: classId },
    })
  }

  const classNumber = assertPositiveInteger(input.classNumber, 'classNumber')
  assertUniqueClassNumber(classes, existingClass.grade, classNumber, classId)

  const updated: School = {
    ...school,
    classes: classes.map(schoolClass =>
      schoolClass.id === classId
        ? { ...schoolClass, classNumber }
        : schoolClass,
    ),
  }

  return upsertById(FILE, updated)
}

export async function removeSchool(id: string): Promise<void> {
  await assertNoSchoolDependents(id)

  const removed = await removeById<School>(FILE, id)

  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.school' })
  }
}
