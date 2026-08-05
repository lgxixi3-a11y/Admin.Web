const assert = require('node:assert/strict')
const test = require('node:test')

test('filters icon names by a case-insensitive keyword after sorting', async () => {
  const { filterIconNames } = await import('../src/components/icon-select-utils.mjs')

  assert.deepEqual(filterIconNames(['Zoom', 'Alarm', 'Apple'], ''), ['Alarm', 'Apple', 'Zoom'])
  assert.deepEqual(filterIconNames(['Zoom', 'Alarm', 'Apple'], 'a'), ['Alarm', 'Apple'])
})

test('limits the initial unfiltered icon list', async () => {
  const { filterIconNames } = await import('../src/components/icon-select-utils.mjs')

  assert.equal(filterIconNames(Array.from({ length: 201 }, (_, i) => `Icon${i}`), '').length, 200)
})

test('returns every searched icon match without applying the initial limit', async () => {
  const { filterIconNames } = await import('../src/components/icon-select-utils.mjs')

  assert.equal(filterIconNames(Array.from({ length: 201 }, (_, i) => `Icon${i}`), 'icon').length, 201)
})
