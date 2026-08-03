<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="job-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="filters" class="search-form" @submit.prevent="search">
        <el-form-item label="任务名称">
          <el-input v-model.trim="filters.jobName" clearable placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" class="status-select">
            <el-option label="运行中" :value="1" />
            <el-option label="已暂停" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <PaginationTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :data="rows"
        :loading="loading"
        :total="total"
        @change="handlePageChange"
        @refresh="load"
      >
        <template #toolbar>
          <el-button v-permission="'tool:job:add'" type="primary" @click="openCreate">新增任务</el-button>
        </template>
        <el-table-column prop="jobName" label="任务名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="jobGroup" label="任务分组" min-width="110" />
        <el-table-column prop="invokeTarget" label="调用目标" min-width="220" show-overflow-tooltip />
        <el-table-column label="Cron 表达式" min-width="165">
          <template #default="{ row }">
            <el-tag effect="plain" size="small" class="cron-tag">{{ row.cronExpression }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="并发" width="90" align="center">
          <template #default="{ row }">{{ Number(row.concurrent) === 1 ? '允许' : '禁止' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="92" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'info'">
              {{ Number(row.status) === 1 ? '运行中' : '已暂停' }}
            </el-tag>
          </template>
        </el-table-column>
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

    <JobFormDialog ref="jobFormRef" @saved="load" />
    <JobLogDialog ref="jobLogRef" />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import { getJobPage, pauseJob, removeJob, resumeJob, runJob } from '@/api/job'
import { getJobStatusAction } from './job-page-utils.mjs'
import JobFormDialog from './components/JobFormDialog.vue'
import JobLogDialog from './components/JobLogDialog.vue'

const filters = reactive({ jobName: '', status: null })
const page = ref(1)
const pageSize = ref(20)
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const runningId = ref(null)
const changingStatusId = ref(null)
const deletingId = ref(null)

const jobFormRef = ref()
const jobLogRef = ref()

const hasRowAction = computed(() => runningId.value !== null || changingStatusId.value !== null || deletingId.value !== null)

async function load() {
  loading.value = true
  try {
    const result = await getJobPage({
      pageIndex: page.value,
      pageSize: pageSize.value,
      jobName: filters.jobName || undefined,
      status: filters.status
    })
    rows.value = result?.items || []
    total.value = Number(result?.total || 0)
  } finally {
    loading.value = false
  }
}

async function search() {
  page.value = 1
  await load()
}

async function resetSearch() {
  Object.assign(filters, { jobName: '', status: null })
  await search()
}

async function handlePageChange({ page: nextPage, pageSize: nextPageSize }) {
  page.value = nextPage
  pageSize.value = nextPageSize
  await load()
}

function openCreate() {
  jobFormRef.value.open(null)
}

function openEdit(row) {
  jobFormRef.value.open(row)
}

function openLogs(row) {
  jobLogRef.value.open(row)
}

async function run(row) {
  if (hasRowAction.value) return
  try {
    await ElMessageBox.confirm(`确认立即执行任务“${row.jobName}”吗？`, '执行确认', { type: 'warning' })
    runningId.value = row.id
    await runJob(row.id)
    ElMessage.success('任务已执行')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    runningId.value = null
  }
}

async function changeStatus(row) {
  if (hasRowAction.value) return
  const action = getJobStatusAction(row.status)
  changingStatusId.value = row.id
  try {
    if (action === 'pause') {
      await pauseJob(row.id)
      ElMessage.success('任务已暂停')
    } else {
      await resumeJob(row.id)
      ElMessage.success('任务已恢复')
    }
    await load()
  } finally {
    changingStatusId.value = null
  }
}

async function remove(row) {
  if (hasRowAction.value) return
  try {
    await ElMessageBox.confirm(`确认删除任务“${row.jobName}”吗？`, '删除确认', { type: 'warning' })
    deletingId.value = row.id
    await removeJob(row.id)
    if (rows.value.length === 1 && page.value > 1) page.value -= 1
    ElMessage.success('删除成功')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    deletingId.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 12px;
  margin-right: 14px;
}

.search-form :deep(.el-input) {
  width: 180px;
}

.status-select {
  width: 110px;
}

.cron-tag {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>
