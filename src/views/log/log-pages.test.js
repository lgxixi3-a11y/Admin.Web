const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

function readPage(name) {
  const file = path.join(__dirname, name, 'index.vue')
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
}

test('login log page provides retention cleanup and day-boundary range search', () => {
  const source = readPage('login')

  assert.match(source, /getLoginLogPage/)
  assert.match(source, /clearLoginLogs/)
  assert.match(source, /v-permission="'log:login:clean'"/)
  assert.match(source, /type="daterange"/)
  assert.match(source, /beginTime.*00:00:00/)
  assert.match(source, /endTime.*23:59:59/)
  assert.match(source, /retainDays/)
})

test('operation log page provides JSON detail dialog and authorized cleanup', () => {
  const source = readPage('oper')

  assert.match(source, /getOperLogPage/)
  assert.match(source, /getOperLogDetail/)
  assert.match(source, /clearOperLogs/)
  assert.match(source, /v-permission="'log:oper:clean'"/)
  assert.match(source, /<pre/)
  assert.match(source, /JSON\.stringify/)
  assert.match(source, /requestParam/i)
  assert.match(source, /errorMsg/i)
})
