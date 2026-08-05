# TagsView 多标签页导航设计

## 目标

在 `Admin.Web` 的主布局中加入标准 TagsView：标签切换、关闭、右键操作、首页固定、刷新后自动恢复可访问标签，以及横向滚动。标签状态由 Pinia 统一维护，路由成功完成后才登记。

## 架构

- `src/stores/tagsView.js` 是唯一状态源。`visitedViews` 保存稳定的标签快照，`cachedViews` 保存用于 Vue `keep-alive` 的组件名。
- `src/components/TagsView.vue` 只处理显示和用户交互；它通过 store 删除标签，并根据当前标签和剩余标签决定回退路由。
- `src/router/guard.js` 在 `afterEach` 中登记标签；它明确排除登录、404、重定向和 `meta.hidden` 路由。`MainLayout.vue` 在唯一的主 `RouterView` 外接入 `keep-alive`。

## 路由与缓存规则

1. `/dashboard` 具有 `meta.affix: true` 和 `meta.cache: true`，永不允许删除。
2. 每个可见、可命名的最终页面在导航成功后按 `fullPath` 去重登记，因此同一路径但不同 query 可作为不同标签；缓存则按组件名去重。
3. `keep-alive` 仅包含 `meta.cache` 页面且使用组件 name。动态菜单页面的 route name 是 `Menu${id}`，与其真实页面组件名可能不同；权限路由会为可缓存页面创建同名的稳定包装组件，因此 `Menu${id}` 既是标签缓存键也是 `keep-alive` 可匹配的组件 name，不必篡改原始页面组件。
4. 404 和登录页不进入标签或缓存。无匹配、重定向和 hidden 路由同样排除。
5. 关闭当前标签后先选择其右侧标签；没有右侧则选择左侧；只剩固定首页时回到首页。关闭其他或全部不会删除首页。

## UI 与交互

标签条在顶栏下方，使用 `el-scrollbar` 横向滚动。激活标签使用主题色，非固定标签显示关闭按钮。右键菜单提供关闭当前、关闭其他、关闭全部，点击空白、滚动、路由改变或组件卸载时关闭菜单；菜单坐标会限制在可视区域内。

## 验证

为 store 状态转换和路由登记过滤新增 Node 测试，覆盖：首页固定、cache 去重、404/hidden 排除、删除最后一个可关闭标签、关闭其他/全部。执行 `npm test`、`npm run lint` 和 `npm run build`。
