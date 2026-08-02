<template>
  <div class="main-layout">
    <header class="main-layout__header">Admin 管理后台</header>
    <main class="main-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.main-layout { min-height: 100vh; background: #f5f7fa; }
.main-layout__header { padding: 16px 24px; color: #fff; background: #1f2d3d; font-weight: 600; }
.main-layout__content { padding: 24px; }
</style>
