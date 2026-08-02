<template>
  <main class="login-page">
    <el-card class="login-card" shadow="always">
      <template #header><strong>Admin 管理后台</strong></template>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model.trim="form.userName" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="current-password" @input="resetVerify" />
        </el-form-item>
        <el-form-item label="滑块验证">
          <p class="verify-tip">拖动滑块至 {{ sliderTarget }} 完成验证</p>
          <el-slider v-model="sliderValue" :max="100" :show-tooltip="false" @change="verifySlider" />
          <el-text :type="verified ? 'success' : 'info'">{{ verified ? '验证通过' : '请完成滑块验证' }}</el-text>
        </el-form-item>
        <el-button class="login-button" type="primary" native-type="submit" :loading="loading">登录</el-button>
      </el-form>
    </el-card>
  </main>
</template>

<script>
export default { name: 'LoginPage' }
</script>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

const formRef = ref()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const loading = ref(false)
const sliderValue = ref(0)
const verified = ref(false)
const sliderTarget = ref(createTarget())
const form = reactive({ userName: '', password: '' })
const rules = {
  userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度为 6-64 位', trigger: 'blur' }
  ]
}

function createTarget() {
  return Math.floor(Math.random() * 41) + 30
}

function resetVerify() {
  verified.value = false
  sliderValue.value = 0
  sliderTarget.value = createTarget()
}

function verifySlider(value) {
  verified.value = Math.abs(value - sliderTarget.value) <= 3
  if (!verified.value) {
    ElMessage.warning('滑块位置不正确，请重试')
    sliderValue.value = 0
  }
}

async function submit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!verified.value) {
    ElMessage.warning('请先完成滑块验证')
    return
  }

  loading.value = true
  try {
    const data = await login(form)
    userStore.setTokens(data.accessToken, data.refreshToken)
    permissionStore.resetRoutes()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect.startsWith('/') ? redirect : '/')
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
    resetVerify()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { display: grid; min-height: 100vh; place-items: center; background: #f0f2f5; }
.login-card { width: min(420px, calc(100vw - 32px)); }
.verify-tip { margin: 0 0 8px; color: #606266; font-size: 13px; }
.login-button { width: 100%; }
</style>
