<template>
  <section class="menu-page">
    <PaginationTable
      :data="rows"
      :loading="loading"
      :show-pagination="false"
      :table-props="menuTableProps"
      @refresh="load"
    >
      <template #toolbar>
        <h2>菜单管理</h2>
        <el-button v-permission="'system:menu:add'" type="primary" @click="openCreate()">新增</el-button>
      </template>

      <el-table-column prop="menuName" label="菜单名称" min-width="180" />
      <el-table-column prop="icon" label="图标" min-width="100" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">{{ menuTypeLabels[row.menuType] }}</template>
      </el-table-column>
      <el-table-column prop="path" label="路由路径" min-width="150" />
      <el-table-column prop="component" label="组件" min-width="180" />
      <el-table-column prop="perms" label="权限标识" min-width="180" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <DictTag dict-type="sys_user_status" :value="row.status" :options="enabledStatusOptions" />
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="230">
        <template #default="{ row }">
          <el-button v-permission="'system:menu:add'" link type="primary" @click="openCreate(row)">新增子项</el-button>
          <el-button v-permission="'system:menu:edit'" link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button
            v-permission="'system:menu:del'"
            link
            type="danger"
            :loading="deletingId === row.id"
            :disabled="deletingId !== null"
            @click="handleDelete(row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </PaginationTable>

    <MenuFormDialog ref="menuFormRef" :menu-tree="rows" @saved="load" />
  </section>
</template>

<script>
export default { name: 'SystemMenuPage' }
</script>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import DictTag from '@/components/DictTag.vue'
import { getMenuTree, removeMenu } from '@/api/menu'
import { ENABLED_STATUS_OPTIONS } from '../system-page-utils.mjs'
import MenuFormDialog from './components/MenuFormDialog.vue'

const enabledStatusOptions = ENABLED_STATUS_OPTIONS

const rows = ref([])
const loading = ref(false)
const deletingId = ref(null)
let loadGeneration = 0

const menuFormRef = ref()
const menuTableProps = { rowKey: 'id', treeProps: { children: 'children' }, defaultExpandAll: true }
const menuTypeLabels = { 1: '目录', 2: '菜单', 3: '按钮' }

async function load() {
  const generation = ++loadGeneration
  loading.value = true
  try {
    const result = await getMenuTree()
    if (generation !== loadGeneration) return
    rows.value = result
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

function openCreate(parent = null) {
  menuFormRef.value.open(parent, null)
}

function openEdit(row) {
  menuFormRef.value.open(null, row)
}

async function handleDelete(row) {
  if (deletingId.value !== null) return
  deletingId.value = row.id
  try {
    await ElMessageBox.confirm(`确认删除菜单“${row.menuName}”吗？`, '提示', { type: 'warning' })
    await removeMenu(row.id)
    ElMessage.success('删除成功')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    deletingId.value = null
  }
}

load()
</script>

<style scoped>
.menu-page h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
</style>
