import request from './http'

export const getUserPage = params => request.get('/system/user/page', { params })
export const getUser = id => request.get(`/system/user/${id}`)
export const createUser = data => request.post('/system/user', data)
export const updateUser = data => request.put('/system/user', data)
export const removeUser = id => request.delete(`/system/user/${id}`)
export const resetUserPwd = data => request.put('/system/user/resetPwd', data)
export const assignUserRoles = data => request.put('/system/user/assignRoles', data)
export const changeUserStatus = data => request.put('/system/user/changeStatus', data)
