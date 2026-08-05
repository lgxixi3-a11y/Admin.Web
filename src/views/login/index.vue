<template>
  <main class="login-page">
    <div class="login-grid" aria-hidden="true" />
    <el-card class="login-card" shadow="always">
      <div class="login-brand">
        <h1 class="login-title">Admin 管理后台</h1>
        <p class="login-subtitle">统一权限 · 系统管理平台</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent="submit">
        <el-form-item prop="userName">
          <el-input
            v-model.trim="form.userName"
            placeholder="用户名"
            :prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            show-password
            :prefix-icon="Lock"
            autocomplete="current-password"
          />
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model.trim="form.captcha"
              placeholder="验证码"
              maxlength="6"
              class="captcha-input"
              @keyup.enter="submit"
            />
            <CaptchaCanvas ref="captchaRef" />
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.rememberMe" class="remember-checkbox">记住我（7 天内免登录）</el-checkbox>
        </el-form-item>

        <el-button type="primary" native-type="submit" class="login-button" :loading="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>

      <p class="login-footer">© 2026 Admin</p>
    </el-card>
  </main>
</template>

<script>
export default { name: 'LoginPage' }
</script>

<script setup>
import { reactive, ref } from 'vue'
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import CaptchaCanvas from '@/components/CaptchaCanvas'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

const formRef = ref()
const captchaRef = ref()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const loading = ref(false)
const submitting = ref(false)
const form = reactive({ userName: '', password: '', captcha: '', rememberMe: true })
const rules = {
  userName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度为 6-64 位', trigger: 'blur' }
  ],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

function resetCaptcha() {
  captchaRef.value?.refresh()
  form.captcha = ''
}

async function submit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    if (!captchaRef.value.validate(form.captcha)) {
      ElMessage.warning('验证码不正确，请重试')
      resetCaptcha()
      return
    }

    loading.value = true
    try {
      const data = await login(form)
      userStore.setTokens(data.accessToken, data.refreshToken, form.rememberMe)
      permissionStore.resetRoutes()
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      await router.replace(redirect.startsWith('/') ? redirect : '/')
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
      resetCaptcha()
    } finally {
      loading.value = false
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  align-items: center;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(56, 189, 248, 0.25), transparent 60%),
    radial-gradient(1000px 500px at 90% 110%, rgba(129, 140, 248, 0.25), transparent 55%),
    linear-gradient(135deg, #0b1526 0%, #12233f 45%, #0f2c4d 100%);
  display: grid;
  min-height: 100vh;
  overflow: hidden;
  padding: 24px;
  place-items: center;
  position: relative;
}

.login-grid {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 32px 32px;
  inset: 0;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.75), transparent 78%);
  pointer-events: none;
  position: absolute;
}

.login-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(3, 12, 28, 0.42);
  overflow: hidden;
  position: relative;
  width: min(420px, 92vw);
  z-index: 1;
}

.login-card :deep(.el-card__body) {
  padding: 38px 36px 24px;
}

.login-brand {
  margin-bottom: 30px;
  text-align: center;
}

.login-title {
  color: #172554;
  font-size: 28px;
  letter-spacing: 1px;
  margin: 0;
  text-shadow: 0 3px 12px rgba(56, 189, 248, 0.24);
}

.login-subtitle {
  color: #64748b;
  font-size: 14px;
  letter-spacing: 0.5px;
  margin: 10px 0 0;
}

.captcha-row {
  align-items: center;
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.login-button {
  background: linear-gradient(90deg, #38bdf8, #6366f1);
  border: 0;
  box-shadow: 0 10px 18px rgba(79, 70, 229, 0.25);
  font-weight: 600;
  letter-spacing: 6px;
  transition: filter 0.2s ease, transform 0.2s ease;
  width: 100%;
}

.remember-checkbox {
  color: #475569;
}

.login-button:hover,
.login-button:focus-visible {
  background: linear-gradient(90deg, #5dd2ff, #818cf8);
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.login-footer {
  color: #94a3b8;
  font-size: 12px;
  margin: 24px 0 0;
  text-align: center;
}

@media (max-width: 480px) {
  .login-page {
    padding: 16px;
  }

  .login-card :deep(.el-card__body) {
    padding: 32px 24px 20px;
  }

  .captcha-row {
    gap: 8px;
  }
}
</style>
