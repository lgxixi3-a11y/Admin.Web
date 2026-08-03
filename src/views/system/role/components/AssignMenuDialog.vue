<template>
  <el-dialog v-model="visible" title="分配菜单" width="560px" destroy-on-close @closed="resetTree">
    <div class="assign-menu-tip">
      勾选权限菜单（按钮权限请一并勾选，父级目录会自动半选）
    </div>
    <el-tree
      ref="treeRef"
      :data="menuTree"
      show-checkbox
      node-key="id"
      :props="{ label: 'menuName', children: 'children' }"
      default-expand-all
      class="assign-menu-tree"
    />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/* global defineEmits, defineExpose */
import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { assignRoleMenus, getRole } from '@/api/role'
import { getMenuTree } from '@/api/menu'
import { getLeafCheckedKeys, mergeMenuKeys } from '../../system-page-utils.mjs'

const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const treeRef = ref()
const menuTree = ref([])
const currentRoleId = ref(null)
const currentRoleName = ref('')

async function open(row) {
  const [detail, tree] = await Promise.all([getRole(row.id), getMenuTree()])
  currentRoleId.value = row.id
  currentRoleName.value = row.roleName
  menuTree.value = tree || []
  visible.value = true
  await nextTick()
  treeRef.value.setCheckedKeys(getLeafCheckedKeys(menuTree.value, detail.menuIds || []))
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
  currentRoleName.value = ''
  menuTree.value = []
}

defineExpose({ open })
</script>

<style scoped>
.assign-menu-tip {
  margin-bottom: 10px;
  color: #909399;
  font-size: 12px;
}

.assign-menu-tree {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
}
</style>
