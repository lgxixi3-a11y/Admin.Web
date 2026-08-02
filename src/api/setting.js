import request from './http'

export const getSettings = () => request.get('/tool/setting')
export const getSetting = key => request.get(`/tool/setting/${encodeURIComponent(key)}`)
export const updateSetting = data => request.put('/tool/setting', data)
export const removeSetting = key => request.delete(`/tool/setting/${encodeURIComponent(key)}`)
export const switchDatabase = data => request.put('/tool/setting/dbSwitch', data)
