<template>
  <section class="pagination-table">
    <div v-if="$slots.toolbar" class="pagination-table__toolbar">
      <slot name="toolbar" />
      <el-button :loading="loading" @click="$emit('refresh')">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="data" v-bind="tableProps">
      <slot />
      <template #empty>
        <slot name="empty">暂无数据</slot>
      </template>
    </el-table>

    <div v-if="showPagination" class="pagination-table__pagination">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="paginationLayout"
        v-bind="paginationProps"
        @update:current-page="changePage"
        @update:page-size="changePageSize"
      />
    </div>
  </section>
</template>

<script setup>
/* global defineProps, defineEmits */

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
  showPagination: { type: Boolean, default: true },
  paginationLayout: { type: String, default: 'total, sizes, prev, pager, next, jumper' },
  tableProps: { type: Object, default: () => ({}) },
  paginationProps: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:page', 'update:pageSize', 'change', 'refresh'])

function emitChange(page, pageSize) {
  emit('change', { page, pageSize })
}

function changePage(page) {
  emit('update:page', page)
  emitChange(page, props.pageSize)
}

function changePageSize(pageSize) {
  emit('update:pageSize', pageSize)
  emit('update:page', 1)
  emitChange(1, pageSize)
}
</script>

<style scoped>
.pagination-table__toolbar,
.pagination-table__pagination {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.pagination-table__toolbar {
  justify-content: space-between;
}

.pagination-table__pagination {
  justify-content: flex-end;
  margin-top: 16px;
  margin-bottom: 0;
}
</style>
