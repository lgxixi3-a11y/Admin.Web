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
        <el-form-item label="登录时间">
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
          <el-button v-permission="'log:login:clean'" type="danger" :loading="clearing" @click="cleanLogs">
            清理日志
          </el-button>
        </template>
        <el-table-column prop="id" label="编号" width="90" />
        <el-table-column prop="userName" label="用户名" min-width="120" show-overflow-tooltip />
        <el-table-column prop="ipAddr" label="登录 IP" min-width="130" />
        <el-table-column prop="location" label="登录地点" min-width="120" show-overflow-tooltip />
        <el-table-column prop="browser" label="浏览器" min-width="120" show-overflow-tooltip />
        <el-table-column prop="os" label="操作系统" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="88" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'danger'" size="small">
              {{ Number(row.status) === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="提示消息" min-width="180" show-overflow-tooltip />
        <el-table-column prop="loginTime" label="登录时间" min-width="170" />
      </PaginationTable>
    </el-card>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import { clearLoginLogs, getLoginLogPage } from '@/api/log'

const filters = reactive({ userName: '', status: null, dateRange: [] })
const page = ref(1)
const pageSize = ref(20)
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const clearing = ref(false)
let loadGeneration = 0

const tableProps = { stripe: true }

function getTimeRange() {
  const [beginDate, endDate] = filters.dateRange || []
  return {
    beginTime: beginDate ? `${beginDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined
  }
}

async function load() {
  const generation = ++loadGeneration
  loading.value = true
  try {
    const result = await getLoginLogPage({
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

async function cleanLogs() {
  if (clearing.value) return
  try {
    const { value } = await ElMessageBox.prompt('请输入日志保留天数，早于该天数的日志将被清理。', '清理登录日志', {
      confirmButtonText: '确认清理',
      cancelButtonText: '取消',
      inputValue: '30',
      inputPattern: /^[1-9]\d*$/,
      inputErrorMessage: '请输入大于 0 的整数天数',
      type: 'warning'
    })
    clearing.value = true
    const removed = await clearLoginLogs({ retainDays: Number(value) })
    ElMessage.success(`清理完成，共删除 ${Number(removed || 0)} 条登录日志`)
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

.status-select {
  width: 100px;
}
</style>
