# 系统管理页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按《04-实施计划》第 6 节在 Admin.Web 中交付用户、角色、菜单和字典四个可编译、可验证的系统管理页面。

**Architecture:** 四个页面均采用 Vue 3 `script setup` 并直接调用现有 `src/api` 模块；列表统一通过 `PaginationTable` 渲染，状态统一交给 `DictTag`，业务按钮由 `v-permission` 控制。可复用的角色分页、菜单授权与菜单类型规则放在 `system-page-utils.mjs`，通过 Node.js 行为测试验证；Vue 模板集成由 lint、生产构建和逐项代码审查验证。

**Tech Stack:** Vue 3.2、Element Plus 2.14、Pinia、Vue Router、Node.js 内置 test runner、Vue CLI ESLint/build。

## Global Constraints

- 当前仓库必须是 `Admin.Web`，当前分支必须是 `feature/admin-v1-web-base`。
- 只复用现有 `src/api/user.js`、`role.js`、`menu.js`、`dict.js`，不新增依赖或后端接口。
- 所有列表使用 `PaginationTable`；菜单树通过 `tableProps` 配置内部 `el-table` 并设置 `showPagination=false`。
- 所有状态列使用 `DictTag`，字典类型为 `sys_user_status`。
- 所有新增、编辑、删除、重置密码、分配角色和分配菜单按钮使用阶段 A4 的精确权限码。
- 分页请求必须使用 `pageIndex` 和 `pageSize`，解析 `{ total, items }`。
- 最终功能提交只执行 `git add src/views/system`，提交信息必须为 `feat: 系统管理页面(用户/角色/菜单/字典), 含 v-permission 按钮级权限`。

---

### Task 1: 以 TDD 建立系统页面共享业务逻辑

**Files:**
- Create: `src/views/system/system-page-utils.test.mjs`
- Create: `src/views/system/system-page-utils.mjs`

**Interfaces:**
- Consumes: Node.js `node:test`、`node:assert/strict`。
- Produces: `loadAllRoleOptions`、`collectParentIds`、`getLeafCheckedKeys`、`mergeMenuKeys`、`getMenuFieldRequirements`、`sanitizeMenuFields`。

- [ ] **Step 1: 写入共享逻辑行为测试**

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectParentIds,
  getLeafCheckedKeys,
  getMenuFieldRequirements,
  loadAllRoleOptions,
  mergeMenuKeys,
  sanitizeMenuFields
} from './system-page-utils.mjs'

test('loadAllRoleOptions reads every backend page with the maximum supported size', async () => {
  const requested = []
  const result = await loadAllRoleOptions(async params => {
    requested.push(params)
    if (params.pageIndex === 1) return { total: 3, items: [{ id: 1 }, { id: 2 }] }
    return { total: 3, items: [{ id: 3 }] }
  }, 2)
  assert.deepEqual(requested, [{ pageIndex: 1, pageSize: 2 }, { pageIndex: 2, pageSize: 2 }])
  assert.deepEqual(result, [{ id: 1 }, { id: 2 }, { id: 3 }])
})

test('role menu helpers preserve leaves for echo and merge checked parents once', () => {
  const tree = [{ id: 1, children: [{ id: 2, children: [{ id: 3, children: [] }] }, { id: 4, children: [] }] }]
  assert.deepEqual([...collectParentIds(tree)], [1, 2])
  assert.deepEqual(getLeafCheckedKeys(tree, [1, 2, 3]), [3])
  assert.deepEqual(mergeMenuKeys([3, 4], [1, 2, 3]), [3, 4, 1, 2])
})

test('menu type rules require and retain only fields valid for that type', () => {
  assert.deepEqual(getMenuFieldRequirements(1), { path: true, component: false, perms: false })
  assert.deepEqual(getMenuFieldRequirements(2), { path: true, component: true, perms: false })
  assert.deepEqual(getMenuFieldRequirements(3), { path: false, component: false, perms: true })
  const source = { path: '/users', component: 'system/user/index', perms: 'system:user:list', icon: 'User', isFrame: 1, cacheFlag: 1 }
  assert.deepEqual(sanitizeMenuFields(source, 1), { ...source, component: '', perms: '' })
  assert.deepEqual(sanitizeMenuFields(source, 2), { ...source, perms: '' })
  assert.deepEqual(sanitizeMenuFields(source, 3), { ...source, path: '', component: '', icon: '', isFrame: 0, cacheFlag: 0 })
})
```

- [ ] **Step 2: 运行测试并确认因共享逻辑缺失而失败**

Run: `node --test src/views/system/system-page-utils.test.mjs`

Expected: FAIL，提示无法加载 `system-page-utils.mjs`，失败原因是目标行为尚未实现。

- [ ] **Step 3: 实现最小共享逻辑并确认测试通过**

`loadAllRoleOptions` 逐页调用传入的 `fetchPage`，默认 `pageSize=100`；`collectParentIds` 返回含子节点的 ID 集合；`getLeafCheckedKeys` 从授权 ID 中排除父节点；`mergeMenuKeys` 保序去重合并全选与半选 ID；菜单类型函数严格返回测试中的字段规则和清理结果。

Run: `node --test src/views/system/system-page-utils.test.mjs`

Expected: 3 tests PASS，0 FAIL。

---

### Task 2: 实现用户管理页面

**Files:**
- Create: `src/views/system/user/index.vue`
- Test: `src/views/system/system-page-utils.test.mjs`

**Interfaces:**
- Consumes: `getUserPage/getUser/createUser/updateUser/removeUser/resetUserPwd/assignUserRoles/changeUserStatus`，以及 `getRolePage`。
- Produces: 用户搜索、分页 CRUD、独立重置密码、独立多角色分配页面。

- [ ] **Step 1: 运行共享逻辑测试并保留绿色基线**

Run: `node --test src/views/system/system-page-utils.test.mjs`

Expected: PASS；用户页必须导入并调用 `loadAllRoleOptions(getRolePage)`。

- [ ] **Step 2: 创建用户页模板**

模板必须按以下结构落地：

```vue
<el-card class="search-card">
  <el-form :inline="true" :model="filters" @submit.prevent="search">
    <el-form-item label="用户名"><el-input v-model.trim="filters.userName" clearable /></el-form-item>
    <el-form-item label="昵称"><el-input v-model.trim="filters.nickName" clearable /></el-form-item>
    <el-form-item label="状态"><el-select v-model="filters.status" clearable><el-option label="启用" :value="1" /><el-option label="禁用" :value="0" /></el-select></el-form-item>
    <el-form-item><el-button type="primary" native-type="submit">查询</el-button><el-button @click="resetSearch">重置</el-button></el-form-item>
  </el-form>
</el-card>
<el-card>
  <PaginationTable :data="rows" :loading="loading" :total="total"
    v-model:page="page" v-model:page-size="pageSize" @change="handlePageChange" @refresh="load">
    <template #toolbar><el-button v-permission="'system:user:add'" @click="openCreate">新增用户</el-button></template>
    <el-table-column prop="userName" label="用户名" />
    <el-table-column prop="nickName" label="昵称" />
    <el-table-column prop="email" label="邮箱" />
    <el-table-column prop="phone" label="手机" />
    <el-table-column label="状态"><template #default="{ row }"><DictTag dict-type="sys_user_status" :value="row.status" /></template></el-table-column>
    <el-table-column prop="createTime" label="创建时间" />
  </PaginationTable>
</el-card>
<el-dialog v-model="formVisible" :title="form.id ? '编辑用户' : '新增用户'" />
<el-dialog v-model="passwordVisible" title="重置密码" />
<el-dialog v-model="roleVisible" title="分配角色" />
```

操作列精确使用 `system:user:edit`、`system:user:resetPwd`、`system:user:assignRole`、`system:user:del`。状态列为 `<DictTag dict-type="sys_user_status" :value="row.status" />`。

- [ ] **Step 3: 创建用户页状态、校验和加载函数**

```js
const filters = reactive({ userName: '', nickName: '', status: null })
const page = ref(1)
const pageSize = ref(20)
const rows = ref([])
const total = ref(0)
const form = reactive({ id: null, userName: '', nickName: '', password: '', email: '', phone: '', status: 1, remark: '', roleIds: [] })

async function load() {
  loading.value = true
  try {
    const result = await getUserPage({ pageIndex: page.value, pageSize: pageSize.value, ...filters })
    rows.value = result.items || []
    total.value = Number(result.total || 0)
  } finally { loading.value = false }
}

async function loadRoleOptions() {
  roleOptions.value = await loadAllRoleOptions(getRolePage)
}
```

表单规则必须包含用户名 4–64、昵称必填、邮箱格式、手机最大 32；密码规则由 `form.id` 决定新增必填，编辑提交时删除空密码字段。

- [ ] **Step 4: 完成用户写操作**

```js
async function saveUser() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    const payload = { ...form, roleIds: [...form.roleIds] }
    if (payload.id) { delete payload.password; await updateUser(payload) } else await createUser(payload)
    ElMessage.success(payload.id ? '修改成功' : '新增成功')
    formVisible.value = false
    await load()
  } finally { saving.value = false }
}

async function savePassword() {
  if (!await passwordFormRef.value.validate().catch(() => false)) return
  passwordSaving.value = true
  try {
    await resetUserPwd({ id: passwordForm.id, password: passwordForm.password })
    ElMessage.success('密码重置成功')
    passwordVisible.value = false
  } finally { passwordSaving.value = false }
}

async function saveRoles() {
  roleSaving.value = true
  try {
    await assignUserRoles({ userId: currentUserId.value, roleIds: [...assignedRoleIds.value] })
    ElMessage.success('角色分配成功')
    roleVisible.value = false
    await load()
  } finally { roleSaving.value = false }
}

async function remove(row) {
  await ElMessageBox.confirm(`确认删除用户“${row.userName}”吗？`, '删除确认', { type: 'warning' })
  await removeUser(row.id)
  if (rows.value.length === 1 && page.value > 1) page.value -= 1
  ElMessage.success('删除成功')
  await load()
}
```

`openEdit/openPassword/openRoles` 均调用 `getUser(row.id)` 获取最新详情；角色弹窗的多选值使用 `[...(detail.roleIds || [])]` 回显。

- [ ] **Step 5: 运行共享逻辑测试和用户页 lint**

Run: `node --test src/views/system/system-page-utils.test.mjs && npx vue-cli-service lint src/views/system/user/index.vue`

Expected: PASS。

---

### Task 3: 实现角色管理页面

**Files:**
- Create: `src/views/system/role/index.vue`
- Test: `src/views/system/system-page-utils.test.mjs`

**Interfaces:**
- Consumes: 角色 CRUD API、`getMenuTree`、`assignRoleMenus`。
- Produces: 角色分页 CRUD 和保持父级半选节点的菜单授权。

- [ ] **Step 1: 运行菜单授权行为测试并确认绿色基线**

Run: `node --test --test-name-pattern="role menu helpers" src/views/system/system-page-utils.test.mjs`

Expected: PASS；角色页必须调用已测试的 `getLeafCheckedKeys` 和 `mergeMenuKeys`。

- [ ] **Step 2: 创建角色搜索、分页表格和编辑弹窗**

使用 `filters = { roleName: '', status: null }`，分页调用：

```js
const result = await getRolePage({ pageIndex: page.value, pageSize: pageSize.value, ...filters })
rows.value = result.items || []
total.value = Number(result.total || 0)
```

表单字段精确为 `id/roleName/roleKey/sort/status/remark`，规则为角色名和角色标识必填且最多 64。新增、编辑、删除、分配菜单按钮权限依次为 `system:role:add/edit/del/assignMenu`，状态使用 `DictTag`。

- [ ] **Step 3: 创建菜单授权弹窗与正确回显**

```vue
<el-tree ref="menuTreeRef" :data="menuTree" show-checkbox node-key="id"
  :props="{ label: 'menuName', children: 'children' }" default-expand-all />
```

```js
async function openAssignMenus(row) {
  const [detail, tree] = await Promise.all([getRole(row.id), getMenuTree()])
  currentRoleId.value = row.id
  menuTree.value = tree || []
  menuVisible.value = true
  await nextTick()
  menuTreeRef.value.setCheckedKeys(getLeafCheckedKeys(menuTree.value, detail.menuIds || []))
}
```

- [ ] **Step 4: 合并全选和半选节点并保存**

```js
async function saveMenus() {
  const checked = menuTreeRef.value.getCheckedKeys()
  const halfChecked = menuTreeRef.value.getHalfCheckedKeys()
  const menuIds = mergeMenuKeys(checked, halfChecked)
  await assignRoleMenus({ roleId: currentRoleId.value, menuIds })
  ElMessage.success('菜单分配成功')
  menuVisible.value = false
  await load()
}
```

- [ ] **Step 5: 运行授权行为测试和角色页 lint**

Run: `node --test --test-name-pattern="role menu helpers" src/views/system/system-page-utils.test.mjs && npx vue-cli-service lint src/views/system/role/index.vue`

Expected: PASS。

---

### Task 4: 实现菜单管理页面

**Files:**
- Create: `src/views/system/menu/index.vue`
- Test: `src/views/system/system-page-utils.test.mjs`

**Interfaces:**
- Consumes: 菜单 CRUD API。
- Produces: 菜单树表格、父级树选择和 `menuType` 动态表单校验。

- [ ] **Step 1: 运行菜单类型行为测试并确认绿色基线**

Run: `node --test --test-name-pattern="menu type rules" src/views/system/system-page-utils.test.mjs`

Expected: PASS；菜单页必须调用已测试的 `getMenuFieldRequirements` 和 `sanitizeMenuFields`。

- [ ] **Step 2: 创建树形 PaginationTable**

```vue
<PaginationTable :data="rows" :loading="loading" :show-pagination="false"
  :table-props="menuTableProps" @refresh="load">
  <el-table-column prop="menuName" label="菜单名称" />
  <el-table-column prop="icon" label="图标" />
  <el-table-column label="类型"><template #default="{ row }">{{ menuTypeLabels[row.menuType] }}</template></el-table-column>
  <el-table-column prop="path" label="路由路径" />
  <el-table-column prop="component" label="组件" />
  <el-table-column prop="perms" label="权限标识" />
  <el-table-column prop="sort" label="排序" />
  <el-table-column label="状态"><template #default="{ row }"><DictTag dict-type="sys_user_status" :value="row.status" /></template></el-table-column>
</PaginationTable>
```

```js
const menuTableProps = { rowKey: 'id', treeProps: { children: 'children' }, defaultExpandAll: true }
const menuTypeLabels = { 1: '目录', 2: '菜单', 3: '按钮' }
```

所有操作使用 `system:menu:add/edit/del`；每行“新增子项”也使用 `system:menu:add`。

- [ ] **Step 3: 创建 MenuInput 表单和父级树**

```js
const form = reactive({ id: null, parentId: 0, menuName: '', menuType: 1, path: '', component: '', perms: '', icon: '', sort: 0, status: 1, isFrame: 0, visible: 1, cacheFlag: 1 })
const parentTree = computed(() => [{ id: 0, menuName: '根目录', children: filterParentNodes(rows.value, form.id, form.menuType) }])
```

`filterParentNodes` 排除当前节点、当前节点全部后代和 `menuType === 3` 的按钮；当待保存项是按钮时，仅保留菜单节点作为可选父级。父级控件使用 `el-tree-select`、`node-key="id"`、`check-strictly`。

- [ ] **Step 4: 动态校验并清理不适用字段**

```js
const requirements = computed(() => getMenuFieldRequirements(form.menuType))
const rules = computed(() => ({
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  parentId: [{ required: true, message: '请选择父级菜单', trigger: 'change' }],
  path: [{ required: requirements.value.path, message: '请输入路由路径', trigger: 'blur' }],
  component: [{ required: requirements.value.component, message: '请输入组件路径', trigger: 'blur' }],
  perms: [{ required: requirements.value.perms, message: '请输入权限标识', trigger: 'blur' }]
}))

watch(() => form.menuType, type => {
  Object.assign(form, sanitizeMenuFields(form, type))
  formRef.value?.clearValidate(['path', 'component', 'perms', 'parentId'])
})
```

- [ ] **Step 5: 完成 CRUD 并运行菜单类型行为测试**

编辑使用 `getMenu(row.id)`；保存使用 `createMenu/updateMenu`；删除先确认再调用 `removeMenu`，失败信息由 HTTP 拦截器展示。

Run: `node --test --test-name-pattern="menu type rules" src/views/system/system-page-utils.test.mjs && npx vue-cli-service lint src/views/system/menu/index.vue`

Expected: PASS。

---

### Task 5: 实现字典管理页面

**Files:**
- Create: `src/views/system/dict/index.vue`
- Test: `src/views/system/system-page-utils.test.mjs`

**Interfaces:**
- Consumes: 字典类型和字典数据分页/CRUD API。
- Produces: 响应式左右分栏、类型选择与数据分页联动。

- [ ] **Step 1: 运行共享逻辑测试并确认绿色基线**

Run: `node --test src/views/system/system-page-utils.test.mjs`

Expected: PASS；字典页不增加无法观察真实行为的源码匹配测试。

- [ ] **Step 2: 创建左右分栏和两个 PaginationTable**

```vue
<div class="dict-layout">
  <el-card class="type-panel">
    <PaginationTable :data="typeRows" :total="typeTotal" :loading="typeLoading" :table-props="typeTableProps" v-model:page="typePage" v-model:page-size="typePageSize" @change="handleTypePageChange">
      <el-table-column prop="dictName" label="字典名称" />
      <el-table-column prop="dictType" label="字典类型" />
    </PaginationTable>
  </el-card>
  <el-card class="data-panel">
    <PaginationTable :data="dataRows" :total="dataTotal" :loading="dataLoading" v-model:page="dataPage" v-model:page-size="dataPageSize" @change="handleDataPageChange">
      <el-table-column prop="dictLabel" label="标签" />
      <el-table-column prop="dictValue" label="键值" />
    </PaginationTable>
  </el-card>
</div>
```

由于 `PaginationTable` 不直接声明 `row-click`，通过 `:table-props="{ onRowClick: selectType, highlightCurrentRow: true }"` 传给内部 `el-table`。CSS 使用 `grid-template-columns: minmax(360px, 0.9fr) minmax(520px, 1.5fr)`，在 `max-width: 1100px` 时改为单列。

- [ ] **Step 3: 实现类型分页 CRUD 与选择联动**

```js
async function loadTypes() {
  const result = await getDictTypePage({ pageIndex: typePage.value, pageSize: typePageSize.value, ...typeFilters })
  typeRows.value = result.items || []
  typeTotal.value = Number(result.total || 0)
  if (!selectedType.value && typeRows.value.length) await selectType(typeRows.value[0])
}

async function selectType(row) {
  selectedType.value = row
  dataPage.value = 1
  await loadData()
}
```

类型表单字段为 `id/dictName/dictType/status/remark`。按钮使用 `system:dict:add/edit/del`，状态使用 `DictTag`。删除选中类型成功后先清空 `selectedType` 和数据列表，再重新加载类型。

- [ ] **Step 4: 实现数据分页 CRUD**

```js
async function loadData() {
  if (!selectedType.value) { dataRows.value = []; dataTotal.value = 0; return }
  const result = await getDictDataPage({ pageIndex: dataPage.value, pageSize: dataPageSize.value, dictType: selectedType.value.dictType, ...dataFilters })
  dataRows.value = result.items || []
  dataTotal.value = Number(result.total || 0)
}
```

数据表单字段为 `id/dictType/dictLabel/dictValue/dictSort/status/cssClass/isDefault/remark`，其中 `dictType` 固定为当前选中类型。新增、编辑、删除权限同样使用 `system:dict:add/edit/del`；状态和默认标志均使用 `DictTag`。

- [ ] **Step 5: 运行共享逻辑测试和字典页 lint**

Run: `node --test src/views/system/system-page-utils.test.mjs && npx vue-cli-service lint src/views/system/dict/index.vue`

Expected: PASS。

---

### Task 6: 全量验证与用户指定提交

**Files:**
- Verify: `src/views/system/system-page-utils.test.mjs`
- Verify: `src/views/system/system-page-utils.mjs`
- Verify: `src/views/system/user/index.vue`
- Verify: `src/views/system/role/index.vue`
- Verify: `src/views/system/menu/index.vue`
- Verify: `src/views/system/dict/index.vue`

**Interfaces:**
- Consumes: 全部阶段 D 页面和项目现有测试/构建脚本。
- Produces: 可审计的测试、lint、构建结果和指定 Git commit。

- [ ] **Step 1: 运行阶段 D 共享逻辑行为测试**

Run: `node --test src/views/system/system-page-utils.test.mjs`

Expected: 3 tests PASS，0 FAIL。

- [ ] **Step 2: 运行现有单元测试**

Run: `npm test`

Expected: 全部现有测试 PASS。

- [ ] **Step 3: 运行 lint**

Run: `npm run lint`

Expected: 编译检查结束且无 ESLint error。

- [ ] **Step 4: 运行生产构建**

Run: `npm run build`

Expected: `Build complete`，进程退出码为 0。

- [ ] **Step 5: 检查阶段 D 完成度和差异**

Run: `git diff --check && git status --short && git diff -- src/views/system`

Expected: 无空白错误；仅出现本计划要求的系统页面、共享逻辑和行为测试改动；四页逐项具备 CRUD、权限、DictTag 和 PaginationTable，角色授权含全选/半选合并。

- [ ] **Step 6: 按用户指定范围暂存并提交**

```bash
git add src/views/system
git commit -m "feat: 系统管理页面(用户/角色/菜单/字典), 含 v-permission 按钮级权限"
```

- [ ] **Step 7: 检查最终提交和工作区**

Run: `git show --stat --oneline HEAD && git status --short`

Expected: HEAD 提交信息与用户指定内容完全一致；提交包含四个 `index.vue`、共享逻辑与行为测试；工作区干净。
