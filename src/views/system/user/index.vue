<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="user-page">
    <el-card class="search-card">
      <el-form :inline="true" :model="filters" @submit.prevent="search">
        <el-form-item label="用户名">
          <el-input v-model.trim="filters.userName" clearable />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model.trim="filters.nickName" clearable />
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

    <el-card>
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
        <el-table-column prop="userName" label="用户名" min-width="120" />
        <el-table-column prop="nickName" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
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

    <el-dialog v-model="formVisible" :title="form.id ? '编辑用户' : '新增用户'" width="620px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="88px">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model.trim="form.userName" :disabled="Boolean(form.id)" maxlength="64" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model.trim="form.nickName" maxlength="64" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="new-password" maxlength="64" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model.trim="form.email" maxlength="128" />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model.trim="form.phone" maxlength="32" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple clearable placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in roleOptions" :key="role.id" :label="role.roleName" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model.trim="form.remark" type="textarea" maxlength="256" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button
          v-if="form.id"
          v-permission="'system:user:edit'"
          type="primary"
          :loading="saving"
          @click="saveUser"
        >确定</el-button>
        <el-button
          v-else
          v-permission="'system:user:add'"
          type="primary"
          :loading="saving"
          @click="saveUser"
        >确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordVisible" title="重置密码" width="460px" @closed="resetPasswordForm">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="88px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" show-password autocomplete="new-password" maxlength="64" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordVisible = false">取消</el-button>
        <el-button
          v-permission="'system:user:resetPwd'"
          type="primary"
          :loading="passwordSaving"
          @click="savePassword"
        >确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleVisible" title="分配角色" width="460px">
      <el-form label-width="88px">
        <el-form-item label="用户">
          <span>{{ currentUserName }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="assignedRoleIds" multiple clearable placeholder="请选择角色" style="width: 100%">
            <el-option v-for="role in roleOptions" :key="role.id" :label="role.roleName" :value="role.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleVisible = false">取消</el-button>
        <el-button
          v-permission="'system:user:assignRole'"
          type="primary"
          :loading="roleSaving"
          @click="saveRoles"
        >确定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DictTag from '@/components/DictTag.vue'
import PaginationTable from '@/components/PaginationTable.vue'
import {
  assignUserRoles,
  changeUserStatus,
  createUser,
  getUser,
  getUserPage,
  removeUser,
  resetUserPwd,
  updateUser
} from '@/api/user'
import { getRolePage } from '@/api/role'
import { ENABLED_STATUS_OPTIONS, loadAllRoleOptions } from '../system-page-utils.mjs'

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

const formVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const createEmptyForm = () => ({
  id: null,
  userName: '',
  nickName: '',
  password: '',
  email: '',
  phone: '',
  status: 1,
  remark: '',
  roleIds: []
})
const form = reactive(createEmptyForm())

const passwordVisible = ref(false)
const passwordSaving = ref(false)
const passwordFormRef = ref()
const passwordForm = reactive({ id: null, password: '' })

const roleVisible = ref(false)
const roleSaving = ref(false)
const currentUserId = ref(null)
const currentUserName = ref('')
const assignedRoleIds = ref([])

const formRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 64, message: '用户名长度为 4 到 64 个字符', trigger: 'blur' }
  ],
  nickName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, min: 6, max: 64, message: '密码长度为 6 到 64 个字符', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  phone: [{ max: 32, message: '手机号长度不能超过 32 个字符', trigger: 'blur' }]
}

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度为 6 到 64 个字符', trigger: 'blur' }
  ]
}

async function load() {
  const generation = ++loadGeneration
  const params = {
    pageIndex: page.value,
    pageSize: pageSize.value,
    userName: filters.userName,
    nickName: filters.nickName,
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

function resetForm() {
  Object.assign(form, createEmptyForm())
  formRef.value?.clearValidate()
}

function openCreate() {
  resetForm()
  formVisible.value = true
}

async function openEdit(row) {
  const detail = await getUser(row.id)
  Object.assign(form, createEmptyForm(), detail, { roleIds: [...(detail.roleIds || [])] })
  formVisible.value = true
}

async function saveUser() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    const payload = { ...form, roleIds: [...form.roleIds] }
    if (payload.id) {
      delete payload.password
      await updateUser(payload)
    } else {
      await createUser(payload)
    }
    ElMessage.success(payload.id ? '修改成功' : '新增成功')
    formVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

function resetPasswordForm() {
  Object.assign(passwordForm, { id: null, password: '' })
  passwordFormRef.value?.clearValidate()
}

async function openPassword(row) {
  const detail = await getUser(row.id)
  Object.assign(passwordForm, { id: detail.id, password: '' })
  passwordVisible.value = true
}

async function savePassword() {
  if (!await passwordFormRef.value.validate().catch(() => false)) return
  passwordSaving.value = true
  try {
    await resetUserPwd({ id: passwordForm.id, password: passwordForm.password })
    passwordVisible.value = false
    await load()
    ElMessage.success('密码重置成功')
  } finally {
    passwordSaving.value = false
  }
}

async function openRoles(row) {
  const detail = await getUser(row.id)
  currentUserId.value = detail.id
  currentUserName.value = detail.userName
  assignedRoleIds.value = [...(detail.roleIds || [])]
  roleVisible.value = true
}

async function saveRoles() {
  roleSaving.value = true
  try {
    await assignUserRoles({ userId: currentUserId.value, roleIds: [...assignedRoleIds.value] })
    ElMessage.success('角色分配成功')
    roleVisible.value = false
    await load()
  } finally {
    roleSaving.value = false
  }
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
    await ElMessageBox.confirm(`确认删除用户“${row.userName}”吗？`, '删除确认', { type: 'warning' })
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

.status-switch {
  margin-left: 8px;
}
</style>
