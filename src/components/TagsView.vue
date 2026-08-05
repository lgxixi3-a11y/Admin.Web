<template>
  <div class="tags-view">
    <el-scrollbar class="tags-view__scroll" always>
      <div class="tags-view__list">
        <router-link
          v-for="tag in visitedViews"
          :key="tag.fullPath"
          :to="tag.fullPath"
          class="tags-view__item"
          :class="{ active: isActive(tag) }"
          @contextmenu.prevent="openMenu(tag, $event)"
        >
          <span class="tags-view__title">{{ tag.title }}</span>
          <el-icon
            v-if="!tag.affix"
            class="tags-view__close"
            aria-label="关闭标签"
            @click.prevent.stop="closeTag(tag)"
          >
            <Close />
          </el-icon>
        </router-link>
      </div>
    </el-scrollbar>

    <ul
      v-show="menuVisible"
      class="tags-view__context-menu"
      :style="{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }"
    >
      <li :class="{ disabled: selectedTag?.affix }" @click="closeTag(selectedTag)">关闭当前</li>
      <li @click="closeOthers(selectedTag)">关闭其他</li>
      <li @click="closeAll">关闭所有</li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useTagsViewStore } from '@/stores/tagsView'
import { nextViewAfterClose } from '@/utils/tags-view-utils.mjs'

const CONTEXT_MENU_WIDTH = 116
const CONTEXT_MENU_HEIGHT = 102

const route = useRoute()
const router = useRouter()
const tagsViewStore = useTagsViewStore()
const visitedViews = computed(() => tagsViewStore.visitedViews)
const menuVisible = ref(false)
const selectedTag = ref(null)
const menuPosition = ref({ left: 0, top: 0 })

function isActive(tag) {
  return tag.fullPath === route.fullPath
}

function openMenu(tag, event) {
  selectedTag.value = tag
  menuPosition.value = {
    left: Math.min(event.clientX, Math.max(0, window.innerWidth - CONTEXT_MENU_WIDTH)),
    top: Math.min(event.clientY, Math.max(0, window.innerHeight - CONTEXT_MENU_HEIGHT))
  }
  menuVisible.value = true
}

function closeMenu() {
  menuVisible.value = false
}

function closeTag(tag) {
  closeMenu()
  if (!tag || tag.affix) return

  const nextView = isActive(tag) ? nextViewAfterClose(visitedViews.value, tag) : null
  tagsViewStore.delView(tag)
  if (nextView) router.push(nextView.fullPath)
  else if (isActive(tag)) router.push('/dashboard')
}

function closeOthers(tag) {
  closeMenu()
  if (!tag) return

  tagsViewStore.delOthers(tag)
  if (!isActive(tag)) router.push(tag.fullPath)
}

function closeAll() {
  closeMenu()
  tagsViewStore.delAll()
  router.push('/dashboard')
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
  window.addEventListener('resize', closeMenu)
  window.addEventListener('scroll', closeMenu, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu)
  window.removeEventListener('resize', closeMenu)
  window.removeEventListener('scroll', closeMenu, true)
})
</script>

<style scoped>
.tags-view { position: relative; display: flex; align-items: center; height: 36px; padding: 0 12px; background: #fff; border-bottom: 1px solid #ebeef5; }
.tags-view__scroll { width: 100%; }
.tags-view__scroll :deep(.el-scrollbar__wrap) { overflow-x: auto; overflow-y: hidden; }
.tags-view__list { display: inline-flex; min-width: max-content; gap: 8px; padding: 4px 0; }
.tags-view__item { display: inline-flex; align-items: center; max-width: 180px; gap: 5px; padding: 3px 9px; color: #606266; font-size: 12px; line-height: 20px; text-decoration: none; white-space: nowrap; border: 1px solid #dcdfe6; border-radius: 3px; cursor: pointer; }
.tags-view__item:hover { color: #409eff; border-color: #b3d8ff; }
.tags-view__item.active { color: #fff; background: #409eff; border-color: #409eff; }
.tags-view__title { overflow: hidden; text-overflow: ellipsis; }
.tags-view__close { width: 14px; height: 14px; border-radius: 50%; }
.tags-view__close:hover { color: #409eff; background: #fff; }
.tags-view__context-menu { position: fixed; z-index: 3000; min-width: 116px; margin: 0; padding: 5px 0; list-style: none; background: #fff; border-radius: 4px; box-shadow: 0 2px 12px rgb(0 0 0 / 15%); }
.tags-view__context-menu li { padding: 6px 18px; color: #303133; font-size: 13px; line-height: 22px; cursor: pointer; }
.tags-view__context-menu li:hover { background: #f5f7fa; }
.tags-view__context-menu li.disabled { color: #c0c4cc; cursor: not-allowed; }
.tags-view__context-menu li.disabled:hover { background: transparent; }
</style>
