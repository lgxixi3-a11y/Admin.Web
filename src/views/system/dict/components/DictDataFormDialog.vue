<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑字典数据' : '新增字典数据'" width="560px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
      <el-form-item label="字典类型">
        <el-input :model-value="form.dictType" disabled />
      </el-form-item>
      <el-form-item label="数据标签" prop="dictLabel">
        <el-input v-model.trim="form.dictLabel" maxlength="64" show-word-limit />
      </el-form-item>
      <el-form-item label="数据键值" prop="dictValue">
        <el-input v-model.trim="form.dictValue" maxlength="64" show-word-limit />
      </el-form-item>
      <el-form-item label="显示排序" prop="dictSort">
        <el-input-number v-model="form.dictSort" :min="0" :max="99999" controls-position="right" />
      </el-form-item>
      <el-form-item label="标签样式" prop="cssClass">
        <el-select v-model="form.cssClass" clearable placeholder="默认样式" class="full-width">
          <el-option label="success" value="success" />
          <el-option label="warning" value="warning" />
          <el-option label="danger" value="danger" />
          <el-option label="info" value="info" />
          <el-option label="primary" value="primary" />
        </el-select>
      </el-form-item>
      <el-form-item label="默认值" prop="isDefault">
        <el-radio-group v-model="form.isDefault">
          <el-radio :value="1">是</el-radio>
          <el-radio :value="0">否</el-radio>
        </el-radio-group>
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
import { createDictData, updateDictData } from '@/api/dict'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const formRef = ref()
const createEmptyForm = () => ({
  id: null, dictType: '', dictLabel: '', dictValue: '', dictSort: 0,
  status: 1, cssClass: '', isDefault: 0, remark: ''
})
const form = reactive(createEmptyForm())

const rules = {
  dictLabel: [{ required: true, message: '请输入数据标签', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入数据键值', trigger: 'blur' }]
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  formRef.value?.clearValidate()
}

function open(row, dictType) {
  resetForm()
  if (row) {
    Object.assign(form, createEmptyForm(), {
      id: row.id,
      dictType: row.dictType,
      dictLabel: row.dictLabel,
      dictValue: row.dictValue,
      dictSort: row.dictSort,
      status: row.status,
      cssClass: row.cssClass || '',
      isDefault: row.isDefault,
      remark: row.remark || ''
    })
  } else {
    form.dictType = dictType || ''
  }
  visible.value = true
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || saving.value) return
  saving.value = true
  try {
    const payload = { ...form }
    if (payload.id) await updateDictData(payload)
    else await createDictData(payload)
    ElMessage.success(payload.id ? '字典数据修改成功' : '字典数据新增成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
