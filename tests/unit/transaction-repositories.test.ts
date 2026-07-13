import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '~/db/database'
import { listEmployeeTransactions } from '~/db/repositories/employeeTransactions'
import { listFixedCosts } from '~/db/repositories/fixedCosts'
import { listStudentTransactions } from '~/db/repositories/studentTransactions'
import { resetTestDatabase } from '../helpers/db'

const schoolA = 'school-a'
const schoolB = 'school-b'
const studentA = 'student-a'
const studentB = 'student-b'
const employeeA = 'employee-a'
const employeeB = 'employee-b'

describe('transaction repositories indexed queries', () => {
  beforeEach(async () => {
    await resetTestDatabase()

    await db.studentTransactions.bulkAdd([
      {
        id: 'st-1',
        studentId: studentA,
        schoolId: schoolA,
        amountPaid: 100,
        paymentMethod: 'cash',
        date: '2025-01-01',
        termYear: '1403-1404',
        operator: 'Op',
      },
      {
        id: 'st-2',
        studentId: studentA,
        schoolId: schoolA,
        amountPaid: 200,
        paymentMethod: 'card',
        date: '2025-02-01',
        termYear: '1404-1405',
        operator: 'Op',
      },
      {
        id: 'st-3',
        studentId: studentB,
        schoolId: schoolB,
        amountPaid: 300,
        paymentMethod: 'cash',
        date: '2025-01-15',
        termYear: '1403-1404',
        operator: 'Op',
      },
    ])

    await db.employeeTransactions.bulkAdd([
      {
        id: 'et-1',
        employeeId: employeeA,
        schoolId: schoolA,
        amountPaid: 1_000,
        transactionType: 'salary',
        date: '2025-01-01',
        termYear: '1403-1404',
        operator: 'Op',
      },
      {
        id: 'et-2',
        employeeId: employeeA,
        schoolId: schoolA,
        amountPaid: 100,
        transactionType: 'bonus',
        date: '2025-02-01',
        termYear: '1404-1405',
        operator: 'Op',
      },
      {
        id: 'et-3',
        employeeId: employeeB,
        schoolId: schoolB,
        amountPaid: 2_000,
        transactionType: 'salary',
        date: '2025-01-15',
        termYear: '1403-1404',
        operator: 'Op',
      },
    ])

    await db.fixedCosts.bulkAdd([
      { id: 'fc-1', schoolId: schoolA, termYear: '1403-1404', amount: 500, label: 'Rent' },
      { id: 'fc-2', schoolId: schoolA, termYear: '1404-1405', amount: 600, label: 'Rent' },
      { id: 'fc-3', schoolId: schoolB, termYear: '1403-1404', amount: 700, label: 'Rent' },
    ])
  })

  it('filters student transactions by studentId and termYear', async () => {
    const results = await listStudentTransactions({
      studentId: studentA,
      termYear: '1403-1404',
    })

    expect(results.map(transaction => transaction.id)).toEqual(['st-1'])
  })

  it('filters student transactions by schoolId', async () => {
    const results = await listStudentTransactions({ schoolId: schoolB })

    expect(results.map(transaction => transaction.id)).toEqual(['st-3'])
  })

  it('filters employee transactions by employeeId and transactionType', async () => {
    const results = await listEmployeeTransactions({
      employeeId: employeeA,
      transactionType: 'bonus',
    })

    expect(results.map(transaction => transaction.id)).toEqual(['et-2'])
  })

  it('filters employee transactions by schoolId and termYear', async () => {
    const results = await listEmployeeTransactions({
      schoolId: schoolA,
      termYear: '1403-1404',
    })

    expect(results.map(transaction => transaction.id)).toEqual(['et-1'])
  })

  it('filters fixed costs by schoolId and termYear', async () => {
    const results = await listFixedCosts({
      schoolId: schoolA,
      termYear: '1404-1405',
    })

    expect(results.map(cost => cost.id)).toEqual(['fc-2'])
  })

  it('filters fixed costs by termYear only', async () => {
    const results = await listFixedCosts({ termYear: '1403-1404' })

    expect(results.map(cost => cost.id).sort()).toEqual(['fc-1', 'fc-3'])
  })
})
