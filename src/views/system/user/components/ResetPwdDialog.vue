<template>
  <el-dialog v-model="visible" title="重置密码" width="460px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
      <el-form-item label="用户">
        <span>{{ userName }}</span>
      </el-form-item>
      <el-form-item label="新密码" prop="password">
        <el-input v-model="form.password" type="password" show-password autocomplete="new-password" maxlength="64" placeholder="6-64 个字符" />
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
import { getUser, resetUserPwd } from '@/api/user'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const formRef = ref()
const userName = ref('')
const form = reactive({ id: null, password: '' })

const rules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度为 6 到 64 个字符', trigger: 'blur' }
  ]
}

function resetForm() {
  Object.assign(form, { id: null, password: '' })
  userName.value = ''
  formRef.value?.clearValidate()
}

async function open(row) {
  const detail = await getUser(row.id)
  Object.assign(form, { id: detail.id, password: '' })
  userName.value = detail.nickName || detail.userName
  visible.value = true
}

async function save() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    await resetUserPwd({ id: form.id, password: form.password })
    ElMessage.success('密码重置成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
