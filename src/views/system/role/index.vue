<template>
  <div class="app-container">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="filters" class="search-form" @submit.prevent="search">
        <el-form-item label="角色名称">
          <el-input v-model.trim="filters.roleName" clearable placeholder="请输入角色名称" />
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
          <el-button v-permission="'system:role:add'" type="primary" @click="openCreate">新增角色</el-button>
        </template>
        <el-table-column prop="roleName" label="角色名称" min-width="140" />
        <el-table-column prop="roleKey" label="角色标识" min-width="140">
          <template #default="{ row }">
            <el-tag effect="plain" size="small">{{ row.roleKey }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <DictTag dict-type="sys_user_status" :value="row.status" :options="enabledStatusOptions" />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'system:role:edit'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'system:role:assignMenu'" link type="primary" @click="openAssignMenus(row)">分配菜单</el-button>
            <el-button
              v-permission="'system:role:del'"
              link
              type="danger"
              :loading="deletingRoleId === row.id"
              :disabled="deletingRoleId !== null"
              @click="remove(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </PaginationTable>
    </el-card>

    <RoleFormDialog ref="roleFormRef" @saved="load" />
    <AssignMenuDialog ref="assignMenuRef" @saved="load" />
  </div>
</template>

<script>
export default { name: 'SystemRolePage' }
</script>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import DictTag from '@/components/DictTag.vue'
import { getRolePage, removeRole } from '@/api/role'
import { ENABLED_STATUS_OPTIONS } from '../system-page-utils.mjs'
import RoleFormDialog from './components/RoleFormDialog.vue'
import AssignMenuDialog from './components/AssignMenuDialog.vue'

const enabledStatusOptions = ENABLED_STATUS_OPTIONS

const filters = reactive({ roleName: '', status: null })
const page = ref(1)
const pageSize = ref(20)
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const deletingRoleId = ref(null)
let loadGeneration = 0

const roleFormRef = ref()
const assignMenuRef = ref()

async function load() {
  const generation = ++loadGeneration
  const params = {
    pageIndex: page.value,
    pageSize: pageSize.value,
    roleName: filters.roleName || undefined,
    status: filters.status
  }
  loading.value = true
  try {
    const result = await getRolePage(params)
    if (generation !== loadGeneration) return
    rows.value = result.items || []
    total.value = Number(result.total || 0)
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

async function search() {
  page.value = 1
  await load()
}

async function resetSearch() {
  Object.assign(filters, { roleName: '', status: null })
  await search()
}

async function handlePageChange({ page: nextPage, pageSize: nextPageSize }) {
  page.value = nextPage
  pageSize.value = nextPageSize
  await load()
}

function openCreate() {
  roleFormRef.value.open(null)
}

function openEdit(row) {
  roleFormRef.value.open(row)
}

function openAssignMenus(row) {
  assignMenuRef.value.open(row)
}

async function remove(row) {
  if (deletingRoleId.value !== null) return
  deletingRoleId.value = row.id
  try {
    await ElMessageBox.confirm(`确认删除角色“${row.roleName}”吗？`, '删除确认', { type: 'warning' })
    await removeRole(row.id)
    if (rows.value.length === 1 && page.value > 1) page.value -= 1
    ElMessage.success('删除成功')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    deletingRoleId.value = null
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
  width: 110px;
}
</style>
