<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="log-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="filters" @submit.prevent="search">
        <el-form-item label="用户名">
          <el-input v-model.trim="filters.userName" clearable placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" class="status-select">
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
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
        :table-props="tableProps"
        @change="handlePageChange"
        @refresh="load"
      >
        <template #toolbar>
          <el-button v-permission="'log:oper:clean'" type="danger" :loading="clearing" @click="cleanLogs">
            清理日志
          </el-button>
        </template>
        <el-table-column prop="id" label="编号" width="90" />
        <el-table-column label="用户" min-width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <span v-if="row.nickName" class="user-nick">{{ row.nickName }}</span>
              <span class="user-name">@{{ row.userName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" min-width="110" show-overflow-tooltip />
        <el-table-column prop="action" label="操作" min-width="120" show-overflow-tooltip />
        <el-table-column prop="requestMethod" label="请求方式" width="105" />
        <el-table-column prop="url" label="请求地址" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作 IP" min-width="130">
          <template #default="{ row }">
            <span>{{ row.ipAddr || '—' }}</span>
            <el-tag v-if="isInternalIp(row.ipAddr)" size="small" type="info" class="ip-tag">内网</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="浏览器" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">{{ row.browser || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="88" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'danger'" size="small">
              {{ Number(row.status) === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="costMs" label="耗时(ms)" width="105" align="right" />
        <el-table-column prop="operTime" label="操作时间" min-width="170" />
        <el-table-column label="操作" width="84" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :loading="detailLoading && detailId === row.id" @click="openDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </PaginationTable>
    </el-card>

    <el-dialog v-model="detailVisible" title="操作日志详情" width="820px" destroy-on-close>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="用户">{{ detail.nickName ? `${detail.nickName} (@${detail.userName})` : (detail.userName || '-') }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ Number(detail.status) === 1 ? '成功' : '失败' }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ detail.module || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ detail.action || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求方式">{{ detail.requestMethod || detail.method || '-' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detail.costMs ?? '-' }} ms</el-descriptions-item>
        <el-descriptions-item label="请求地址" :span="2">{{ detail.url || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作 IP">{{ detail.ipAddr || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作地点">{{ formatLocation(detail.location) }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ detail.browser || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ detail.os || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ detail.operTime || '-' }}</el-descriptions-item>
      </el-descriptions>
      <section v-if="detail" class="json-section">
        <h4>请求参数</h4>
        <pre>{{ formatJson(detail.requestParam) }}</pre>
      </section>
      <section v-if="detail" class="json-section">
        <h4>错误信息</h4>
        <pre>{{ formatJson(detail.errorMsg) }}</pre>
      </section>
    </el-dialog>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import { clearOperLogs, getOperLogDetail, getOperLogPage } from '@/api/log'

const filters = reactive({ userName: '', status: null, dateRange: [] })
const page = ref(1)
const pageSize = ref(20)
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const clearing = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailId = ref(null)
const detail = ref(null)
let loadGeneration = 0

const tableProps = { stripe: true }

function isInternalIp(ip) {
  if (!ip) return false
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)
}

function formatLocation(location) {
  if (!location) return '—'
  if (location.startsWith('Reserved')) return '内网地址'
  return location.split('|').slice(0, 4).filter(p => p && p !== '0').join(' ')
}

function getTimeRange() {
  const [beginDate, endDate] = filters.dateRange || []
  return {
    beginTime: beginDate ? `${beginDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined
  }
}

function formatJson(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch (_) {
    return String(value)
  }
}

async function load() {
  const generation = ++loadGeneration
  loading.value = true
  try {
    const result = await getOperLogPage({
      pageIndex: page.value,
      pageSize: pageSize.value,
      userName: filters.userName || undefined,
      status: filters.status,
      ...getTimeRange()
    })
    if (generation !== loadGeneration) return
    rows.value = result?.items || []
    total.value = Number(result?.total || 0)
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

async function search() {
  page.value = 1
  await load()
}

async function resetSearch() {
  Object.assign(filters, { userName: '', status: null, dateRange: [] })
  await search()
}

async function handlePageChange({ page: nextPage, pageSize: nextPageSize }) {
  page.value = nextPage
  pageSize.value = nextPageSize
  await load()
}

async function openDetail(row) {
  if (detailLoading.value) return
  detailId.value = row.id
  detailLoading.value = true
  try {
    detail.value = await getOperLogDetail(row.id)
    detailVisible.value = true
  } finally {
    detailLoading.value = false
    detailId.value = null
  }
}

async function cleanLogs() {
  if (clearing.value) return
  try {
    const { value } = await ElMessageBox.prompt('请输入日志保留天数，早于该天数的日志将被清理。', '清理操作日志', {
      confirmButtonText: '确认清理',
      cancelButtonText: '取消',
      inputValue: '30',
      inputPattern: /^[1-9]\d*$/,
      inputErrorMessage: '请输入大于 0 的整数天数',
      type: 'warning'
    })
    clearing.value = true
    const removed = await clearOperLogs({ retainDays: Number(value) })
    ElMessage.success(`清理完成，共删除 ${Number(removed || 0)} 条操作日志`)
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    clearing.value = false
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
  width: 170px;
}

.status-select {
  width: 100px;
}

.user-cell {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.user-nick {
  font-weight: 500;
}

.user-name {
  color: #909399;
  font-size: 12px;
}

.ip-tag {
  margin-left: 6px;
}

.json-section {
  margin-top: 20px;
}

.json-section h4 {
  margin: 0 0 8px;
}

.json-section pre {
  max-height: 260px;
  margin: 0;
  overflow: auto;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
