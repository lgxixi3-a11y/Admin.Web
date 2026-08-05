<template>
  <el-drawer
    v-model="visible"
    title="分配菜单权限"
    size="520px"
    destroy-on-close
    @closed="resetTree"
  >
    <div class="assign-menu-header">
      <el-input
        v-model.trim="keyword"
        placeholder="按菜单名称 / 权限码搜索"
        clearable
        class="assign-menu-search"
        @input="onSearch"
      />
      <div class="assign-menu-actions">
        <el-button link type="primary" @click="expandAll">全部展开</el-button>
        <el-button link @click="collapseAll">全部折叠</el-button>
      </div>
    </div>

    <div class="assign-menu-tip">
      勾选权限菜单（按钮权限请一并勾选，父级目录会自动半选）
    </div>

    <el-tree
      ref="treeRef"
      :data="menuTree"
      show-checkbox
      node-key="id"
      :props="{ label: 'menuName', children: 'children' }"
      :default-expanded-keys="expandedKeys"
      :filter-node-method="filterNode"
      class="assign-menu-tree"
      @check="onCheck"
    />

    <div class="assign-menu-stats">
      已选 <b>{{ checkedCount }}</b> 项 ｜ 含按钮 <b>{{ buttonCount }}</b> 个
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">确定</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
/* global defineEmits, defineExpose */
import { computed, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { assignRoleMenus, getRole } from '@/api/role'
import { getMenuTree } from '@/api/menu'
import {
  countSelectedMenuStats,
  filterMenuTreeByKeyword,
  getLeafCheckedKeys,
  mergeMenuKeys
} from '../../system-page-utils.mjs'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const treeRef = ref()
const menuTree = ref([])
const keyword = ref('')
const expandedKeys = ref([])
const currentRoleId = ref(null)
const selectedMenuKeys = ref([])

const visibleMenuIds = computed(() => new Set(
  collectAllIds(filterMenuTreeByKeyword(menuTree.value, keyword.value))
))
const selectedStats = computed(() => countSelectedMenuStats(menuTree.value, selectedMenuKeys.value))
const checkedCount = computed(() => selectedStats.value.checkedCount)
const buttonCount = computed(() => selectedStats.value.buttonCount)

function collectAllIds(nodes) {
  const keys = []

  function walk(list) {
    list.forEach(node => {
      keys.push(node.id)
      walk(node.children || [])
    })
  }

  walk(nodes)
  return keys
}

function filterNode(value, data) {
  if (!value) return true
  return visibleMenuIds.value.has(data.id)
}

function setAllExpanded(expanded) {
  collectAllIds(menuTree.value).forEach(id => {
    const node = treeRef.value?.getNode(id)
    if (node) node.expanded = expanded
  })
}

function expandAll() {
  expandedKeys.value = collectAllIds(menuTree.value)
  setAllExpanded(true)
}

function collapseAll() {
  expandedKeys.value = []
  setAllExpanded(false)
}

function onSearch() {
  treeRef.value?.filter(keyword.value)
  nextTick(() => setAllExpanded(true))
}

function onCheck(_, checkedInfo) {
  selectedMenuKeys.value = mergeMenuKeys(checkedInfo.checkedKeys, checkedInfo.halfCheckedKeys)
}

function syncSelectedMenuKeys() {
  const checked = treeRef.value?.getCheckedKeys() || []
  const halfChecked = treeRef.value?.getHalfCheckedKeys() || []
  selectedMenuKeys.value = mergeMenuKeys(checked, halfChecked)
}

async function open(row) {
  const [detail, tree] = await Promise.all([getRole(row.id), getMenuTree()])
  currentRoleId.value = row.id
  menuTree.value = tree || []
  expandedKeys.value = collectAllIds(menuTree.value)
  visible.value = true
  await nextTick()
  treeRef.value.setCheckedKeys(getLeafCheckedKeys(menuTree.value, detail.menuIds || []))
  syncSelectedMenuKeys()
}

async function save() {
  const checked = treeRef.value.getCheckedKeys()
  const halfChecked = treeRef.value.getHalfCheckedKeys()
  const menuIds = mergeMenuKeys(checked, halfChecked)
  saving.value = true
  try {
    await assignRoleMenus({ roleId: currentRoleId.value, menuIds })
    ElMessage.success('菜单分配成功，重新登录后生效')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

function resetTree() {
  currentRoleId.value = null
  menuTree.value = []
  keyword.value = ''
  expandedKeys.value = []
  selectedMenuKeys.value = []
}

defineExpose({ open })
</script>

<style scoped>
.assign-menu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.assign-menu-search {
  flex: 1;
}

.assign-menu-actions {
  display: flex;
  flex: none;
}

.assign-menu-tip {
  margin-bottom: 10px;
  color: #909399;
  font-size: 12px;
}

.assign-menu-tree {
  max-height: calc(100vh - 235px);
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
}

.assign-menu-stats {
  margin-top: 12px;
  color: #606266;
  font-size: 13px;
}
</style>
