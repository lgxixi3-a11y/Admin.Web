<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="job-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="filters" @submit.prevent="search">
        <el-form-item label="任务名称"><el-input v-model.trim="filters.jobName" clearable placeholder="请输入任务名称" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" class="status-select">
            <el-option label="运行中" :value="1" /><el-option label="已暂停" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" native-type="submit">查询</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <PaginationTable v-model:page="page" v-model:page-size="pageSize" :data="rows" :loading="loading" :total="total" @change="handlePageChange" @refresh="load">
        <template #toolbar><el-button v-permission="'tool:job:add'" type="primary" @click="openCreate">新增任务</el-button></template>
        <el-table-column prop="jobName" label="任务名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="jobGroup" label="任务分组" min-width="110" />
        <el-table-column prop="invokeTarget" label="调用目标" min-width="220" show-overflow-tooltip />
        <el-table-column prop="cronExpression" label="Cron 表达式" min-width="155" show-overflow-tooltip />
        <el-table-column label="并发" width="90" align="center"><template #default="{ row }">{{ Number(row.concurrent) === 1 ? '允许' : '禁止' }}</template></el-table-column>
        <el-table-column label="状态" width="92" align="center"><template #default="{ row }"><el-tag :type="Number(row.status) === 1 ? 'success' : 'info'">{{ Number(row.status) === 1 ? '运行中' : '已暂停' }}</el-tag></template></el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="170" />
        <el-table-column label="操作" fixed="right" min-width="300">
          <template #default="{ row }">
            <el-button v-permission="'tool:job:run'" link type="primary" :loading="runningId === row.id" :disabled="hasRowAction" @click="run(row)">立即执行</el-button>
            <el-button v-if="getJobStatusAction(row.status) === 'pause'" v-permission="'tool:job:pause'" link type="warning" :loading="changingStatusId === row.id" :disabled="hasRowAction" @click="changeStatus(row)">暂停</el-button>
            <el-button v-else v-permission="'tool:job:resume'" link type="success" :loading="changingStatusId === row.id" :disabled="hasRowAction" @click="changeStatus(row)">恢复</el-button>
            <el-button v-permission="'tool:job:edit'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openLogs(row)">日志</el-button>
            <el-button v-permission="'tool:job:del'" link type="danger" :loading="deletingId === row.id" :disabled="hasRowAction" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </PaginationTable>
    </el-card>

    <el-dialog v-model="formVisible" :title="form.id ? '编辑任务' : '新增任务'" width="620px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="任务名称" prop="jobName"><el-input v-model.trim="form.jobName" maxlength="64" /></el-form-item>
        <el-form-item label="任务分组" prop="jobGroup"><el-input v-model.trim="form.jobGroup" maxlength="64" /></el-form-item>
        <el-form-item label="调用目标" prop="invokeTarget"><el-input v-model.trim="form.invokeTarget" maxlength="256" placeholder="例如：SysJobService.Hello('hi')" /></el-form-item>
        <el-form-item label="Cron 表达式" prop="cronExpression"><el-input v-model.trim="form.cronExpression" maxlength="64" placeholder="例如：0 0/5 * * * ?" /></el-form-item>
        <el-form-item label="错失策略"><el-select v-model="form.misfirePolicy"><el-option label="默认策略" :value="0" /><el-option label="立即执行" :value="1" /><el-option label="忽略错失" :value="2" /></el-select></el-form-item>
        <el-form-item label="并发执行"><el-radio-group v-model="form.concurrent"><el-radio :value="1">允许</el-radio><el-radio :value="0">禁止</el-radio></el-radio-group></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio :value="1">运行</el-radio><el-radio :value="0">暂停</el-radio></el-radio-group></el-form-item>
        <el-form-item label="备注"><el-input v-model.trim="form.remark" type="textarea" maxlength="256" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button @click="formVisible = false">取消</el-button><el-button v-if="form.id" v-permission="'tool:job:edit'" type="primary" :loading="saving" @click="save">确定</el-button><el-button v-else v-permission="'tool:job:add'" type="primary" :loading="saving" @click="save">确定</el-button></template>
    </el-dialog>

    <el-dialog v-model="logVisible" :title="`${currentJobName} - 执行日志`" width="900px" destroy-on-close @closed="resetLogs">
      <PaginationTable v-model:page="logPage" v-model:page-size="logPageSize" :data="logRows" :loading="logLoading" :total="logTotal" @change="handleLogPageChange" @refresh="loadLogs">
        <el-table-column prop="id" label="编号" width="100" />
        <el-table-column prop="jobGroup" label="任务分组" min-width="110" />
        <el-table-column label="状态" width="86" align="center"><template #default="{ row }"><el-tag :type="Number(row.status) === 1 ? 'success' : 'danger'">{{ Number(row.status) === 1 ? '成功' : '失败' }}</el-tag></template></el-table-column>
        <el-table-column prop="message" label="执行消息" min-width="230" show-overflow-tooltip />
        <el-table-column prop="costMs" label="耗时(ms)" width="105" align="right" />
        <el-table-column prop="runTime" label="执行时间" min-width="170" />
      </PaginationTable>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import { createJob, getJobLogPage, getJobPage, pauseJob, removeJob, resumeJob, runJob, updateJob } from '@/api/job'
import { getJobStatusAction } from './job-page-utils.mjs'

const filters = reactive({ jobName: '', status: null })
const page = ref(1); const pageSize = ref(20); const rows = ref([]); const total = ref(0); const loading = ref(false)
const runningId = ref(null); const changingStatusId = ref(null); const deletingId = ref(null)
const formVisible = ref(false); const saving = ref(false); const formRef = ref()
const createEmptyForm = () => ({ id: null, jobName: '', jobGroup: 'DEFAULT', invokeTarget: '', cronExpression: '', misfirePolicy: 0, concurrent: 1, status: 1, remark: '' })
const form = reactive(createEmptyForm())
const logVisible = ref(false); const currentJobId = ref(null); const currentJobName = ref(''); const logPage = ref(1); const logPageSize = ref(20); const logRows = ref([]); const logTotal = ref(0); const logLoading = ref(false)
const hasRowAction = computed(() => runningId.value !== null || changingStatusId.value !== null || deletingId.value !== null)
const formRules = computed(() => ({ jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }], invokeTarget: [{ required: true, message: '请输入调用目标', trigger: 'blur' }], cronExpression: [{ required: Number(form.status) === 1, message: '运行中的任务必须填写 Cron 表达式', trigger: 'blur' }] }))

async function load() { loading.value = true; try { const result = await getJobPage({ pageIndex: page.value, pageSize: pageSize.value, jobName: filters.jobName || undefined, status: filters.status }); rows.value = result?.items || []; total.value = Number(result?.total || 0) } finally { loading.value = false } }
async function search() { page.value = 1; await load() }
async function resetSearch() { Object.assign(filters, { jobName: '', status: null }); await search() }
async function handlePageChange({ page: nextPage, pageSize: nextPageSize }) { page.value = nextPage; pageSize.value = nextPageSize; await load() }
function resetForm() { Object.assign(form, createEmptyForm()); formRef.value?.clearValidate() }
function openCreate() { resetForm(); formVisible.value = true }
function openEdit(row) { Object.assign(form, createEmptyForm(), row); formVisible.value = true }
async function save() { if (!await formRef.value.validate().catch(() => false)) return; saving.value = true; try { const payload = { ...form }; if (payload.id) await updateJob(payload); else await createJob(payload); ElMessage.success(payload.id ? '修改成功' : '新增成功'); formVisible.value = false; await load() } finally { saving.value = false } }
async function run(row) { if (hasRowAction.value) return; try { await ElMessageBox.confirm(`确认立即执行任务“${row.jobName}”吗？`, '执行确认', { type: 'warning' }); runningId.value = row.id; await runJob(row.id); ElMessage.success('任务已执行') } catch (error) { if (error !== 'cancel' && error !== 'close') throw error } finally { runningId.value = null } }
async function changeStatus(row) { if (hasRowAction.value) return; const action = getJobStatusAction(row.status); changingStatusId.value = row.id; try { if (action === 'pause') { await pauseJob(row.id); ElMessage.success('任务已暂停') } else { await resumeJob(row.id); ElMessage.success('任务已恢复') } await load() } finally { changingStatusId.value = null } }
async function remove(row) { if (hasRowAction.value) return; try { await ElMessageBox.confirm(`确认删除任务“${row.jobName}”吗？`, '删除确认', { type: 'warning' }); deletingId.value = row.id; await removeJob(row.id); if (rows.value.length === 1 && page.value > 1) page.value -= 1; ElMessage.success('删除成功'); await load() } catch (error) { if (error !== 'cancel' && error !== 'close') throw error } finally { deletingId.value = null } }
async function openLogs(row) { currentJobId.value = row.id; currentJobName.value = row.jobName; logPage.value = 1; logVisible.value = true; await loadLogs() }
async function loadLogs() { if (!currentJobId.value) return; logLoading.value = true; try { const result = await getJobLogPage({ pageIndex: logPage.value, pageSize: logPageSize.value, jobId: currentJobId.value }); logRows.value = result?.items || []; logTotal.value = Number(result?.total || 0) } finally { logLoading.value = false } }
async function handleLogPageChange({ page: nextPage, pageSize: nextPageSize }) { logPage.value = nextPage; logPageSize.value = nextPageSize; await loadLogs() }
function resetLogs() { currentJobId.value = null; currentJobName.value = ''; logRows.value = []; logTotal.value = 0 }
onMounted(load)
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.status-select { width: 110px; }
</style>
