const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const { transformSync } = require('@babel/core')

function loadApi(fileName, request) {
  const filePath = path.join(__dirname, '../src/api', fileName)
  const source = fs.readFileSync(filePath, 'utf8')
  const compiled = transformSync(source, {
    filename: fileName,
    plugins: ['@babel/plugin-transform-modules-commonjs']
  }).code
  const module = { exports: {} }

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: id => (id === './http' ? request : require(id))
  })

  return module.exports
}

function createRequestSpy() {
  const calls = []
  return {
    calls,
    get: (...args) => calls.push(['get', ...args]),
    post: (...args) => calls.push(['post', ...args]),
    put: (...args) => calls.push(['put', ...args]),
    delete: (...args) => calls.push(['delete', ...args])
  }
}

test('user API sends each system user operation to its documented endpoint', () => {
  const request = createRequestSpy()
  const api = loadApi('user.js', request)

  api.getUserPage({ pageNum: 1 })
  api.getUser(7)
  api.createUser({ userName: 'alice' })
  api.updateUser({ id: 7 })
  api.removeUser(7)
  api.resetUserPwd({ id: 7, password: 'new-password' })
  api.assignUserRoles({ userId: 7, roleIds: [1] })
  api.changeUserStatus({ id: 7, status: 0 })

  assert.deepEqual(JSON.parse(JSON.stringify(request.calls)), [
    ['get', '/system/user/page', { params: { pageNum: 1 } }],
    ['get', '/system/user/7'],
    ['post', '/system/user', { userName: 'alice' }],
    ['put', '/system/user', { id: 7 }],
    ['delete', '/system/user/7'],
    ['put', '/system/user/resetPwd', { id: 7, password: 'new-password' }],
    ['put', '/system/user/assignRoles', { userId: 7, roleIds: [1] }],
    ['put', '/system/user/changeStatus', { id: 7, status: 0 }]
  ])
})

test('role API sends each system role operation to its documented endpoint', () => {
  const request = createRequestSpy()
  const api = loadApi('role.js', request)

  api.getRolePage({ pageNum: 1 })
  api.getRole(2)
  api.createRole({ roleName: 'operator' })
  api.updateRole({ id: 2 })
  api.removeRole(2)
  api.assignRoleMenus({ roleId: 2, menuIds: [101] })

  assert.deepEqual(JSON.parse(JSON.stringify(request.calls)), [
    ['get', '/system/role/page', { params: { pageNum: 1 } }],
    ['get', '/system/role/2'],
    ['post', '/system/role', { roleName: 'operator' }],
    ['put', '/system/role', { id: 2 }],
    ['delete', '/system/role/2'],
    ['put', '/system/role/assignMenus', { roleId: 2, menuIds: [101] }]
  ])
})

test('menu API sends each system menu operation to its documented endpoint', () => {
  const request = createRequestSpy()
  const api = loadApi('menu.js', request)

  api.getMenuTree()
  api.getMenuList()
  api.getMenu(103)
  api.createMenu({ menuName: 'Users' })
  api.updateMenu({ id: 103 })
  api.removeMenu(103)

  assert.deepEqual(JSON.parse(JSON.stringify(request.calls)), [
    ['get', '/system/menu/tree'],
    ['get', '/system/menu/list'],
    ['get', '/system/menu/103'],
    ['post', '/system/menu', { menuName: 'Users' }],
    ['put', '/system/menu', { id: 103 }],
    ['delete', '/system/menu/103']
  ])
})

test('setting API sends database connection tests to the read-only endpoint', () => {
  const request = createRequestSpy()
  const api = loadApi('setting.js', request)
  const input = { dbType: 'sqlite', connectionString: 'Data Source=test.db' }

  api.testDatabaseConnection(input)

  assert.deepEqual(JSON.parse(JSON.stringify(request.calls)), [
    ['put', '/tool/setting/testConnection', input]
  ])
})
