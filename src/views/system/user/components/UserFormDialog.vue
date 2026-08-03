<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑用户' : '新增用户'" width="620px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="88px">
      <el-form-item label="用户名" prop="userName">
        <el-input v-model.trim="form.userName" :disabled="Boolean(form.id)" maxlength="64" placeholder="4-64 个字符" />
      </el-form-item>
      <el-form-item label="昵称" prop="nickName">
        <el-input v-model.trim="form.nickName" maxlength="64" />
      </el-form-item>
      <el-form-item v-if="!form.id" label="密码" prop="password">
        <el-input v-model="form.password" type="password" show-password autocomplete="new-password" maxlength="64" placeholder="6-64 个字符" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model.trim="form.email" maxlength="128" placeholder="选填" />
      </el-form-item>
      <el-form-item label="手机" prop="phone">
        <el-input v-model.trim="form.phone" maxlength="32" placeholder="选填" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="form.roleIds" multiple clearable placeholder="请选择角色" style="width: 100%">
          <el-option v-for="role in roleOptions" :key="role.id" :label="role.roleName" :value="role.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model.trim="form.remark" type="textarea" maxlength="256" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
/* global defineProps, defineEmits, defineExpose */

import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createUser, getUser, updateUser } from '@/api/user'

defineProps({
  roleOptions: { type: Array, default: () => [] }
})
const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const formRef = ref()

const createEmptyForm = () => ({
  id: null, userName: '', nickName: '', password: '', email: '', phone: '',
  status: 1, remark: '', roleIds: []
})
const form = reactive(createEmptyForm())

const formRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 64, message: '用户名长度为 4 到 64 个字符', trigger: 'blur' }
  ],
  nickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, min: 6, max: 64, message: '密码长度为 6 到 64 个字符', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  phone: [{ max: 32, message: '手机号长度不能超过 32 个字符', trigger: 'blur' }]
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  formRef.value?.clearValidate()
}

async function open(row) {
  resetForm()
  if (row) {
    const detail = await getUser(row.id)
    Object.assign(form, createEmptyForm(), detail, { roleIds: [...(detail.roleIds || [])] })
  }
  visible.value = true
}

async function save() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    const payload = { ...form, roleIds: [...form.roleIds] }
    if (payload.id) {
      delete payload.password
      await updateUser(payload)
    } else {
      await createUser(payload)
    }
    ElMessage.success(payload.id ? '修改成功' : '新增成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
