<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="setting-page">
    <el-card shadow="never" class="settings-card">
      <template #header><span>系统设置</span></template>
      <PaginationTable :data="rows" :loading="loading" :show-pagination="false" @refresh="load">
        <el-table-column prop="key" label="设置键" min-width="180" show-overflow-tooltip />
        <el-table-column prop="value" label="设置值" min-width="300" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'tool:setting:edit'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-permission="'tool:setting:del'"
              link
              type="danger"
              :loading="deletingKey === row.key"
              :disabled="deletingKey !== null"
              @click="remove(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </PaginationTable>
    </el-card>

    <el-card v-permission="'tool:setting:dbSwitch'" shadow="never" class="database-card">
      <template #header>
        <div class="database-header">
          <span>数据库切换</span>
          <el-button type="primary" plain size="small" @click="openDbSwitch">打开切换面板</el-button>
        </div>
      </template>
      <el-empty description="切换数据库请在弹窗中操作，连接串不会回显" :image-size="72" />
    </el-card>

    <SettingFormDialog ref="settingFormRef" @saved="load" />
    <DbSwitchDialog ref="dbSwitchRef" @saved="load" />
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PaginationTable from '@/components/PaginationTable.vue'
import { getSettings, removeSetting } from '@/api/setting'
import SettingFormDialog from './components/SettingFormDialog.vue'
import DbSwitchDialog from './components/DbSwitchDialog.vue'

const rows = ref([])
const loading = ref(false)
const deletingKey = ref(null)
const settingFormRef = ref()
const dbSwitchRef = ref()

async function load() {
  loading.value = true
  try {
    const result = await getSettings()
    rows.value = (result || []).filter(item => !String(item.key || '').toLowerCase().startsWith('db.'))
  } finally {
    loading.value = false
  }
}

function openEdit(row) {
  settingFormRef.value.open(row)
}

function openDbSwitch() {
  dbSwitchRef.value.open()
}

async function remove(row) {
  if (deletingKey.value) return
  try {
    await ElMessageBox.confirm(`确认删除设置“${row.key}”吗？`, '删除确认', { type: 'warning' })
    deletingKey.value = row.key
    await removeSetting(row.key)
    ElMessage.success('删除成功')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    deletingKey.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.settings-card {
  margin-bottom: 16px;
}

.database-card {
  max-width: 920px;
}

.database-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
