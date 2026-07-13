export interface MetaRecord {
  key: string
  value: string
}

export const META_KEYS = {
  installId: 'installId',
  operatorName: 'operatorName',
  initialized: 'initialized',
  termYear: 'termYear',
  lastBackupAt: 'lastBackupAt',
  showFirstPaymentCta: 'showFirstPaymentCta',
} as const

export type MetaKey = (typeof META_KEYS)[keyof typeof META_KEYS]
