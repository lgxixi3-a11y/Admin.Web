<template>
  <el-dialog v-model="visible" title="分配角色" width="460px" destroy-on-close>
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
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
/* global defineProps, defineEmits, defineExpose */

import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { assignUserRoles, getUser } from '@/api/user'

defineProps({
  roleOptions: { type: Array, default: () => [] }
})
const emit = defineEmits(['saved'])

const visible = ref(false)
const saving = ref(false)
const currentUserId = ref(null)
const currentUserName = ref('')
const assignedRoleIds = ref([])

async function open(row) {
  const detail = await getUser(row.id)
  currentUserId.value = detail.id
  currentUserName.value = detail.nickName || detail.userName
  assignedRoleIds.value = [...(detail.roleIds || [])]
  visible.value = true
}

async function save() {
  saving.value = true
  try {
    await assignUserRoles({ userId: currentUserId.value, roleIds: [...assignedRoleIds.value] })
    ElMessage.success('角色分配成功')
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>
