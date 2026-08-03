<template>
  <el-dialog v-model="visible" :title="`${currentJobName} - 执行日志`" width="900px" destroy-on-close @closed="resetLogs">
    <PaginationTable
      v-model:page="logPage"
      v-model:page-size="logPageSize"
      :data="logRows"
      :loading="logLoading"
      :total="logTotal"
      @change="handleLogPageChange"
      @refresh="loadLogs"
    >
      <el-table-column prop="id" label="编号" width="100" />
      <el-table-column prop="jobGroup" label="任务分组" min-width="110" />
      <el-table-column label="状态" width="86" align="center">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 1 ? 'success' : 'danger'">
            {{ Number(row.status) === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="执行消息" min-width="230" show-overflow-tooltip />
      <el-table-column prop="costMs" label="耗时(ms)" width="105" align="right" />
      <el-table-column prop="runTime" label="执行时间" min-width="170" />
    </PaginationTable>
  </el-dialog>
</template>

<script setup>
/* global defineExpose */
import { ref } from 'vue'
import PaginationTable from '@/components/PaginationTable.vue'
import { getJobLogPage } from '@/api/job'

const visible = ref(false)
const currentJobId = ref(null)
const currentJobName = ref('')
const logPage = ref(1)
const logPageSize = ref(20)
const logRows = ref([])
const logTotal = ref(0)
const logLoading = ref(false)

async function open(row) {
  currentJobId.value = row.id
  currentJobName.value = row.jobName
  logPage.value = 1
  visible.value = true
  await loadLogs()
}

async function loadLogs() {
  if (!currentJobId.value) return
  logLoading.value = true
  try {
    const result = await getJobLogPage({ pageIndex: logPage.value, pageSize: logPageSize.value, jobId: currentJobId.value })
    logRows.value = result?.items || []
    logTotal.value = Number(result?.total || 0)
  } finally {
    logLoading.value = false
  }
}

async function handleLogPageChange({ page: nextPage, pageSize: nextPageSize }) {
  logPage.value = nextPage
  logPageSize.value = nextPageSize
  await loadLogs()
}

function resetLogs() {
  currentJobId.value = null
  currentJobName.value = ''
  logRows.value = []
  logTotal.value = 0
}

defineExpose({ open })
</script>
