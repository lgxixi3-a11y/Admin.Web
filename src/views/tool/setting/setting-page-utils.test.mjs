import assert from 'node:assert/strict'
import test from 'node:test'
import { getConnectionPlaceholder } from './setting-page-utils.mjs'

test('connection placeholders match the selected database type', () => {
  assert.match(getConnectionPlaceholder('postgresql'), /Host=/)
  assert.match(getConnectionPlaceholder('mysql'), /Server=/)
  assert.match(getConnectionPlaceholder('sqlserver'), /Server=/)
  assert.match(getConnectionPlaceholder('sqlite'), /Data Source=/)
})
