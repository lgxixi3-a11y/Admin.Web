<template>
  <el-upload
    v-model:file-list="fileList"
    action="#"
    :accept="accept"
    :auto-upload="autoUpload"
    :before-upload="beforeUpload"
    :disabled="disabled"
    :http-request="uploadRequest"
    :limit="limit"
    :multiple="multiple"
    :show-file-list="showFileList"
    @remove="handleRemove"
    @success="handleSuccess"
  >
    <slot>
      <el-button type="primary" :disabled="disabled">上传文件</el-button>
    </slot>
    <template v-if="$slots.tip" #tip><slot name="tip" /></template>
  </el-upload>
</template>

<script setup>
/* global defineProps, defineEmits */
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'
import { uploadFile as uploadFileApi } from '@/api/file'

const props = defineProps({
  modelValue: { type: [String, Array], default: '' },
  accept: { type: String, default: '' },
  limit: { type: Number, default: 1 },
  maxSize: { type: Number, default: 20 },
  multiple: { type: Boolean, default: false },
  autoUpload: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  showFileList: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'success', 'error', 'remove'])
const fileList = ref([])

watch(() => props.modelValue, value => {
  const urls = Array.isArray(value) ? value : value ? [value] : []
  fileList.value = urls.map(url => ({ name: String(url).split('/').pop(), url }))
}, { immediate: true })

function beforeUpload(file) {
  if (file.size <= props.maxSize * 1024 * 1024) return true
  ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
  return false
}

async function uploadRequest(options) {
  try {
    const result = await uploadFileApi(options.file, options.onProgress)
    options.onSuccess(result)
  } catch (error) {
    options.onError(error)
    emit('error', error)
  }
}

function handleSuccess(result) {
  const url = result?.url || result?.filePath
  if (!url) return
  const urls = props.multiple
    ? [...new Set([...fileList.value.map(file => file.url).filter(Boolean), url])]
    : url
  emit('update:modelValue', urls)
  emit('success', result)
}

function handleRemove(file) {
  const urls = fileList.value.map(item => item.url).filter(Boolean).filter(url => url !== file.url)
  emit('update:modelValue', props.multiple ? urls : '')
  emit('remove', file)
}
</script>
