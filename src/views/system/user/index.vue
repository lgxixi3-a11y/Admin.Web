<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="user-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="filters" class="search-form" @submit.prevent="search">
        <el-form-item label="用户名">
          <el-input v-model.trim="filters.userName" clearable placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model.trim="filters.nickName" clearable placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" class="status-select">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
          <el-button v-permission="'system:user:add'" type="primary" @click="openCreate">新增用户</el-button>
        </template>
        <el-table-column label="用户" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-nick">{{ row.nickName }}</span>
              <span class="user-name">@{{ row.userName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机" min-width="140" />
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <DictTag dict-type="sys_user_status" :value="row.status" :options="enabledStatusOptions" />
            <el-switch
              v-permission="'system:user:edit'"
              :model-value="Number(row.status) === 1"
              :loading="statusUpdatingIds.includes(row.id)"
              :disabled="statusUpdatingIds.includes(row.id)"
              class="status-switch"
              @change="value => changeStatus(row, value ? 1 : 0)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" fixed="right" min-width="270">
          <template #default="{ row }">
            <el-button v-permission="'system:user:edit'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'system:user:resetPwd'" link type="primary" @click="openPassword(row)">重置密码</el-button>
            <el-button v-permission="'system:user:assignRole'" link type="primary" @click="openRoles(row)">分配角色</el-button>
            <el-button
              v-permission="'system:user:del'"
              link
              type="danger"
              :loading="deletingId === row.id"
              :disabled="deletingId !== null"
              @click="remove(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </PaginationTable>
    </el-card>

    <UserFormDialog ref="userFormRef" :role-options="roleOptions" @saved="load" />
    <ResetPwdDialog ref="resetPwdRef" @saved="load" />
    <AssignRoleDialog ref="assignRoleRef" :role-options="roleOptions" @saved="load" />
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DictTag from '@/components/DictTag.vue'
import PaginationTable from '@/components/PaginationTable.vue'
import { changeUserStatus, getUserPage, removeUser } from '@/api/user'
import { getRolePage } from '@/api/role'
import { ENABLED_STATUS_OPTIONS, loadAllRoleOptions } from '../system-page-utils.mjs'
import UserFormDialog from './components/UserFormDialog.vue'
import ResetPwdDialog from './components/ResetPwdDialog.vue'
import AssignRoleDialog from './components/AssignRoleDialog.vue'

const enabledStatusOptions = ENABLED_STATUS_OPTIONS

const filters = reactive({ userName: '', nickName: '', status: null })
const page = ref(1)
const pageSize = ref(20)
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const roleOptions = ref([])
const statusUpdatingIds = ref([])
const deletingId = ref(null)
let loadGeneration = 0

const userFormRef = ref()
const resetPwdRef = ref()
const assignRoleRef = ref()

async function load() {
  const generation = ++loadGeneration
  const params = {
    pageIndex: page.value,
    pageSize: pageSize.value,
    userName: filters.userName || undefined,
    nickName: filters.nickName || undefined,
    status: filters.status
  }
  loading.value = true
  try {
    const result = await getUserPage(params)
    if (generation !== loadGeneration) return
    rows.value = result.items || []
    total.value = Number(result.total || 0)
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

async function loadRoleOptions() {
  roleOptions.value = await loadAllRoleOptions(getRolePage)
}

async function search() {
  page.value = 1
  await load()
}

async function resetSearch() {
  Object.assign(filters, { userName: '', nickName: '', status: null })
  await search()
}

async function handlePageChange({ page: nextPage, pageSize: nextPageSize }) {
  page.value = nextPage
  pageSize.value = nextPageSize
  await load()
}

function openCreate() {
  userFormRef.value.open(null)
}

function openEdit(row) {
  userFormRef.value.open(row)
}

function openPassword(row) {
  resetPwdRef.value.open(row)
}

function openRoles(row) {
  assignRoleRef.value.open(row)
}

async function changeStatus(row, status) {
  if (statusUpdatingIds.value.includes(row.id)) return
  statusUpdatingIds.value = [...statusUpdatingIds.value, row.id]
  try {
    await changeUserStatus({ id: row.id, status })
    await load()
    ElMessage.success('状态修改成功')
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter(id => id !== row.id)
  }
}

async function remove(row) {
  if (deletingId.value !== null) return
  deletingId.value = row.id
  try {
    await ElMessageBox.confirm(`确认删除用户“${row.nickName || row.userName}”吗？`, '删除确认', { type: 'warning' })
    await removeUser(row.id)
    if (rows.value.length === 1 && page.value > 1) page.value -= 1
    await load()
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  await Promise.all([load(), loadRoleOptions()])
})
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
  width: 110px;
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

.status-switch {
  margin-left: 8px;
}
</style>
