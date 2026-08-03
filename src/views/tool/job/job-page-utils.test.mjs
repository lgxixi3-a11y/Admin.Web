import assert from 'node:assert/strict'
import test from 'node:test'
import { getJobStatusAction } from './job-page-utils.mjs'

test('job status action pauses active jobs and resumes paused jobs', () => {
  assert.equal(getJobStatusAction(1), 'pause')
  assert.equal(getJobStatusAction(0), 'resume')
})
