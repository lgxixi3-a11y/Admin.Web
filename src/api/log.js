import request from './http'

export const getLoginLogPage = params => request.get('/log/login/page', { params })
export const clearLoginLogs = params => request.delete('/log/login/clean', { params })
export const getOperLogPage = params => request.get('/log/oper/page', { params })
export const getOperLogDetail = id => request.get(`/log/oper/${id}`)
export const clearOperLogs = params => request.delete('/log/oper/clean', { params })
