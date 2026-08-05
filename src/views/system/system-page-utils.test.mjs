import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectParentIds,
  countSelectedMenuStats,
  filterMenuTreeByKeyword,
  getLeafCheckedKeys,
  getMenuFieldRequirements,
  mergeMenuKeys,
  sanitizeMenuFields
} from './system-page-utils.mjs'

test('role menu helpers preserve leaves for echo and merge checked parents once', () => {
  const tree = [{ id: 1, children: [{ id: 2, children: [{ id: 3, children: [] }] }, { id: 4, children: [] }] }]
  assert.deepEqual([...collectParentIds(tree)], [1, 2])
  assert.deepEqual(getLeafCheckedKeys(tree, [1, 2, 3]), [3])
  assert.deepEqual(mergeMenuKeys([3, 4], [1, 2, 3]), [3, 4, 1, 2])
})

test('menu tree search keeps ancestor paths for matching menu names and permission codes', () => {
  const tree = [{
    id: 1,
    menuName: '系统管理',
    children: [{
      id: 2,
      menuName: '用户管理',
      children: [{ id: 3, menuName: '新增用户', perms: 'system:user:add', children: [] }]
    }, {
      id: 4,
      menuName: '角色管理',
      children: []
    }]
  }]

  assert.deepEqual(filterMenuTreeByKeyword(tree, 'USER:ADD'), [{
    id: 1,
    menuName: '系统管理',
    children: [{
      id: 2,
      menuName: '用户管理',
      children: [{ id: 3, menuName: '新增用户', perms: 'system:user:add', children: [] }]
    }]
  }])
  assert.deepEqual(filterMenuTreeByKeyword(tree, '角色'), [{
    id: 1,
    menuName: '系统管理',
    children: [{ id: 4, menuName: '角色管理', children: [] }]
  }])
})

test('selected menu stats include half-selected nodes and count only selected buttons', () => {
  const tree = [{
    id: 1,
    menuType: 1,
    children: [{ id: 2, menuType: 2, children: [{ id: 3, menuType: 3, children: [] }] }, { id: 4, menuType: 3, children: [] }]
  }]

  assert.deepEqual(countSelectedMenuStats(tree, [1, 2, 3]), { checkedCount: 3, buttonCount: 1 })
  assert.deepEqual(countSelectedMenuStats(tree, []), { checkedCount: 0, buttonCount: 0 })
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
