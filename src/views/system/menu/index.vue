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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" maxlength="64" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio :label="1">目录</el-radio>
                <el-radio :label="2">菜单</el-radio>
                <el-radio :label="3">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="parentTree"
            :props="treeSelectProps"
            node-key="id"
            check-strictly
            default-expand-all
            style="width: 100%"
          />
        </el-form-item>

        <el-row v-if="requirements.path || requirements.component" :gutter="16">
          <el-col v-if="requirements.path" :span="12">
            <el-form-item label="路由路径" prop="path">
              <el-input v-model="form.path" maxlength="128" placeholder="例如：system/menu" />
            </el-form-item>
          </el-col>
          <el-col v-if="requirements.component" :span="12">
            <el-form-item label="组件路径" prop="component">
              <el-input v-model="form.component" maxlength="128" placeholder="例如：system/menu/index" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="requirements.perms" :gutter="16">
          <el-col :span="12">
            <el-form-item label="权限标识" prop="perms">
              <el-input v-model="form.perms" maxlength="128" placeholder="例如：system:menu:add" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="form.menuType !== 3" :gutter="16">
          <el-col :span="12">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="form.icon" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-else label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示状态" prop="visible">
              <el-radio-group v-model="form.visible">
                <el-radio :label="1">显示</el-radio>
                <el-radio :label="0">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="form.menuType !== 3" :gutter="16">
          <el-col :span="12">
            <el-form-item label="外链" prop="isFrame">
              <el-radio-group v-model="form.isFrame">
                <el-radio :label="0">否</el-radio>
                <el-radio :label="1">是</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="缓存" prop="cacheFlag">
              <el-radio-group v-model="form.cacheFlag">
                <el-radio :label="1">缓存</el-radio>
                <el-radio :label="0">不缓存</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="form.id"
          v-permission="'system:menu:edit'"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >保存</el-button>
        <el-button
          v-else
          v-permission="'system:menu:add'"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script>
export default { name: 'SystemMenuPage' }
</script>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import DictTag from '@/components/DictTag.vue'
import { createMenu, getMenu, getMenuTree, removeMenu, updateMenu } from '@/api/menu'
import { ENABLED_STATUS_OPTIONS, getMenuFieldRequirements, sanitizeMenuFields } from '../system-page-utils.mjs'

const enabledStatusOptions = ENABLED_STATUS_OPTIONS

const defaultForm = () => ({
  id: null,
  parentId: 0,
  menuName: '',
  menuType: 1,
  path: '',
  component: '',
  perms: '',
  icon: '',
  sort: 0,
  status: 1,
  isFrame: 0,
  visible: 1,
  cacheFlag: 1
})

const rows = ref([])
const loading = ref(false)
const deletingId = ref(null)
let loadGeneration = 0
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const form = reactive(defaultForm())
const menuTableProps = { rowKey: 'id', treeProps: { children: 'children' }, defaultExpandAll: true }
const menuTypeLabels = { 1: '目录', 2: '菜单', 3: '按钮' }
const treeSelectProps = { value: 'id', label: 'menuName', children: 'children' }

const requirements = computed(() => getMenuFieldRequirements(form.menuType))
const rules = computed(() => ({
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  parentId: [{ required: true, validator: validateParent, trigger: 'change' }],
  path: [{ required: requirements.value.path, message: '请输入路由路径', trigger: 'blur' }],
  component: [{ required: requirements.value.component, message: '请输入组件路径', trigger: 'blur' }],
  perms: [{ required: requirements.value.perms, message: '请输入权限标识', trigger: 'blur' }]
}))

const parentTree = computed(() => [{
  id: 0,
  menuName: '根目录',
  children: filterParentNodes(rows.value, form.id, form.menuType)
}])
const dialogTitle = computed(() => form.id ? '编辑菜单' : '新增菜单')

watch(() => form.menuType, type => {
  Object.assign(form, sanitizeMenuFields(form, type))
  clearInvalidParent(type)
  formRef.value?.clearValidate(['path', 'component', 'perms', 'parentId'])
})

function findMenuNode(nodes, id) {
  for (const node of nodes || []) {
    if (String(node.id) === String(id)) return node
    const child = findMenuNode(node.children, id)
    if (child) return child
  }
  return null
}

function isParentAllowed(parentId, menuType) {
  if (parentId === null || parentId === undefined || parentId === '') return false
  if (Number(parentId) === 0) return menuType !== 3
  const parent = findMenuNode(rows.value, parentId)
  if (!parent || parent.menuType === 3) return false
  return menuType !== 3 || parent.menuType === 2
}

function clearInvalidParent(menuType) {
  if (!isParentAllowed(form.parentId, menuType)) form.parentId = null
}

function validateParent(rule, value, callback) {
  if (isParentAllowed(value, form.menuType)) {
    callback()
    return
  }
  callback(new Error(form.menuType === 3 ? '按钮必须选择菜单类型的上级菜单' : '请选择有效的上级菜单'))
}

function descendantIds(nodes, currentId) {
  const found = new Set()
  function visit(items, withinCurrent = false) {
    for (const item of items || []) {
      const isCurrent = withinCurrent || item.id === currentId
      if (isCurrent) found.add(item.id)
      visit(item.children, isCurrent)
    }
  }
  visit(nodes)
  return found
}

function filterParentNodes(nodes, currentId, menuType) {
  const excludedIds = currentId ? descendantIds(nodes, currentId) : new Set()

  function visit(items) {
    return (items || []).flatMap(item => {
      if (excludedIds.has(item.id) || item.menuType === 3) return []
      const children = visit(item.children)
      if (menuType === 3 && item.menuType !== 2) return children
      return [{ ...item, children }]
    })
  }

  return visit(nodes)
}

function resetForm(parentId = 0) {
  Object.assign(form, defaultForm(), { parentId })
  formRef.value?.clearValidate()
}

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

async function openCreate(parent = null) {
  resetForm(parent?.id || 0)
  clearInvalidParent(form.menuType)
  dialogVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

async function openEdit(row) {
  const detail = await getMenu(row.id)
  Object.assign(form, defaultForm(), detail)
  Object.assign(form, sanitizeMenuFields(form, form.menuType))
  dialogVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

async function handleSave() {
  if (!isParentAllowed(form.parentId, form.menuType)) {
    form.parentId = null
    await formRef.value?.validateField('parentId').catch(() => false)
    return
  }
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = sanitizeMenuFields(form, form.menuType)
    if (payload.id) await updateMenu(payload)
    else await createMenu(payload)
    ElMessage.success(payload.id ? '修改成功' : '新增成功')
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
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
