<template>
  <div class="register-container">
    <div class="register-paper">
      <div class="boat-mark">
        <svg viewBox="0 0 24 24" width="34" height="34">
          <path d="M3 15c3 2 15 2 18 0l-2.5 4.5c-.4.8-1.2 1.2-2 1.2h-9c-.8 0-1.6-.4-2-1.2L3 15z" fill="#b3574d"/>
          <path d="M12 3l4 10H8L12 3z" fill="#b98a3e"/>
        </svg>
      </div>
      <h2 class="title">加入传信纸船</h2>
      <p class="poetic-sub">从此，多了一个等你来信的人</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="3-30位字符" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="6-50位字符" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input v-model="form.confirm" type="password" placeholder="再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="昵称(可选)">
          <el-input v-model="form.nickname" placeholder="不填则使用用户名" />
        </el-form-item>
        <el-form-item label="邮箱(可选)">
          <el-input v-model="form.email" placeholder="可选" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width:100%" size="large" @click="handleRegister">注 册</el-button>
        </el-form-item>
        <div class="footer">已有账号？<router-link to="/login">去登录</router-link></div>
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
  password: '',
  confirm: '',
  nickname: '',
  email: ''
})

const validatePass = (rule, value, callback) => {
  if (value !== form.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '长度在3-30之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '长度在6-50之间', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.register({
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        email: form.email
      })
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } catch (e) {
      // 拦截器已弹错
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper-bg);
}
.register-paper {
  width: 380px;
  background:
    repeating-linear-gradient(to bottom, transparent 0, transparent 30px, rgba(231, 220, 198, 0.5) 30px, rgba(231, 220, 198, 0.5) 31px),
    var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 32px 30px 24px;
  box-shadow: 0 8px 30px rgba(140, 116, 80, 0.15);
  text-align: center;
}
.boat-mark { margin-bottom: 6px; }
.title {
  font-family: var(--serif);
  text-align: center;
  margin: 0 0 4px;
  color: var(--ink);
  letter-spacing: 2px;
}
.poetic-sub { text-align: center; margin: 0 0 18px; }
:deep(.el-form-item__label) { color: var(--ink-soft); }
:deep(.el-input__wrapper) { border-radius: 10px; box-shadow: 0 0 0 1px var(--line) inset; }
.footer { text-align: center; font-size: 13px; color: var(--ink-faint); margin-top: 4px; }
.footer a { color: var(--accent); text-decoration: none; }
</style>
