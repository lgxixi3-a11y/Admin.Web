<template>
  <el-container class="app-wrapper">
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
      <div class="sidebar__brand">
        <el-icon><Monitor /></el-icon>
        <span v-show="!collapsed">Admin 管理后台</span>
      </div>

      <el-menu
        :collapse="collapsed"
        :collapse-transition="false"
        :default-active="route.path"
        class="sidebar__menu"
        @select="handleMenuSelect"
      >
        <template v-for="menu in navMenus" :key="menu.id">
          <el-sub-menu v-if="menu.children?.length" :index="menu.path || String(menu.id)">
            <template #title>
              <el-icon><component :is="iconOf(menu.icon)" /></el-icon>
              <span>{{ menu.menuName }}</span>
            </template>
            <el-menu-item
              v-for="item in menu.children"
              :key="item.id"
              :index="item.path || String(item.id)"
            >
              <el-icon><component :is="iconOf(item.icon)" /></el-icon>
              <span>{{ item.menuName }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="menu.path || String(menu.id)">
            <el-icon><component :is="iconOf(menu.icon)" /></el-icon>
            <template #title>{{ menu.menuName }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header__left">
          <el-button :icon="collapsed ? Expand : Fold" text @click="toggleCollapse" />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="28" :src="userStore.userInfo?.avatar">
              {{ displayName.slice(0, 1) }}
            </el-avatar>
            <span>{{ displayName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <TagsView />

      <el-main class="main-content">
        <RouterView v-slot="{ Component }">
          <keep-alive :include="cachedViews">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </RouterView>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Expand, Fold, Monitor } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'
import { logoutApi } from '@/api/auth'
import TagsView from '@/components/TagsView.vue'
import { useUserStore } from '@/stores/user'
import { useTagsViewStore } from '@/stores/tagsView'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const tagsViewStore = useTagsViewStore()
const collapsed = ref(false)
let collapseTimer

const navMenus = computed(() => (userStore.menus || [])
  .filter(menu => Number(menu.menuType) !== 3 && Number(menu.visible) === 1)
  .map(menu => ({
    ...menu,
    children: (menu.children || [])
      .filter(child => Number(child.menuType) !== 3 && Number(child.visible) === 1)
  })))

const breadcrumbs = computed(() => route.matched.filter(item => item.meta?.title))
const cachedViews = computed(() => tagsViewStore.cachedViews)
const displayName = computed(() => {
  const info = userStore.userInfo || {}
  const parts = [info.userName, info.nickName].filter(Boolean)
  return parts.length ? parts.join(' ') : '用户'
})

function iconOf(name) {
  return name ? Icons[name] || Icons.Menu : Icons.Menu
}

function handleMenuSelect(path) {
  if (path.startsWith('/') && path !== route.path) router.push(path)
}

function toggleCollapse() {
  clearTimeout(collapseTimer)
  collapseTimer = setTimeout(() => {
    collapsed.value = !collapsed.value
    collapseTimer = undefined
  }, 50)
}

onBeforeUnmount(() => clearTimeout(collapseTimer))

async function handleCommand(command) {
  if (command !== 'logout') return

  try {
    await logoutApi()
  } finally {
    userStore.logout()
    router.replace('/login')
  }
}
</script>

<style scoped>
.app-wrapper { min-height: 100vh; background: #f5f7fa; }
.sidebar { overflow: hidden; color: #fff; background: #1f2d3d; transition: width 0.15s ease; }
.sidebar__brand { display: flex; align-items: center; gap: 10px; height: 56px; padding: 0 20px; font-size: 16px; font-weight: 600; white-space: nowrap; }
.sidebar__menu { height: calc(100vh - 56px); border-right: 0; background: transparent; }
.sidebar :deep(.el-menu), .sidebar :deep(.el-sub-menu__title), .sidebar :deep(.el-menu-item) { color: #c0c4cc; background: transparent; }
.sidebar :deep(.el-menu-item:hover), .sidebar :deep(.el-sub-menu__title:hover) { color: #fff; background: #263445; }
.sidebar :deep(.el-menu-item.is-active) { color: #fff; background: #409eff; }
.main-container { min-width: 0; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; background: #fff; border-bottom: 1px solid #ebeef5; }
.header__left, .user-info { display: flex; align-items: center; gap: 12px; }
.user-info { cursor: pointer; color: #303133; font-size: 14px; }
.main-content { padding: 20px; }
</style>
