<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑任务' : '新增任务'" width="640px" destroy-on-close @closed="resetForm">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
      <el-form-item label="任务名称" prop="jobName">
        <el-input v-model.trim="form.jobName" maxlength="64" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="任务分组" prop="jobGroup">
        <el-input v-model.trim="form.jobGroup" maxlength="64" placeholder="默认 DEFAULT" />
      </el-form-item>
      <el-form-item label="调用目标" prop="invokeTarget">
        <el-input v-model.trim="form.invokeTarget" maxlength="256" placeholder="例如：SysJobService.Hello('hi')" />
      </el-form-item>
      <el-form-item label="Cron 表达式" prop="cronExpression">
        <div class="cron-row">
          <el-select v-model="presetValue" placeholder="常用预设" clearable class="cron-preset" @change="applyPreset">
            <el-option v-for="p in CRON_PRESETS" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
          <el-input
            v-model.trim="form.cronExpression"
            maxlength="64"
            placeholder="例如：0 0/5 * * * ?"
            class="cron-input"
            @blur="validateCronNow"
          />
        </div>
        <div v-if="cronError" class="cron-error">{{ cronError }}</div>
        <div class="cron-hint">格式：秒 分 时 日 月 周 [年]，? 与 * 不可同时用于日/周</div>
      </el-form-item>
      <el-form-item label="错失策略">
        <el-select v-model="form.misfirePolicy" style="width: 100%">
          <el-option label="默认策略" :value="0" />
          <el-option label="立即执行" :value="1" />
          <el-option label="忽略错失" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="并发执行">
        <el-radio-group v-model="form.concurrent">
          <el-radio :value="1">允许</el-radio>
          <el-radio :value="0">禁止</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">运行</el-radio>
          <el-radio :value="0">暂停</el-radio>
        </el-radio-group>
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
/* global defineEmits, defineExpose */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createJob, updateJob } from '@/api/job'
import { CRON_PRESETS, validateCron } from '@/utils/cron-utils.mjs'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const formRef = ref()
const presetValue = ref('')
const cronError = ref('')

const createEmptyForm = () => ({
  id: null, jobName: '', jobGroup: 'DEFAULT', invokeTarget: '', cronExpression: '',
  misfirePolicy: 0, concurrent: 1, status: 1, remark: ''
})
const form = reactive(createEmptyForm())

const formRules = computed(() => ({
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  invokeTarget: [{ required: true, message: '请输入调用目标', trigger: 'blur' }],
  cronExpression: [
    { required: Number(form.status) === 1, message: '运行中的任务必须填写 Cron 表达式', trigger: 'blur' },
    { validator: validateCronField, trigger: 'blur' }
  ]
}))

function validateCronField(rule, value, callback) {
  if (!value || Number(form.status) !== 1) return callback()
  const result = validateCron(value)
  cronError.value = result.ok ? '' : result.message
  if (result.ok) callback()
  else callback(new Error(result.message))
}

function validateCronNow() {
  if (!form.cronExpression) return
  const result = validateCron(form.cronExpression)
  cronError.value = result.ok ? '' : result.message
}

function applyPreset(value) {
  if (!value) return
  form.cronExpression = value
  cronError.value = ''
}

watch(() => form.cronExpression, () => {
  if (presetValue.value && form.cronExpression !== presetValue.value) presetValue.value = ''
})

function resetForm() {
  Object.assign(form, createEmptyForm())
  presetValue.value = ''
  cronError.value = ''
  formRef.value?.clearValidate()
}

function open(row) {
  resetForm()
  if (row) Object.assign(form, createEmptyForm(), row)
  visible.value = true
}

async function save() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    const payload = { ...form }
    if (payload.id) await updateJob(payload)
    else await createJob(payload)
    ElMessage.success(payload.id ? '修改成功' : '新增成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.cron-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.cron-preset {
  width: 140px;
  flex-shrink: 0;
}

.cron-input {
  flex: 1;
}

.cron-error {
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}

.cron-hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
