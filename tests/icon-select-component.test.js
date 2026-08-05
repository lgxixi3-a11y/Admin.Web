const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const readSource = relativePath => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')

test('IconSelect binds the full icon catalog through the shared filter and v-model contract', () => {
  const source = readSource('src/components/IconSelect.vue')

  assert.match(source, /import\s+\*\s+as\s+Icons\s+from\s+['"]@element-plus\/icons-vue['"]/, 'imports the full Element Plus icon namespace')
  assert.match(source, /import\s*\{[^}]*ArrowDown[^}]*\}\s*from\s*['"]@element-plus\/icons-vue['"]/, 'imports the trigger arrow')
  assert.match(source, /import\s*\{\s*filterIconNames\s*\}\s*from\s*['"]\.\/icon-select-utils\.mjs['"]/, 'uses the shared icon filtering utility')
  assert.match(source, /defineProps\(\{\s*modelValue\s*:/s, 'accepts a modelValue prop')
  assert.match(source, /defineEmits\(\[\s*['"]update:modelValue['"]\s*\]\)/, 'emits v-model updates')
  assert.match(source, /Object\.keys\(Icons\)/, 'gets every exported icon name')
  assert.match(source, /filterIconNames\(iconNames,\s*keyword\.value\)/, 'filters icons with the shared utility')
  assert.match(source, /emit\(\s*['"]update:modelValue['"]\s*,\s*name\s*\)/, 'returns the selected icon name')
  assert.match(source, /popVisible\.value\s*=\s*false/, 'closes after selection')
})

test('IconSelect renders the required searchable popover grid', () => {
  const source = readSource('src/components/IconSelect.vue')

  assert.match(source, /<el-popover\s+v-model:visible="popVisible"/, 'binds popover visibility')
  assert.match(source, /<component\s+:is="iconOf\(modelValue\)"\s*\/>/, 'previews the selected icon')
  assert.match(source, /v-else[^>]*>\s*请选择图标\s*</, 'shows an icon placeholder')
  assert.match(source, /<ArrowDown\s*\/>/, 'shows ArrowDown in the trigger')
  assert.match(source, /<el-input\s+v-model\.trim="keyword"/, 'binds a trim-enabled search input')
  assert.match(source, /\.icon-scroll\s*\{\s*height:\s*240px;/, 'uses a 240px scrolling icon panel')
  assert.match(source, /grid-template-columns:\s*repeat\(8,\s*1fr\)/, 'uses an eight-column icon grid')
  assert.match(source, /v-for="name in filteredIcons"/, 'renders filtered icons')
  assert.match(source, /:key="name"/, 'keys each icon cell by name')
  assert.match(source, /:title="name"/, 'titles each icon cell with its name')
  assert.match(source, /:class="\{\s*active:\s*name\s*===\s*modelValue\s*\}"/, 'highlights the active icon')
  assert.match(source, /@click="select\(name\)"/, 'selects the clicked icon')
})

test('MenuFormDialog uses IconSelect for non-button menu icons', () => {
  const source = readSource('src/views/system/menu/components/MenuFormDialog.vue')

  assert.match(source, /import\s+IconSelect\s+from\s+['"]@\/components\/IconSelect\.vue['"]/, 'imports IconSelect')
  assert.match(source, /<el-row\s+v-if="form\.menuType\s*!==\s*3"/, 'preserves the non-button boundary')
  assert.match(source, /<IconSelect\s+v-model="form\.icon"\s*\/>/, 'binds the menu icon to IconSelect')
  assert.doesNotMatch(source, /<el-input\s+v-model="form\.icon"/, 'removes the raw icon input')
})
