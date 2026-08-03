<template>
  <el-dialog v-model="visible" title="切换数据库" width="640px" destroy-on-close>
    <el-alert
      title="切换前请先测试连接。连接串仅用于本次操作，不会在页面中回显。"
      type="warning"
      :closable="false"
      show-icon
      class="database-tip"
    />
    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
      <el-form-item label="数据库类型" prop="dbType">
        <el-select v-model="form.dbType" class="database-input">
          <el-option label="PostgreSQL" value="postgresql" />
          <el-option label="MySQL" value="mysql" />
          <el-option label="SQL Server" value="sqlserver" />
          <el-option label="SQLite" value="sqlite" />
        </el-select>
      </el-form-item>
      <el-form-item label="连接字符串" prop="connectionString">
        <el-input
          v-model="form.connectionString"
          type="password"
          show-password
          autocomplete="off"
          :placeholder="connectionPlaceholder"
          class="database-input"
        />
      </el-form-item>
      <el-form-item>
        <el-button :loading="testing" :disabled="switching" @click="testConnection">测试连接</el-button>
        <el-button type="primary" :loading="switching" :disabled="testing" @click="switchConnection">切换数据库</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
/* global defineEmits, defineExpose */
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { switchDatabase, testDatabaseConnection } from '@/api/setting'
import { getConnectionPlaceholder } from '../setting-page-utils.mjs'

const emit = defineEmits(['saved'])

const visible = ref(false)
const formRef = ref()
const testing = ref(false)
const switching = ref(false)
const form = reactive({ dbType: 'postgresql', connectionString: '' })
const connectionPlaceholder = computed(() => getConnectionPlaceholder(form.dbType))

const rules = {
  dbType: [{ required: true, message: '请选择数据库类型', trigger: 'change' }],
  connectionString: [{ required: true, message: '请输入连接字符串', trigger: 'blur' }]
}

function open() {
  form.connectionString = ''
  visible.value = true
}

async function validateForm() {
  return formRef.value.validate().then(() => true).catch(() => false)
}

async function testConnection() {
  if (!await validateForm()) return
  testing.value = true
  try {
    await testDatabaseConnection({ ...form })
    ElMessage.success('连接测试成功')
  } finally {
    testing.value = false
  }
}

async function switchConnection() {
  if (!await validateForm()) return
  try {
    await ElMessageBox.confirm('确认切换数据库吗？切换后业务数据将使用新的数据库连接。', '切换确认', {
      type: 'warning',
      confirmButtonText: '确认切换'
    })
    switching.value = true
    await switchDatabase({ ...form })
    ElMessage.success('数据库切换成功')
    form.connectionString = ''
    visible.value = false
    emit('saved')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    switching.value = false
  }
}

defineExpose({ open })
</script>

<style scoped>
.database-tip {
  margin-bottom: 18px;
}

.database-input {
  width: 100%;
}
</style>
