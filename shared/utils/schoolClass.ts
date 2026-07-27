import type { School, SchoolClass } from '../types/financial'

export function formatClassLabel(grade: string, classNumber: number): string {
  return `${grade}-${classNumber}`
}

export function nextClassNumber(
  classes: Pick<SchoolClass, 'grade' | 'classNumber'>[],
  grade: string,
): number {
  const maxForGrade = classes
    .filter(schoolClass => schoolClass.grade === grade)
    .reduce((max, schoolClass) => Math.max(max, schoolClass.classNumber), 0)

  return maxForGrade + 1
}

/** Normalize legacy schools that predate the `classes` field. */
export function normalizeSchoolClasses(
  classes: School['classes'] | null | undefined,
): SchoolClass[] {
  return Array.isArray(classes) ? classes : []
}

export function findSchoolClass(
  classes: SchoolClass[] | null | undefined,
  classId: string,
): SchoolClass | undefined {
  return normalizeSchoolClasses(classes).find(schoolClass => schoolClass.id === classId)
}

export function hasDuplicateClassNumber(
  classes: Pick<SchoolClass, 'id' | 'grade' | 'classNumber'>[],
  grade: string,
  classNumber: number,
  excludeId?: string,
): boolean {
  return classes.some(
    schoolClass =>
      schoolClass.grade === grade
      && schoolClass.classNumber === classNumber
      && schoolClass.id !== excludeId,
  )
}
