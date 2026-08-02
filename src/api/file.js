import request from './http'

export function uploadFile(file, onUploadProgress) {
  const data = new FormData()
  data.append('file', file)
  return request.post('/file/upload', data, { onUploadProgress })
}

export const downloadFile = id => request.get(`/file/${id}/download`, { responseType: 'blob' })
export const removeFile = id => request.delete(`/file/${id}`)
