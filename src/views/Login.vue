<template>
  <div class="login-container">
    <div class="login-paper">
      <div class="boat-mark">
        <svg viewBox="0 0 24 24" width="34" height="34">
          <path d="M3 15c3 2 15 2 18 0l-2.5 4.5c-.4.8-1.2 1.2-2 1.2h-9c-.8 0-1.6-.4-2-1.2L3 15z" fill="#b3574d"/>
          <path d="M12 3l4 10H8L12 3z" fill="#b98a3e"/>
        </svg>
      </div>
      <h2 class="title">传信纸船</h2>
      <p class="poetic-sub">把心事折成纸船，寄给在乎的人</p>
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
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

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
        router.push('/home')
      } catch (e) {
        // 后端不可用时本地直通，仅能浏览页面
        userStore.devLogin()
        ElMessage.success('登录成功（本地直通模式）')
        router.push('/home')
      } finally {
        loading.value = false
      }
      return
    }
    loading.value = true
    try {
      await userStore.login(form)
      ElMessage.success('登录成功')
      router.push('/home')
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
  align-items: center;
  justify-content: center;
  background: var(--paper-bg);
}
.login-paper {
  width: 360px;
  background:
    repeating-linear-gradient(to bottom, transparent 0, transparent 30px, rgba(231, 220, 198, 0.5) 30px, rgba(231, 220, 198, 0.5) 31px),
    var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 36px 30px 26px;
  box-shadow: 0 8px 30px rgba(140, 116, 80, 0.15);
  text-align: center;
}
.boat-mark { margin-bottom: 6px; }
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
.footer a { color: var(--accent); text-decoration: none; }
</style>
