import request from './http'

export const getDictTypePage = params => request.get('/system/dict/type/page', { params })
export const getDictDataPage = params => request.get('/system/dict/data/page', { params })
export const getDictDataByType = dictType => request.get(`/system/dict/data/${encodeURIComponent(dictType)}`)
export const createDictType = data => request.post('/system/dict/type', data)
export const updateDictType = data => request.put('/system/dict/type', data)
export const removeDictType = id => request.delete(`/system/dict/type/${id}`)
export const createDictData = data => request.post('/system/dict/data', data)
export const updateDictData = data => request.put('/system/dict/data', data)
export const removeDictData = id => request.delete(`/system/dict/data/${id}`)
