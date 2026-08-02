<template>
  <div class="app-container">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="filters" @submit.prevent="search">
        <el-form-item label="角色名称">
          <el-input v-model.trim="filters.roleName" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable>
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
        <el-table-column prop="roleKey" label="角色标识" min-width="140" />
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

    <el-dialog v-model="formVisible" :title="form.id ? '编辑角色' : '新增角色'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model.trim="form.roleName" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="角色标识" prop="roleKey">
          <el-input v-model.trim="form.roleKey" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="256" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button
          v-if="form.id"
          v-permission="'system:role:edit'"
          type="primary"
          :loading="saving"
          @click="saveRole"
        >确定</el-button>
        <el-button
          v-else
          v-permission="'system:role:add'"
          type="primary"
          :loading="saving"
          @click="saveRole"
        >确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="menuVisible" title="分配菜单" width="520px" destroy-on-close>
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        show-checkbox
        node-key="id"
        :props="{ label: 'menuName', children: 'children' }"
        default-expand-all
      />
      <template #footer>
        <el-button @click="menuVisible = false">取消</el-button>
        <el-button
          v-permission="'system:role:assignMenu'"
          type="primary"
          :loading="menuSaving"
          @click="saveMenus"
        >确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default { name: 'SystemRolePage' }
</script>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import DictTag from '@/components/DictTag.vue'
import { assignRoleMenus, createRole, getRole, getRolePage, removeRole, updateRole } from '@/api/role'
import { getMenuTree } from '@/api/menu'
import { ENABLED_STATUS_OPTIONS, getLeafCheckedKeys, mergeMenuKeys } from '../system-page-utils.mjs'

const enabledStatusOptions = ENABLED_STATUS_OPTIONS

const filters = reactive({ roleName: '', status: null })
const page = ref(1)
const pageSize = ref(20)
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const deletingRoleId = ref(null)
let loadGeneration = 0

const formRef = ref()
const formVisible = ref(false)
const saving = ref(false)
const form = reactive({ id: null, roleName: '', roleKey: '', sort: 0, status: 1, remark: '' })
const rules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 64, message: '角色名称不能超过 64 个字符', trigger: 'blur' }
  ],
  roleKey: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { max: 64, message: '角色标识不能超过 64 个字符', trigger: 'blur' }
  ]
}

const menuTreeRef = ref()
const menuVisible = ref(false)
const menuSaving = ref(false)
const menuTree = ref([])
const currentRoleId = ref(null)

function resetForm() {
  Object.assign(form, { id: null, roleName: '', roleKey: '', sort: 0, status: 1, remark: '' })
}

async function load() {
  const generation = ++loadGeneration
  const params = {
    pageIndex: page.value,
    pageSize: pageSize.value,
    roleName: filters.roleName,
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

async function openCreate() {
  resetForm()
  formVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

async function openEdit(row) {
  const detail = await getRole(row.id)
  Object.assign(form, {
    id: detail.id,
    roleName: detail.roleName || '',
    roleKey: detail.roleKey || '',
    sort: detail.sort ?? 0,
    status: detail.status ?? 1,
    remark: detail.remark || ''
  })
  formVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

async function saveRole() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    const payload = { ...form }
    if (payload.id) await updateRole(payload)
    else await createRole(payload)
    ElMessage.success(payload.id ? '修改成功' : '新增成功')
    formVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
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

async function openAssignMenus(row) {
  const [detail, tree] = await Promise.all([getRole(row.id), getMenuTree()])
  currentRoleId.value = row.id
  menuTree.value = tree || []
  menuVisible.value = true
  await nextTick()
  menuTreeRef.value.setCheckedKeys(getLeafCheckedKeys(menuTree.value, detail.menuIds || []))
}

async function saveMenus() {
  const checked = menuTreeRef.value.getCheckedKeys()
  const halfChecked = menuTreeRef.value.getHalfCheckedKeys()
  const menuIds = mergeMenuKeys(checked, halfChecked)
  menuSaving.value = true
  try {
    await assignRoleMenus({ roleId: currentRoleId.value, menuIds })
    ElMessage.success('菜单分配成功')
    menuVisible.value = false
    await load()
  } finally {
    menuSaving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}
</style>
