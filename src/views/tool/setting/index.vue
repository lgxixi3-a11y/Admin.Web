<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="setting-page">
    <el-card shadow="never" class="settings-card">
      <template #header><span>系统设置</span></template>
      <PaginationTable :data="rows" :loading="loading" :show-pagination="false" @refresh="load">
        <el-table-column prop="key" label="设置键" min-width="180" show-overflow-tooltip />
        <el-table-column prop="value" label="设置值" min-width="300" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'tool:setting:edit'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'tool:setting:del'" link type="danger" :loading="deletingKey === row.key" :disabled="deletingKey !== null" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </PaginationTable>
    </el-card>

    <el-card v-permission="'tool:setting:dbSwitch'" shadow="never" class="database-card">
      <template #header><span>数据库切换</span></template>
      <el-alert title="切换前请先测试连接。连接串仅用于本次操作，不会在页面中回显。" type="warning" :closable="false" show-icon class="database-tip" />
      <el-form ref="databaseFormRef" :model="databaseForm" :rules="databaseRules" label-width="108px" class="database-form">
        <el-form-item label="数据库类型" prop="dbType">
          <el-select v-model="databaseForm.dbType" class="database-input">
            <el-option label="PostgreSQL" value="postgresql" /><el-option label="MySQL" value="mysql" /><el-option label="SQL Server" value="sqlserver" /><el-option label="SQLite" value="sqlite" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接字符串" prop="connectionString">
          <el-input v-model="databaseForm.connectionString" type="password" show-password autocomplete="off" :placeholder="connectionPlaceholder" class="database-input" />
        </el-form-item>
        <el-form-item>
          <el-button :loading="testing" :disabled="switching" @click="testConnection">测试连接</el-button>
          <el-button type="primary" :loading="switching" :disabled="testing" @click="switchConnection">切换数据库</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="formVisible" title="编辑系统设置" width="560px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="86px">
        <el-form-item label="设置键" prop="key"><el-input v-model="form.key" disabled /></el-form-item>
        <el-form-item label="设置值" prop="value"><el-input v-model="form.value" type="textarea" :rows="4" maxlength="512" show-word-limit /></el-form-item>
        <el-form-item label="备注"><el-input v-model.trim="form.remark" maxlength="256" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="formVisible = false">取消</el-button><el-button v-permission="'tool:setting:edit'" type="primary" :loading="saving" @click="save">确定</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import { getSettings, removeSetting, switchDatabase, testDatabaseConnection, updateSetting } from '@/api/setting'
import { getConnectionPlaceholder } from './setting-page-utils.mjs'

const rows = ref([]); const loading = ref(false); const deletingKey = ref(null)
const formVisible = ref(false); const formRef = ref(); const saving = ref(false)
const createEmptyForm = () => ({ key: '', value: '', remark: '' })
const form = reactive(createEmptyForm())
const databaseFormRef = ref(); const testing = ref(false); const switching = ref(false)
const databaseForm = reactive({ dbType: 'postgresql', connectionString: '' })
const connectionPlaceholder = computed(() => getConnectionPlaceholder(databaseForm.dbType))
const formRules = { key: [{ required: true, message: '设置键不能为空', trigger: 'blur' }] }
const databaseRules = { dbType: [{ required: true, message: '请选择数据库类型', trigger: 'change' }], connectionString: [{ required: true, message: '请输入连接字符串', trigger: 'blur' }] }

async function load() { loading.value = true; try { const result = await getSettings(); rows.value = (result || []).filter(item => !String(item.key || '').toLowerCase().startsWith('db.')) } finally { loading.value = false } }
function resetForm() { Object.assign(form, createEmptyForm()); formRef.value?.clearValidate() }
function openEdit(row) { Object.assign(form, createEmptyForm(), row); formVisible.value = true }
async function save() { if (!await formRef.value.validate().catch(() => false)) return; saving.value = true; try { await updateSetting({ ...form }); ElMessage.success('修改成功'); formVisible.value = false; await load() } finally { saving.value = false } }
async function remove(row) { if (deletingKey.value) return; try { await ElMessageBox.confirm(`确认删除设置“${row.key}”吗？`, '删除确认', { type: 'warning' }); deletingKey.value = row.key; await removeSetting(row.key); ElMessage.success('删除成功'); await load() } catch (error) { if (error !== 'cancel' && error !== 'close') throw error } finally { deletingKey.value = null } }
async function validateDatabaseForm() { return databaseFormRef.value.validate().then(() => true).catch(() => false) }
async function testConnection() { if (!await validateDatabaseForm()) return; testing.value = true; try { await testDatabaseConnection({ ...databaseForm }); ElMessage.success('连接测试成功') } finally { testing.value = false } }
async function switchConnection() { if (!await validateDatabaseForm()) return; try { await ElMessageBox.confirm('确认切换数据库吗？切换后业务数据将使用新的数据库连接。', '切换确认', { type: 'warning', confirmButtonText: '确认切换' }); switching.value = true; await switchDatabase({ ...databaseForm }); ElMessage.success('数据库切换成功'); databaseForm.connectionString = ''; await load() } catch (error) { if (error !== 'cancel' && error !== 'close') throw error } finally { switching.value = false } }
onMounted(load)
</script>

<style scoped>
.settings-card { margin-bottom: 16px; }
.database-card { max-width: 920px; }
.database-tip { margin-bottom: 18px; }
.database-form { max-width: 760px; }
.database-input { width: 100%; }
</style>
