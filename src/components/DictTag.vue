<template>
  <template v-for="item in resolvedValues" :key="String(item.value)">
    <el-tag :type="item.option?.cssClass || defaultType" :effect="effect" :size="size">
      {{ item.option?.dictLabel || item.value }}
    </el-tag>
  </template>
</template>

<script setup>
/* global defineProps */
import { computed, ref, watch } from 'vue'
import { getDictDataByType } from '@/api/dict'

const props = defineProps({
  dictType: { type: String, required: true },
  value: { type: [String, Number, Array], default: '' },
  options: { type: Array, default: () => [] },
  defaultType: { type: String, default: 'info' },
  effect: { type: String, default: 'light' },
  size: { type: String, default: 'default' }
})

const loadedOptions = ref([])
const optionSource = computed(() => props.options.length ? props.options : loadedOptions.value)
const resolvedValues = computed(() => {
  const values = Array.isArray(props.value) ? props.value : [props.value]
  return values.filter(value => value !== null && value !== undefined && value !== '').map(value => ({
    value,
    option: optionSource.value.find(item => String(item.dictValue) === String(value))
  }))
})

async function loadOptions() {
  if (!props.dictType || props.options.length) {
    loadedOptions.value = []
    return
  }
  loadedOptions.value = await getDictDataByType(props.dictType)
}

watch(() => [props.dictType, props.options], loadOptions, { immediate: true, deep: true })
</script>
