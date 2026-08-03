export function getJobStatusAction(status) {
  return Number(status) === 1 ? 'pause' : 'resume'
}
