import type { Employee } from '../types/financial'

const FILE = 'employees.json'

export async function listEmployees(schoolId?: string): Promise<Employee[]> {
  const employees = await readCollection<Employee>(FILE)

  if (!schoolId) {
    return employees
  }

  return employees.filter(employee => employee.schoolId === schoolId)
}

export async function getEmployee(id: string): Promise<Employee | null> {
  return getById<Employee>(FILE, id)
}

export async function saveEmployee(input: {
  id?: string
  schoolId?: string
  fullName?: string
  nationalCode?: string
  employeeId?: string
  role?: string
  baseSalary?: number
  insuranceCost?: number
}): Promise<Employee> {
  const schoolId = assertNonEmptyString(input.schoolId, 'schoolId')
  await assertSchoolExists(schoolId)

  const id = input.id?.trim() || crypto.randomUUID()
  const nationalCode = assertNationalCode(input.nationalCode)
  await assertUniqueEmployeeNationalCode(nationalCode, id)

  const employee: Employee = {
    id,
    schoolId,
    fullName: assertNonEmptyString(input.fullName, 'fullName'),
    nationalCode,
    employeeId: assertNonEmptyString(input.employeeId, 'employeeId'),
    role: assertNonEmptyString(input.role, 'role'),
    baseSalary: assertPositiveInteger(input.baseSalary, 'baseSalary'),
    insuranceCost: assertNonNegativeInteger(input.insuranceCost, 'insuranceCost'),
  }

  return upsertById(FILE, employee)
}

export async function removeEmployee(id: string): Promise<void> {
  await assertNoEmployeeDependents(id)

  const removed = await removeById<Employee>(FILE, id)

  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.employee' })
  }
}
