# System Tool Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver scheduled-job and system-settings pages, including a safe server-side database connection test.

**Architecture:** The job page uses existing `/tool/job` endpoints with `PaginationTable`, scoped row buttons, and a paginated log dialog filtered by job id. The settings page consumes `/tool/setting`; its database card uses a new read-only test endpoint, while switch uses the existing `dbSwitch` endpoint only after confirmation.

**Tech Stack:** Vue 3 `script setup`, Element Plus, Axios API modules, ASP.NET Core 8, and the existing SqlSugar database service.

## Global Constraints

- Keep front-end implementation in `Admin.Web`; stage only `src/views/tool` for the requested front-end commit.
- Reuse `PaginationTable`, `v-permission`, and the existing HTTP error interceptor.
- Job status `1` is active and `0` is paused; render only the matching resume or pause action.
- Database test is read-only and gated by `tool:setting:dbSwitch`, the same permission as switching.
- Never show or log a connection-string password outside its password input.

---

### Task 1: Add the safe database-test contract

**Files:**
- Modify: `D:\testproject\Admin.Project\Admin.WebApi\Admin.WebApi\Controllers\SettingController.cs`
- Modify: `D:\testproject\Admin.Project\Admin.WebApi\Admin.Services\Setting\ISysSettingService.cs`
- Modify: `D:\testproject\Admin.Project\Admin.WebApi\Admin.Services\Setting\SysSettingService.cs`
- Modify: `src/api/setting.js`
- Modify: `tests/system-api.test.js`

**Interfaces:**
- Consumes: `IDataBaseService.TestConnectionAsync(string dbType, string connectionString, CancellationToken)`.
- Produces: `PUT /api/tool/setting/testConnection`, `testDatabaseConnection(data)`.

- [ ] Write a failing API-contract test: `testDatabaseConnection({ dbType: 'sqlite', connectionString: 'Data Source=test.db' })` invokes `PUT /tool/setting/testConnection` with the payload.
- [ ] Run `npm test`; it fails because `testDatabaseConnection` is absent.
- [ ] Implement `testDatabaseConnection = data => request.put('/tool/setting/testConnection', data)` in `src/api/setting.js`.
- [ ] Add `TestConnectionAsync(DbSwitchInput, CancellationToken)` to `ISysSettingService` and delegate it from `SysSettingService` to `_database.TestConnectionAsync`.
- [ ] Add the controller action using `DbSwitchInput`, `RequirePerm("tool:setting:dbSwitch")`, and `_service.TestConnectionAsync`; it does not call `SwitchDatabaseAsync`.
- [ ] Run `npm test` and the WebAPI build.

### Task 2: Build scheduled-job management

**Files:**
- Create: `src/views/tool/job/index.vue`

**Interfaces:**
- Consumes: `getJobPage`, `createJob`, `updateJob`, `removeJob`, `runJob`, `pauseJob`, `resumeJob`, and `getJobLogPage`.
- Produces: paginated CRUD table, row actions, and nested paginated job-log dialog.

- [ ] Create a failing targeted page-contract test that checks a pure job-status helper maps `1` to `pause` and `0` to `resume`.
- [ ] Run the targeted test and verify it fails because the helper is absent.
- [ ] Implement the minimal helper and use it in the page condition.
- [ ] Implement search by `jobName`/`status`, `PaginationTable`, a create/edit `JobInput` dialog, delete confirmation, and immediate-run confirmation with permissions `tool:job:add/edit/del/run/pause/resume`.
- [ ] Implement a log dialog with independent page state and `getJobLogPage({ pageIndex, pageSize, jobId })`, status, message, elapsed milliseconds, and run time.
- [ ] Run the helper test and Vue lint for this page.

### Task 3: Build settings and database switch UI

**Files:**
- Create: `src/views/tool/setting/index.vue`

**Interfaces:**
- Consumes: `getSettings`, `updateSetting`, `removeSetting`, `testDatabaseConnection`, and `switchDatabase`.
- Produces: a settings table/edit dialog and permission-gated database-switch card.

- [ ] Implement settings load/edit/delete with a normal key/value/remark list, read-only key during edits, delete confirmation, and `tool:setting:list/edit/del` permissions.
- [ ] Implement the database card under `v-permission="'tool:setting:dbSwitch'"` with PostgreSQL, MySQL, SQL Server, and SQLite options plus a password input and type-specific placeholder examples.
- [ ] Wire Test Connection to validate both fields and call `testDatabaseConnection`, displaying success only when it completes.
- [ ] Wire Switch to confirmation then `switchDatabase`; call `ElMessage.success` and clear the password-bearing value afterwards.
- [ ] Run Vue lint for this page.

### Task 4: Verify and commit requested front-end files

- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Run `git diff --check` and inspect `git diff -- src/views/tool`.
- [ ] Run `git add src/views/tool`.
- [ ] Run `git commit -m "feat: 系统工具页面(定时任务/系统设置, 含数据库切换)"`.
- [ ] Verify `git show --stat --oneline HEAD` and `git status --short`.
