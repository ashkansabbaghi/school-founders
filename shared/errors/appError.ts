export type AppErrorParams = {
  field?: string
  id?: string
  filename?: string
  schoolId?: string
  studentId?: string
  employeeId?: string
  nationalCode?: string
  values?: string
}

export class AppError extends Error {
  readonly statusCode: number
  readonly statusMessage: string
  readonly data?: AppErrorParams

  constructor(options: {
    statusCode: number
    statusMessage: string
    data?: AppErrorParams
  }) {
    super(options.statusMessage)
    this.name = 'AppError'
    this.statusCode = options.statusCode
    this.statusMessage = options.statusMessage
    this.data = options.data
  }
}

export function createAppError(options: {
  statusCode: number
  statusMessage: string
  data?: AppErrorParams
}): AppError {
  return new AppError(options)
}
