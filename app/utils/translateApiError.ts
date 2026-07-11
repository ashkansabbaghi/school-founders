import { AppError, type AppErrorParams } from '#shared/errors/appError'

type ApiErrorBody = {
  statusMessage?: string
  message?: string
  data?: AppErrorParams
}

function isI18nKey(key: string): boolean {
  return key.startsWith('errors.') || key.startsWith('messages.')
}

function translateStatusMessage(
  statusMessage: string,
  params: AppErrorParams | undefined,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  if (!isI18nKey(statusMessage)) {
    return statusMessage
  }

  const interpolation: Record<string, unknown> = {}

  if (params?.field) {
    interpolation.field = t(params.field)
  }
  if (params?.id !== undefined) {
    interpolation.id = params.id
  }
  if (params?.filename !== undefined) {
    interpolation.filename = params.filename
  }
  if (params?.schoolId !== undefined) {
    interpolation.schoolId = params.schoolId
  }
  if (params?.studentId !== undefined) {
    interpolation.studentId = params.studentId
  }
  if (params?.employeeId !== undefined) {
    interpolation.employeeId = params.employeeId
  }
  if (params?.values !== undefined) {
    interpolation.values = params.values
  }

  return t(statusMessage, interpolation)
}

export function translateApiError(
  error: unknown,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  if (error instanceof AppError) {
    return translateStatusMessage(error.statusMessage, error.data, t)
  }

  if (error && typeof error === 'object' && 'data' in error) {
    const body = (error as { data?: ApiErrorBody }).data

    if (body?.statusMessage) {
      return translateStatusMessage(body.statusMessage, body.data, t)
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
