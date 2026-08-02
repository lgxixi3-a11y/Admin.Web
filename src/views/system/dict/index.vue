<template>
  <main class="system-page">
    <div class="dict-layout">
      <el-card class="type-panel" shadow="never">
        <template #header>
          <div class="panel-header">
            <span>字典类型</span>
            <small>选择类型后管理其字典数据</small>
          </div>
        </template>

        <el-form :inline="true" :model="typeFilters" class="search-form" @submit.prevent="searchTypes">
          <el-form-item label="字典类型">
            <el-input v-model.trim="typeFilters.dictType" clearable placeholder="请输入字典类型" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="typeFilters.status" clearable placeholder="全部" class="status-select">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit">查询</el-button>
            <el-button @click="resetTypeSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <PaginationTable
          v-model:page="typePage"
          v-model:page-size="typePageSize"
          :data="typeRows"
          :loading="typeLoading"
          :total="typeTotal"
          :table-props="typeTableProps"
          @change="handleTypePageChange"
          @refresh="loadTypes"
        >
          <template #toolbar>
            <el-button v-permission="'system:dict:add'" type="primary" @click="openTypeCreate">
              新增类型
            </el-button>
          </template>
          <el-table-column prop="dictName" label="字典名称" min-width="130" show-overflow-tooltip />
          <el-table-column prop="dictType" label="字典类型" min-width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <DictTag dict-type="sys_user_status" :value="row.status" :options="enabledStatusOptions" />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="170" />
          <el-table-column label="操作" width="142" fixed="right">
            <template #default="{ row }">
              <el-button v-permission="'system:dict:edit'" link type="primary" @click.stop="openTypeEdit(row)">
                编辑
              </el-button>
              <el-button
                v-permission="'system:dict:del'"
                link
                type="danger"
                :loading="typeDeletingId === row.id"
                :disabled="typeDeletingId !== null"
                @click.stop="deleteType(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </PaginationTable>
      </el-card>

      <el-card class="data-panel" shadow="never">
        <template #header>
          <div class="panel-header">
            <span>字典数据</span>
            <el-tag v-if="selectedType" effect="plain">{{ selectedType.dictName }}（{{ selectedType.dictType }}）</el-tag>
            <small v-else>请先选择字典类型</small>
          </div>
        </template>

        <el-form :inline="true" :model="dataFilters" class="search-form" @submit.prevent="searchData">
          <el-form-item label="状态">
            <el-select v-model="dataFilters.status" clearable placeholder="全部" class="status-select">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :disabled="!selectedType">查询</el-button>
            <el-button :disabled="!selectedType" @click="resetDataSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <PaginationTable
          v-model:page="dataPage"
          v-model:page-size="dataPageSize"
          :data="dataRows"
          :loading="dataLoading"
          :total="dataTotal"
          :table-props="dataTableProps"
          @change="handleDataPageChange"
          @refresh="loadData"
        >
          <template #toolbar>
            <el-button
              v-permission="'system:dict:add'"
              type="primary"
              :disabled="!selectedType"
              @click="openDataCreate"
            >
              新增数据
            </el-button>
          </template>
          <template #empty>{{ selectedType ? '暂无字典数据' : '请先在左侧选择字典类型' }}</template>
          <el-table-column prop="dictLabel" label="标签" min-width="120" show-overflow-tooltip />
          <el-table-column prop="dictValue" label="键值" min-width="120" show-overflow-tooltip />
          <el-table-column prop="dictSort" label="排序" width="72" align="center" />
          <el-table-column prop="cssClass" label="标签样式" min-width="105" show-overflow-tooltip />
          <el-table-column label="默认" width="76" align="center">
            <template #default="{ row }">
              <DictTag dict-type="sys_yes_no" :value="row.isDefault" :options="yesNoOptions" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <DictTag dict-type="sys_user_status" :value="row.status" :options="enabledStatusOptions" />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="170" />
          <el-table-column label="操作" width="142" fixed="right">
            <template #default="{ row }">
              <el-button v-permission="'system:dict:edit'" link type="primary" @click="openDataEdit(row)">
                编辑
              </el-button>
              <el-button
                v-permission="'system:dict:del'"
                link
                type="danger"
                :loading="dataDeletingId === row.id"
                :disabled="dataDeletingId !== null"
                @click="deleteData(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </PaginationTable>
      </el-card>
    </div>

    <el-dialog v-model="typeDialogVisible" :title="typeForm.id ? '编辑字典类型' : '新增字典类型'" width="520px">
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="92px">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model.trim="typeForm.dictName" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model.trim="typeForm.dictType" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="typeForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="typeForm.remark" type="textarea" :rows="3" maxlength="256" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button
          v-if="typeForm.id"
          v-permission="'system:dict:edit'"
          type="primary"
          :loading="typeSaving"
          @click="saveType"
        >保存</el-button>
        <el-button
          v-else
          v-permission="'system:dict:add'"
          type="primary"
          :loading="typeSaving"
          @click="saveType"
        >保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dataDialogVisible" :title="dataForm.id ? '编辑字典数据' : '新增字典数据'" width="560px">
      <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="92px">
        <el-form-item label="字典类型">
          <el-input v-model="dataForm.dictType" disabled />
        </el-form-item>
        <el-form-item label="数据标签" prop="dictLabel">
          <el-input v-model.trim="dataForm.dictLabel" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="数据键值" prop="dictValue">
          <el-input v-model.trim="dataForm.dictValue" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="显示排序" prop="dictSort">
          <el-input-number v-model="dataForm.dictSort" :min="0" :max="99999" controls-position="right" />
        </el-form-item>
        <el-form-item label="标签样式" prop="cssClass">
          <el-select v-model="dataForm.cssClass" clearable placeholder="默认样式" class="full-width">
            <el-option label="success" value="success" />
            <el-option label="warning" value="warning" />
            <el-option label="danger" value="danger" />
            <el-option label="info" value="info" />
            <el-option label="primary" value="primary" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认值" prop="isDefault">
          <el-radio-group v-model="dataForm.isDefault">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="dataForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="dataForm.remark" type="textarea" :rows="3" maxlength="256" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataDialogVisible = false">取消</el-button>
        <el-button
          v-if="dataForm.id"
          v-permission="'system:dict:edit'"
          type="primary"
          :loading="dataSaving"
          @click="saveData"
        >保存</el-button>
        <el-button
          v-else
          v-permission="'system:dict:add'"
          type="primary"
          :loading="dataSaving"
          @click="saveData"
        >保存</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<script>
export default { name: 'SystemDictPage' }
</script>

<script setup>
import { nextTick, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DictTag from '@/components/DictTag.vue'
import PaginationTable from '@/components/PaginationTable.vue'
import {
  createDictData,
  createDictType,
  getDictDataPage,
  getDictTypePage,
  removeDictData,
  removeDictType,
  updateDictData,
  updateDictType
} from '@/api/dict'
import { ENABLED_STATUS_OPTIONS } from '../system-page-utils.mjs'

const enabledStatusOptions = ENABLED_STATUS_OPTIONS

const yesNoOptions = [
  { dictLabel: '是', dictValue: 1, cssClass: 'success' },
  { dictLabel: '否', dictValue: 0, cssClass: 'info' }
]

const typeFilters = reactive({ dictType: '', status: null })
const typePage = ref(1)
const typePageSize = ref(20)
const typeRows = ref([])
const typeTotal = ref(0)
const typeLoading = ref(false)
const selectedType = ref(null)
let typeLoadGeneration = 0

const dataFilters = reactive({ status: null })
const dataPage = ref(1)
const dataPageSize = ref(20)
const dataRows = ref([])
const dataTotal = ref(0)
const dataLoading = ref(false)
let dataLoadGeneration = 0

const typeDialogVisible = ref(false)
const typeSaving = ref(false)
const typeDeletingId = ref(null)
const typeFormRef = ref()
const typeForm = reactive(createEmptyTypeForm())
const typeRules = {
  dictName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }]
}

const dataDialogVisible = ref(false)
const dataSaving = ref(false)
const dataDeletingId = ref(null)
const dataFormRef = ref()
const dataForm = reactive(createEmptyDataForm())
const dataRules = {
  dictLabel: [{ required: true, message: '请输入数据标签', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入数据键值', trigger: 'blur' }]
}

const typeTableProps = { stripe: true, highlightCurrentRow: true, onRowClick: selectType }
const dataTableProps = { stripe: true }

function createEmptyTypeForm() {
  return { id: null, dictName: '', dictType: '', status: 1, remark: '' }
}

function createEmptyDataForm() {
  return {
    id: null,
    dictType: '',
    dictLabel: '',
    dictValue: '',
    dictSort: 0,
    status: 1,
    cssClass: '',
    isDefault: 0,
    remark: ''
  }
}

async function loadTypes() {
  const generation = ++typeLoadGeneration
  const params = {
    pageIndex: typePage.value,
    pageSize: typePageSize.value,
    dictType: typeFilters.dictType || undefined,
    status: typeFilters.status
  }
  let shouldReloadData = false
  typeLoading.value = true
  try {
    const result = await getDictTypePage(params)
    if (generation !== typeLoadGeneration) return
    typeRows.value = result?.items || []
    typeTotal.value = Number(result?.total || 0)

    const previousType = selectedType.value
    const nextType = typeRows.value.find(item => item.id === previousType?.id) || typeRows.value[0] || null
    const selectionChanged = nextType?.id !== previousType?.id || nextType?.dictType !== previousType?.dictType
    selectedType.value = nextType
    if (selectionChanged) dataPage.value = 1
    shouldReloadData = Boolean(previousType || nextType)
  } finally {
    if (generation === typeLoadGeneration) typeLoading.value = false
  }
  if (generation === typeLoadGeneration && shouldReloadData) await loadData()
}

async function loadData() {
  const generation = ++dataLoadGeneration
  const selectedTypeSnapshot = selectedType.value
    ? { id: selectedType.value.id, dictType: selectedType.value.dictType }
    : null

  if (!selectedTypeSnapshot) {
    dataRows.value = []
    dataTotal.value = 0
    dataLoading.value = false
    return
  }

  const params = {
    pageIndex: dataPage.value,
    pageSize: dataPageSize.value,
    dictType: selectedTypeSnapshot.dictType,
    status: dataFilters.status
  }
  dataLoading.value = true
  try {
    const result = await getDictDataPage(params)
    if (generation !== dataLoadGeneration) return
    if (
      selectedType.value?.id !== selectedTypeSnapshot.id
      || selectedType.value?.dictType !== selectedTypeSnapshot.dictType
    ) return
    dataRows.value = result?.items || []
    dataTotal.value = Number(result?.total || 0)
  } finally {
    if (generation === dataLoadGeneration) dataLoading.value = false
  }
}

async function selectType(row) {
  if (!row || row.id === selectedType.value?.id) return
  selectedType.value = row
  dataPage.value = 1
  await loadData()
}

function searchTypes() {
  typePage.value = 1
  loadTypes()
}

function resetTypeSearch() {
  Object.assign(typeFilters, { dictType: '', status: null })
  typePage.value = 1
  loadTypes()
}

function searchData() {
  dataPage.value = 1
  loadData()
}

function resetDataSearch() {
  dataFilters.status = null
  dataPage.value = 1
  loadData()
}

function handleTypePageChange({ page, pageSize }) {
  typePage.value = page
  typePageSize.value = pageSize
  loadTypes()
}

function handleDataPageChange({ page, pageSize }) {
  dataPage.value = page
  dataPageSize.value = pageSize
  loadData()
}

function openTypeCreate() {
  Object.assign(typeForm, createEmptyTypeForm())
  typeDialogVisible.value = true
  nextTick(() => typeFormRef.value?.clearValidate())
}

function openTypeEdit(row) {
  Object.assign(typeForm, createEmptyTypeForm(), {
    id: row.id,
    dictName: row.dictName,
    dictType: row.dictType,
    status: row.status,
    remark: row.remark || ''
  })
  typeDialogVisible.value = true
  nextTick(() => typeFormRef.value?.clearValidate())
}

async function saveType() {
  const valid = await typeFormRef.value?.validate().catch(() => false)
  if (!valid || typeSaving.value) return
  typeSaving.value = true
  try {
    const payload = { ...typeForm }
    if (payload.id) await updateDictType(payload)
    else await createDictType(payload)
    ElMessage.success(payload.id ? '字典类型修改成功' : '字典类型新增成功')
    typeDialogVisible.value = false
    await loadTypes()
  } finally {
    typeSaving.value = false
  }
}

async function deleteType(row) {
  if (typeDeletingId.value !== null) return
  typeDeletingId.value = row.id
  try {
    await ElMessageBox.confirm(`确认删除字典类型“${row.dictName}”吗？`, '删除确认', { type: 'warning' })
    await removeDictType(row.id)
    if (selectedType.value?.id === row.id) {
      selectedType.value = null
      dataRows.value = []
      dataTotal.value = 0
    }
    if (typeRows.value.length === 1 && typePage.value > 1) typePage.value -= 1
    ElMessage.success('字典类型删除成功')
    await loadTypes()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    typeDeletingId.value = null
  }
}

function openDataCreate() {
  if (!selectedType.value) return
  Object.assign(dataForm, createEmptyDataForm(), { dictType: selectedType.value.dictType })
  dataDialogVisible.value = true
  nextTick(() => dataFormRef.value?.clearValidate())
}

function openDataEdit(row) {
  Object.assign(dataForm, createEmptyDataForm(), {
    id: row.id,
    dictType: row.dictType,
    dictLabel: row.dictLabel,
    dictValue: row.dictValue,
    dictSort: row.dictSort,
    status: row.status,
    cssClass: row.cssClass || '',
    isDefault: row.isDefault,
    remark: row.remark || ''
  })
  dataDialogVisible.value = true
  nextTick(() => dataFormRef.value?.clearValidate())
}

async function saveData() {
  const valid = await dataFormRef.value?.validate().catch(() => false)
  if (!valid || dataSaving.value) return
  dataSaving.value = true
  try {
    const payload = { ...dataForm, dictType: selectedType.value.dictType }
    if (payload.id) await updateDictData(payload)
    else await createDictData(payload)
    ElMessage.success(payload.id ? '字典数据修改成功' : '字典数据新增成功')
    dataDialogVisible.value = false
    await loadData()
  } finally {
    dataSaving.value = false
  }
}

async function deleteData(row) {
  if (dataDeletingId.value !== null) return
  dataDeletingId.value = row.id
  try {
    await ElMessageBox.confirm(`确认删除字典数据“${row.dictLabel}”吗？`, '删除确认', { type: 'warning' })
    await removeDictData(row.id)
    if (dataRows.value.length === 1 && dataPage.value > 1) dataPage.value -= 1
    ElMessage.success('字典数据删除成功')
    await loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    dataDeletingId.value = null
  }
}

loadTypes()
</script>

<style scoped>
.system-page {
  min-width: 0;
}

.dict-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(360px, 0.9fr) minmax(520px, 1.5fr);
}

.type-panel,
.data-panel {
  min-width: 0;
}

.panel-header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.panel-header > span {
  font-weight: 600;
}

.panel-header small {
  color: var(--el-text-color-secondary);
}

.search-form {
  margin-bottom: 4px;
}

.status-select {
  width: 110px;
}

.full-width {
  width: 100%;
}

@media (max-width: 1100px) {
  .dict-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
