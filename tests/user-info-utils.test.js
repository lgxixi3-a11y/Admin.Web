const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const test = require('node:test')

test('normalizeUserInfo keeps only trimmed public profile fields', async () => {
  const modulePath = pathToFileURL(path.join(__dirname, '../src/utils/user-info-utils.mjs')).href
  const { normalizeUserInfo } = await import(modulePath)

  assert.deepEqual(
    normalizeUserInfo({
      userId: 7,
      userName: ' admin ',
      nickName: ' 超级管理员 ',
      avatar: ' https://example.test/avatar.png ',
      password: 'must-not-be-stored'
    }),
    {
      userId: 7,
      userName: 'admin',
      nickName: '超级管理员',
      avatar: 'https://example.test/avatar.png'
    }
  )
})
