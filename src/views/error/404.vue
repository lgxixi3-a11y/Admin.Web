<template>
  <el-result icon="warning" title="404" sub-title="页面不存在或您没有访问权限。">
    <template #extra>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </template>
  </el-result>
</template>

<script>
export default { name: 'NotFoundPage' }
</script>
