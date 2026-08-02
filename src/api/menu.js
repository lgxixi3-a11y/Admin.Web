import request from './http'

export const getMenuTree = () => request.get('/system/menu/tree')
export const getMenuList = () => request.get('/system/menu/list')
export const getMenu = id => request.get(`/system/menu/${id}`)
export const createMenu = data => request.post('/system/menu', data)
export const updateMenu = data => request.put('/system/menu', data)
export const removeMenu = id => request.delete(`/system/menu/${id}`)
