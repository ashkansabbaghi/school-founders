import { startDirectoryBackupScheduler } from '~/services/directoryBackupSchedule'

export default defineNuxtPlugin({
  name: 'directory-backup-schedule',
  dependsOn: ['db'],
  setup() {
    startDirectoryBackupScheduler()
  },
})
