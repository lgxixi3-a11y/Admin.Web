# AssignMenuDialog Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace role-menu assignment modal with a searchable drawer that preserves hierarchical permission selection semantics.

**Architecture:** Keep `AssignMenuDialog.vue` self-contained. It receives the complete menu tree, derives a pruned display tree which retains matching ancestors, and synchronizes Element Plus tree selection into reactive statistics. Existing system-page utility functions remain the authority for leaf-only echo and checked/half-checked submission.

**Tech Stack:** Vue 3 Composition API, Element Plus `el-drawer` and `el-tree`, Node built-in test runner.

## Global Constraints

- Work only on phase D files; preserve unrelated working-tree changes.
- Echo selected menu permissions with `getLeafCheckedKeys(menuTree, detail.menuIds || [])`.
- Submit `mergeMenuKeys(treeRef.getCheckedKeys(), treeRef.getHalfCheckedKeys())`.
- Keyword filtering must retain every ancestor of a matching menu name or permission code.
- Button statistic counts selected or half-selected nodes where `menuType === 3`.

---

### Task 1: Extract and test pure tree-display helpers

**Files:**
- Modify: `src/views/system/system-page-utils.mjs`
- Test: `src/views/system/system-page-utils.test.mjs`

**Interfaces:**
- Produces `filterMenuTreeByKeyword(tree, keyword)` returning a cloned pruned tree while preserving ancestor paths.
- Produces `countSelectedMenuStats(tree, selectedKeys)` returning `{ checkedCount, buttonCount }`.

- [ ] **Step 1: Write failing tests** for a parent path retained for a matching descendant, a matching parent retaining its subtree, case-insensitive name/permission matches, and selected button counting.
- [ ] **Step 2: Run** `node --test src/views/system/system-page-utils.test.mjs` and verify the missing exports fail.
- [ ] **Step 3: Implement** a recursive pruner and ID-to-node traversal without changing existing leaf/merge helpers.
- [ ] **Step 4: Run** `node --test src/views/system/system-page-utils.test.mjs` and verify every helper test passes.

### Task 2: Rebuild AssignMenuDialog as a drawer

**Files:**
- Modify: `src/views/system/role/components/AssignMenuDialog.vue`

**Interfaces:**
- Consumes `filterMenuTreeByKeyword` and `countSelectedMenuStats` from `../../system-page-utils.mjs`.
- Continues exposing `open(row)` and emitting `saved` after a successful assignment.

- [ ] **Step 1: Replace** `el-dialog` with a 520px `el-drawer`, header search box, expand/collapse controls, scrollable checkbox tree, selected statistics, and drawer footer actions.
- [ ] **Step 2: Derive** tree data from the keyword helper, update selection state in `@check`, and expand the visible hierarchy after opening, filtering, or clicking expand-all.
- [ ] **Step 3: Preserve** `getLeafCheckedKeys` in `open`, and read checked plus half-checked keys through `mergeMenuKeys` in `save`.
- [ ] **Step 4: Reset** drawer state only after it closes.

### Task 3: Verify the integration

**Files:**
- Verify: `src/views/system/role/components/AssignMenuDialog.vue`
- Verify: `src/views/system/system-page-utils.mjs`
- Verify: `src/views/system/system-page-utils.test.mjs`

- [ ] **Step 1: Run** `node --test src/views/system/system-page-utils.test.mjs`.
- [ ] **Step 2: Run** `npm run lint`.
- [ ] **Step 3: Run** `npm run build`.
- [ ] **Step 4: Inspect** the final diff to prove the drawer, search ancestor preservation, expand/collapse controls, stats, leaf echo, and merged submission requirements are all present.
