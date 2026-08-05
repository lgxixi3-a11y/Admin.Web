export const ENABLED_STATUS_OPTIONS = [
  { dictLabel: '启用', dictValue: 1, cssClass: 'success' },
  { dictLabel: '禁用', dictValue: 0, cssClass: 'info' }
]

export function collectParentIds(tree) {
  const parentIds = new Set()

  function visit(nodes) {
    for (const node of nodes) {
      if (node.children?.length) {
        parentIds.add(node.id)
        visit(node.children)
      }
    }
  }

  visit(tree)
  return parentIds
}

export function getLeafCheckedKeys(tree, checkedKeys) {
  const parentIds = collectParentIds(tree)
  return checkedKeys.filter(key => !parentIds.has(key))
}

export function mergeMenuKeys(checkedKeys, halfCheckedKeys) {
  return [...new Set([...checkedKeys, ...halfCheckedKeys])]
}

export function filterMenuTreeByKeyword(tree, keyword) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) return tree

  const matches = node =>
    String(node.menuName || '').toLowerCase().includes(normalizedKeyword) ||
    String(node.perms || '').toLowerCase().includes(normalizedKeyword)

  const filterNodes = nodes => nodes
    .map(node => {
      const children = filterNodes(node.children || [])
      if (!matches(node) && children.length === 0) return null
      return { ...node, children }
    })
    .filter(Boolean)

  return filterNodes(tree)
}

export function countSelectedMenuStats(tree, selectedKeys) {
  const selectedKeySet = new Set(selectedKeys)
  let checkedCount = 0
  let buttonCount = 0

  function visit(nodes) {
    for (const node of nodes) {
      if (selectedKeySet.has(node.id)) {
        checkedCount += 1
        if (Number(node.menuType) === 3) buttonCount += 1
      }
      visit(node.children || [])
    }
  }

  visit(tree)
  return { checkedCount, buttonCount }
}

export function getMenuFieldRequirements(menuType) {
  if (menuType === 1) return { path: true, component: false, perms: false }
  if (menuType === 2) return { path: true, component: true, perms: false }
  return { path: false, component: false, perms: true }
}

export function sanitizeMenuFields(source, menuType) {
  if (menuType === 1) return { ...source, component: '', perms: '' }
  if (menuType === 2) return { ...source, perms: '' }
  return { ...source, path: '', component: '', icon: '', isFrame: 0, cacheFlag: 0 }
}
