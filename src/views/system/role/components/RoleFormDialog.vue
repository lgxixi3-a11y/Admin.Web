<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑角色' : '新增角色'" width="520px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model.trim="form.roleName" maxlength="64" show-word-limit />
      </el-form-item>
      <el-form-item label="角色标识" prop="roleKey">
        <el-input v-model.trim="form.roleKey" maxlength="64" show-word-limit placeholder="如 admin / manager" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="0" :precision="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="256" show-word-limit />
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
import { createRole, getRole, updateRole } from '@/api/role'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const formRef = ref()
const form = reactive({ id: null, roleName: '', roleKey: '', sort: 0, status: 1, remark: '' })

const rules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 64, message: '角色名称不能超过 64 个字符', trigger: 'blur' }
  ],
  roleKey: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { max: 64, message: '角色标识不能超过 64 个字符', trigger: 'blur' }
  ]
}

function resetForm() {
  Object.assign(form, { id: null, roleName: '', roleKey: '', sort: 0, status: 1, remark: '' })
  formRef.value?.clearValidate()
}

async function open(row) {
  resetForm()
  if (row) {
    const detail = await getRole(row.id)
    Object.assign(form, {
      id: detail.id,
      roleName: detail.roleName || '',
      roleKey: detail.roleKey || '',
      sort: detail.sort ?? 0,
      status: detail.status ?? 1,
      remark: detail.remark || ''
    })
  }
  visible.value = true
}

async function save() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    const payload = { ...form }
    if (payload.id) await updateRole(payload)
    else await createRole(payload)
    ElMessage.success(payload.id ? '修改成功' : '新增成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
