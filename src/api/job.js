import request from './http'

export const getJobPage = params => request.get('/tool/job/page', { params })
export const createJob = data => request.post('/tool/job', data)
export const updateJob = data => request.put('/tool/job', data)
export const removeJob = id => request.delete(`/tool/job/${id}`)
export const runJob = id => request.put(`/tool/job/${id}/run`)
export const pauseJob = id => request.put(`/tool/job/${id}/pause`)
export const resumeJob = id => request.put(`/tool/job/${id}/resume`)
export const getJobLogPage = params => request.get('/tool/job/log/page', { params })
