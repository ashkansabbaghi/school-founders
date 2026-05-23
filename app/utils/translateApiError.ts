type ApiErrorParams = {
  field?: string
  id?: string
  filename?: string
  schoolId?: string
  studentId?: string
  employeeId?: string
  values?: string
}

type ApiErrorBody = {
  statusMessage?: string
  message?: string
  data?: ApiErrorParams
}

function isI18nKey(key: string): boolean {
  return key.startsWith('errors.') || key.startsWith('messages.')
}

export function translateApiError(
  error: unknown,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const body = (error as { data?: ApiErrorBody }).data

    if (body?.statusMessage && isI18nKey(body.statusMessage)) {
      const params = body.data ?? {}
      const interpolation: Record<string, unknown> = {}

      if (params.field) {
        interpolation.field = t(params.field)
      }
      if (params.id !== undefined) {
        interpolation.id = params.id
      }
      if (params.filename !== undefined) {
        interpolation.filename = params.filename
      }
      if (params.schoolId !== undefined) {
        interpolation.schoolId = params.schoolId
      }
      if (params.studentId !== undefined) {
        interpolation.studentId = params.studentId
      }
      if (params.employeeId !== undefined) {
        interpolation.employeeId = params.employeeId
      }
      if (params.values !== undefined) {
        interpolation.values = params.values
      }

      return t(body.statusMessage, interpolation)
    }

    if (body?.statusMessage) {
      return body.statusMessage
    }

    if (body?.message) {
      return body.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return t('messages.unexpectedError')
}
