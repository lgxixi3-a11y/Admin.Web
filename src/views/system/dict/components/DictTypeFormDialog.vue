<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑字典类型' : '新增字典类型'" width="520px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
      <el-form-item label="字典名称" prop="dictName">
        <el-input v-model.trim="form.dictName" maxlength="64" show-word-limit />
      </el-form-item>
      <el-form-item label="字典类型" prop="dictType">
        <el-input v-model.trim="form.dictType" maxlength="64" show-word-limit placeholder="如 sys_user_status" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="256" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/* global defineEmits, defineExpose */
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createDictType, updateDictType } from '@/api/dict'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const formRef = ref()
const createEmptyForm = () => ({ id: null, dictName: '', dictType: '', status: 1, remark: '' })
const form = reactive(createEmptyForm())

const rules = {
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }]
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  formRef.value?.clearValidate()
}

function open(row) {
  resetForm()
  if (row) {
    Object.assign(form, createEmptyForm(), {
      id: row.id,
      dictName: row.dictName,
      dictType: row.dictType,
      status: row.status,
      remark: row.remark || ''
    })
  }
  visible.value = true
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || saving.value) return
  saving.value = true
  try {
    const payload = { ...form }
    if (payload.id) await updateDictType(payload)
    else await createDictType(payload)
    ElMessage.success(payload.id ? '字典类型修改成功' : '字典类型新增成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
