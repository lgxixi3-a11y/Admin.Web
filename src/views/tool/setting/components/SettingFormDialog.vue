<template>
  <el-dialog v-model="visible" title="编辑系统设置" width="560px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="86px">
      <el-form-item label="设置键" prop="key">
        <el-input v-model="form.key" disabled />
      </el-form-item>
      <el-form-item label="设置值" prop="value">
        <el-input v-model="form.value" type="textarea" :rows="4" maxlength="512" show-word-limit />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model.trim="form.remark" maxlength="256" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/* global defineEmits, defineExpose */
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { updateSetting } from '@/api/setting'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const formRef = ref()
const createEmptyForm = () => ({ key: '', value: '', remark: '' })
const form = reactive(createEmptyForm())
const formRules = { key: [{ required: true, message: '设置键不能为空', trigger: 'blur' }] }

function resetForm() {
  Object.assign(form, createEmptyForm())
  formRef.value?.clearValidate()
}

function open(row) {
  resetForm()
  Object.assign(form, createEmptyForm(), row)
  visible.value = true
}

async function save() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    await updateSetting({ ...form })
    ElMessage.success('修改成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
