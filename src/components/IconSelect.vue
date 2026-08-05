<template>
  <el-popover v-model:visible="popVisible" trigger="click" width="360">
    <template #reference>
      <div class="icon-select-trigger">
        <el-icon v-if="modelValue" class="icon-preview"><component :is="iconOf(modelValue)" /></el-icon>
        <span v-else class="icon-placeholder">请选择图标</span>
        <el-icon class="icon-arrow"><ArrowDown /></el-icon>
      </div>
    </template>

    <div class="icon-select-panel">
      <el-input v-model.trim="keyword" placeholder="搜索图标名称" clearable class="icon-search" />
      <el-scrollbar class="icon-scroll">
        <div class="icon-grid">
          <div
            v-for="name in filteredIcons"
            :key="name"
            class="icon-cell"
            :class="{ active: name === modelValue }"
            :title="name"
            @click="select(name)"
          >
            <el-icon><component :is="iconOf(name)" /></el-icon>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </el-popover>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, ref } from 'vue'
import * as Icons from '@element-plus/icons-vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { filterIconNames } from './icon-select-utils.mjs'

defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const popVisible = ref(false)
const keyword = ref('')
const iconNames = Object.keys(Icons)
const filteredIcons = computed(() => filterIconNames(iconNames, keyword.value))
const iconOf = name => (name && Icons[name]) || null

function select(name) {
  emit('update:modelValue', name)
  popVisible.value = false
}
</script>

<style scoped>
.icon-select-trigger { display: flex; align-items: center; gap: 8px; padding: 4px 10px; border: 1px solid #dcdfe6; border-radius: 4px; cursor: pointer; min-width: 140px; }
.icon-select-panel { padding: 4px; }
.icon-search { margin-bottom: 8px; }
.icon-scroll { height: 240px; }
.icon-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }
.icon-cell { display: flex; align-items: center; justify-content: center; height: 32px; border-radius: 4px; cursor: pointer; }
.icon-cell:hover { background: #f0f2f5; }
.icon-cell.active { color: #409eff; background: #ecf5ff; }
</style>
