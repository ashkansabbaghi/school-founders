import type { School, SchoolClass } from '#shared/types/financial'
import {
  addSchoolClass as addSchoolClassRecord,
  listSchools,
  removeSchool,
  saveSchool,
  updateSchoolClass as updateSchoolClassRecord,
} from '~/db'

export async function fetchSchools(): Promise<School[]> {
  return listSchools()
}

export async function createSchool(
  payload: Pick<School, 'name' | 'branch'> & { classes?: SchoolClass[] },
): Promise<School> {
  return saveSchool(payload)
}

export async function updateSchool(
  id: string,
  payload: Pick<School, 'name' | 'branch'> & { classes?: SchoolClass[] },
): Promise<School> {
  return saveSchool({ id, ...payload })
}

export async function addSchoolClass(
  schoolId: string,
  payload: { grade: string; classNumber?: number },
): Promise<School> {
  return addSchoolClassRecord(schoolId, payload)
}

export async function updateSchoolClass(
  schoolId: string,
  classId: string,
  payload: { classNumber: number },
): Promise<School> {
  return updateSchoolClassRecord(schoolId, classId, payload)
}

export async function deleteSchool(id: string): Promise<void> {
  return removeSchool(id)
}
