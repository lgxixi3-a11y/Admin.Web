# 菜单管理页面优化（阶段 E）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为菜单管理页面提供可靠的客户端树形筛选、树交互和更清晰紧凑的列展示。

**Architecture:** 页面一次加载菜单树到 `rows`；通用展示过滤工具创建不改变输入的树副本，保留命中节点和祖先路径。页面基于过滤树显示表格，并以 Element Plus 受控展开键提供展开和折叠。

**Tech Stack:** Vue 3 Composition API、Element Plus、Node 内置测试运行器、ES modules。

## Global Constraints

- 过滤是纯展示过滤，不修改 `rows` 或后端数据。
- 每个保留节点必须带 `children` 数组；命中子节点时祖先路径必须显示。
- 保留默认全部展开，展开/折叠不请求后端。
- 保持加载代次保护、`DictTag`、权限指令和删除逻辑。
- 最终代码提交信息必须为 `feat: 菜单管理页搜索筛选与徽标`。

---

### Task 1: 可测试的菜单树展示过滤工具

**Files:**
- Modify: `src/views/system/system-page-utils.mjs`
- Test: `src/views/system/system-page-utils.test.mjs`

**Interfaces:**
- Produces: `filterMenuTree(tree, matches)`，其中 `matches(node)` 返回布尔值，结果为展示树副本。
- Consumes: `filterMenuTreeByKeyword(tree, keyword)`；它继续对菜单名称和权限标识进行不区分大小写的搜索。

- [ ] **Step 1: 写入失败测试**

在测试文件导入 `filterMenuTree`，并添加以下测试：

```js
test('menu display filter keeps a matching descendant and immutable child arrays', () => {
  const tree = [{ id: 1, menuName: '系统', children: [{ id: 2, menuName: '用户', menuType: 2, status: 1, children: [] }] }]
  const result = filterMenuTree(tree, node => node.menuName === '用户' && node.menuType === 2 && node.status === 1)
  assert.deepEqual(result, [{ id: 1, menuName: '系统', children: [{ id: 2, menuName: '用户', menuType: 2, status: 1, children: [] }] }])
  assert.notEqual(result[0], tree[0])
  assert.deepEqual(result[0].children[0].children, [])
})
```

- [ ] **Step 2: 确认测试失败**

Run: `node --test src/views/system/system-page-utils.test.mjs`

Expected: FAIL，`filterMenuTree` 未导出。

- [ ] **Step 3: 实现最小过滤函数**

在工具文件实现：

```js
export function filterMenuTree(tree, matches) {
  const filterNodes = nodes => (Array.isArray(nodes) ? nodes : [])
    .map(node => {
      const children = filterNodes(node.children)
      if (!matches(node) && children.length === 0) return null
      return { ...node, children }
    })
    .filter(Boolean)
  return filterNodes(tree)
}
```

将 `filterMenuTreeByKeyword` 的递归实现替换为调用此函数，其 `matches` 谓词维持现有菜单名称和权限标识匹配。

- [ ] **Step 4: 确认工具测试通过**

Run: `node --test src/views/system/system-page-utils.test.mjs`

Expected: PASS，包括既有角色菜单测试。

### Task 2: 菜单页搜索、树交互与视觉优化

**Files:**
- Modify: `src/views/system/menu/index.vue`

**Interfaces:**
- Consumes: `filterMenuTree(tree, matches)`。
- Produces: `filteredRows`、`search()`、`resetSearch()`、`expandAll()`、`collapseAll()`。

- [ ] **Step 1: 添加搜索表单并绑定展示树**

在 `PaginationTable` 前添加文档指定的 `el-card.search-card` 和内联表单：`menuName`、`perms`、`menuType`、`status`；提交绑定 `search`，重置绑定 `resetSearch`。表格数据从 `rows` 改为 `filteredRows`。

- [ ] **Step 2: 实现查询条件与展示过滤**

```js
const filters = reactive({ menuName: '', perms: '', menuType: undefined, status: undefined })
const appliedFilters = ref({ ...filters })
const filteredRows = computed(() => {
  const { menuName, perms, menuType, status } = appliedFilters.value
  return filterMenuTree(rows.value, node =>
    (!menuName || node.menuName?.includes(menuName)) &&
    (!perms || node.perms?.includes(perms)) &&
    (!menuType || Number(node.menuType) === Number(menuType)) &&
    (!status || Number(node.status) === Number(status))
  )
})
```

`search` 复制表单值到 `appliedFilters`；`resetSearch` 清空两个对象，所以只有点击查询才改变展示。

- [ ] **Step 3: 实现展开和折叠**

```js
const expandedRowKeys = ref(null)
const menuTableProps = computed(() => ({
  rowKey: 'id', treeProps: { children: 'children' }, defaultExpandAll: true,
  ...(expandedRowKeys.value === null ? {} : { expandRowKeys: expandedRowKeys.value }),
  stripe: true, size: 'small'
}))
function expandAll() { expandedRowKeys.value = collectMenuIds(filteredRows.value) }
function collapseAll() { expandedRowKeys.value = [] }
```

在工具栏新增两个链接按钮；`collectMenuIds` 递归收集当前展示树的 `id`。

- [ ] **Step 4: 应用图标、类型和布局样式**

导入 `* as Icons`，以 `iconOf(name)` 返回已知图标或 `null`。按文档把图标列替换为 `el-icon` 预览（空值为破折号），用 `MENU_TYPE_MAP` 和浅色小 `el-tag` 替换类型文本。保留状态与操作列；增加搜索卡片、操作分组、控件宽度和图标样式。

- [ ] **Step 5: 运行页面检查和构建**

Run: `npm run lint`

Expected: EXIT 0。

Run: `npm run build`

Expected: EXIT 0。

### Task 3: 回归、范围审核与提交

**Files:**
- Modify: `src/views/system/system-page-utils.mjs`
- Modify: `src/views/system/system-page-utils.test.mjs`
- Modify: `src/views/system/menu/index.vue`

- [ ] **Step 1: 运行测试套件**

Run: `npm test`

Expected: EXIT 0，包含新增树展示过滤测试。

- [ ] **Step 2: 审核变更范围**

Run: `git diff --check` 和 `git diff -- src/views/system/system-page-utils.mjs src/views/system/system-page-utils.test.mjs src/views/system/menu/index.vue`

Expected: 无空白错误，且仅含阶段 E 所需变更。

- [ ] **Step 3: 暂存并提交阶段 E 改动**

Run: `git add src/views/system/system-page-utils.mjs src/views/system/system-page-utils.test.mjs src/views/system/menu/index.vue`

Run: `git commit -m "feat: 菜单管理页搜索筛选与徽标"`

Expected: 单独生成阶段 E 的代码与测试提交，不包含日志或其他工作。
