import request from './http'

export const getRolePage = params => request.get('/system/role/page', { params })
export const getRole = id => request.get(`/system/role/${id}`)
export const createRole = data => request.post('/system/role', data)
export const updateRole = data => request.put('/system/role', data)
export const removeRole = id => request.delete(`/system/role/${id}`)
export const assignRoleMenus = data => request.put('/system/role/assignMenus', data)
