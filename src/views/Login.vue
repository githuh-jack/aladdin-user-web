<template>
  <div class="login-container">
    <!-- 左侧品牌展示区 -->
    <div class="login-hero">
      <div class="hero-inner">
        <div class="boat-mark">
          <svg viewBox="0 0 24 24" width="56" height="56">
            <path class="boat-hull" d="M3 15c3 2 15 2 18 0l-2.5 4.5c-.4.8-1.2 1.2-2 1.2h-9c-.8 0-1.6-.4-2-1.2L3 15z"/>
            <path d="M12 3l4 10H8L12 3z" fill="#b98a3e"/>
          </svg>
        </div>
        <h1 class="hero-title">传信纸船</h1>
        <p class="hero-sub">把心事折成纸船，寄给在乎的人</p>
        <div class="hero-lines">
          <p>一纸素笺，载着春水与星光</p>
          <p>顺流而下，抵达思念的岸</p>
          <p>见字如面，纸短情长</p>
        </div>
        <div class="hero-waves">
          <svg viewBox="0 0 480 40" width="100%" height="40" preserveAspectRatio="none">
            <path class="wave-accent" d="M0 22 Q 30 10, 60 22 T 120 22 T 180 22 T 240 22 T 300 22 T 360 22 T 420 22 T 480 22 V40 H0 Z"/>
            <path class="wave-gold" d="M0 28 Q 40 18, 80 28 T 160 28 T 240 28 T 320 28 T 400 28 T 480 28 V40 H0 Z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="login-panel">
      <div class="login-paper">
        <div class="boat-mark small">
          <svg viewBox="0 0 24 24" width="30" height="30">
            <path class="boat-hull" d="M3 15c3 2 15 2 18 0l-2.5 4.5c-.4.8-1.2 1.2-2 1.2h-9c-.8 0-1.6-.4-2-1.2L3 15z"/>
            <path d="M12 3l4 10H8L12 3z" fill="#b98a3e"/>
          </svg>
        </div>
        <h2 class="title">欢迎回来</h2>
        <p class="poetic-sub">登船启程，继续你的书信之旅</p>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password
                      @keyup.enter="handleLogin" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" style="width:100%" size="large" @click="handleLogin">登 船</el-button>
          </el-form-item>
          <div class="footer">
            还没有账号？<router-link to="/register">立即注册</router-link>
            <span class="divider">|</span>
            <a @click="openForgot">忘记密码？</a>
          </div>
        </el-form>
      </div>
    </div>

    <!-- 找回密码弹窗：邮箱验证码重置 -->
    <el-dialog v-model="forgotVisible" title="找回密码" width="380px" :close-on-click-modal="false">
      <el-form ref="forgotRef" :model="forgot" :rules="forgotRules" label-position="top">
        <el-form-item label="注册邮箱" prop="email">
          <el-input v-model="forgot.email" placeholder="注册时绑定的邮箱" />
        </el-form-item>
        <el-form-item label="邮箱验证码" prop="emailCode">
          <div class="code-row">
            <el-input v-model="forgot.emailCode" placeholder="6位数字" maxlength="6" />
            <el-button class="code-btn" :disabled="resetCountdown > 0 || resetSending" @click="handleSendResetCode">
              {{ resetCountdown > 0 ? `${resetCountdown}s后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="forgot.newPassword" type="password" placeholder="6-50位字符" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm">
          <el-input v-model="forgot.confirm" type="password" placeholder="再次输入新密码" show-password
                    @keyup.enter="handleReset" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetLoading" @click="handleReset">重置密码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

// ===== 找回密码弹窗 =====
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const forgotVisible = ref(false)
const forgotRef = ref()
const resetLoading = ref(false)
const resetSending = ref(false)
const resetCountdown = ref(0)
let resetTimer = null

const forgot = reactive({ email: '', emailCode: '', newPassword: '', confirm: '' })

const validateConfirm = (rule, value, callback) => {
  if (value !== forgot.newPassword) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const forgotRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: EMAIL_RE, message: '邮箱格式不正确', trigger: 'blur' }
  ],
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 50, message: '长度在6-50之间', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const openForgot = () => {
  Object.assign(forgot, { email: '', emailCode: '', newPassword: '', confirm: '' })
  forgotVisible.value = true
}

// 发送找回密码验证码（scene=reset），成功后60s倒计时
const handleSendResetCode = async () => {
  try {
    await forgotRef.value.validateField('email')
  } catch (e) { return }
  if (!EMAIL_RE.test(forgot.email.trim())) return
  resetSending.value = true
  try {
    await authApi.sendEmailCode(forgot.email.trim(), 'reset')
    ElMessage.success('验证码已发送，请查收邮箱')
    resetCountdown.value = 60
    resetTimer = setInterval(() => {
      resetCountdown.value--
      if (resetCountdown.value <= 0) {
        clearInterval(resetTimer)
        resetTimer = null
      }
    }, 1000)
  } catch (e) {
    // 拦截器已弹错
  } finally {
    resetSending.value = false
  }
}

const handleReset = async () => {
  await forgotRef.value.validate(async (valid) => {
    if (!valid) return
    resetLoading.value = true
    try {
      await authApi.resetPassword({
        email: forgot.email.trim(),
        emailCode: forgot.emailCode.trim(),
        newPassword: forgot.newPassword
      })
      ElMessage.success('密码重置成功，请使用新密码登录')
      forgotVisible.value = false
      form.password = ''
    } catch (e) {
      // 拦截器已弹错
    } finally {
      resetLoading.value = false
    }
  })
}

onBeforeUnmount(() => {
  if (resetTimer) clearInterval(resetTimer)
})

// 登录成功后回到来路页(游客被拦截时带 redirect 参数)
const goAfterLogin = () => {
  const redirect = route.query.redirect
  router.push(typeof redirect === 'string' && redirect ? redirect : '/home')
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    // TODO 临时放行（开发调试用）：admin/00000 前端直通，上线前移除
    if (form.username === 'admin' && (form.password === '00000' || form.password === '000000')) {
      loading.value = true
      try {
        // 优先走后端真实登录（后端已放行 admin/000000），拿到真实token功能全可用
        await userStore.login({ username: 'admin', password: '000000' })
        ElMessage.success('登录成功')
        goAfterLogin()
      } catch (e) {
        // 后端不可用时本地直通，仅能浏览页面
        userStore.devLogin()
        ElMessage.success('登录成功（本地直通模式）')
        goAfterLogin()
      } finally {
        loading.value = false
      }
      return
    }
    loading.value = true
    try {
      await userStore.login(form)
      ElMessage.success('登录成功')
      goAfterLogin()
    } catch (e) {
      // 拦截器已弹错
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  background: var(--paper-bg);
}

/* 左侧品牌展示区 */
.login-hero {
  flex: 1.2;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 25%, color-mix(in srgb, var(--accent) 6%, transparent) 0, transparent 45%),
    radial-gradient(circle at 75% 70%, color-mix(in srgb, var(--gold) 8%, transparent) 0, transparent 45%),
    repeating-linear-gradient(to bottom, transparent 0, transparent 30px, color-mix(in srgb, var(--line) 50%, transparent) 30px, color-mix(in srgb, var(--line) 50%, transparent) 31px),
    var(--paper-bg);
  border-right: 1px solid var(--line);
  overflow: hidden;
}
.boat-hull { fill: var(--accent); }
.wave-accent { fill: color-mix(in srgb, var(--accent) 8%, transparent); }
.wave-gold { fill: color-mix(in srgb, var(--gold) 10%, transparent); }
.hero-inner {
  max-width: 420px;
  padding: 40px;
  text-align: left;
  position: relative;
  z-index: 1;
}
.boat-mark { margin-bottom: 18px; }
.boat-mark.small { margin-bottom: 6px; }
.hero-title {
  font-family: var(--serif);
  font-size: 42px;
  margin: 0 0 10px;
  color: var(--ink);
  letter-spacing: 8px;
}
.hero-sub {
  font-family: var(--serif);
  font-size: 16px;
  color: var(--accent);
  margin: 0 0 30px;
  letter-spacing: 2px;
}
.hero-lines p {
  font-family: var(--serif);
  color: var(--ink-soft);
  margin: 0 0 12px;
  letter-spacing: 1px;
  padding-left: 14px;
  border-left: 2px solid var(--line);
}
.hero-waves {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

/* 右侧登录表单区 */
.login-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
.login-paper {
  width: 380px;
  background:
    repeating-linear-gradient(to bottom, transparent 0, transparent 30px, rgba(231, 220, 198, 0.5) 30px, rgba(231, 220, 198, 0.5) 31px),
    var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 36px 34px 26px;
  box-shadow: 0 8px 30px rgba(140, 116, 80, 0.15);
  text-align: center;
}
.title {
  font-family: var(--serif);
  text-align: center;
  margin: 0 0 4px;
  color: var(--ink);
  letter-spacing: 4px;
}
.poetic-sub { text-align: center; margin: 0 0 20px; }
:deep(.el-form-item__label) { color: var(--ink-soft); }
:deep(.el-input__wrapper) { border-radius: 10px; box-shadow: 0 0 0 1px var(--line) inset; }
.footer { text-align: center; font-size: 13px; color: var(--ink-faint); margin-top: 4px; }
.footer a { color: var(--accent); text-decoration: none; cursor: pointer; }
.footer .divider { margin: 0 8px; color: var(--line); }
.code-row { display: flex; gap: 8px; width: 100%; }
.code-btn { flex-shrink: 0; border-radius: 10px; }

/* 窄屏时左侧隐藏，仅保留右侧表单 */
@media (max-width: 860px) {
  .login-hero { display: none; }
}
</style>
