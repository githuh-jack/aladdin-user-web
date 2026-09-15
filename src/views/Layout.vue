<template>
  <div class="app-frame" :class="{ wide: isAdminRoute }">
    <!-- ===== 管理模式(宽屏) ===== -->
    <template v-if="isAdminRoute">
      <header class="admin-topbar">
        <div class="admin-brand" @click="$router.push('/home')">传信纸船 · 业务管理</div>
        <div class="admin-links">
          <router-link v-for="m in adminMenus" :key="m.path" :to="m.path" class="admin-link"
                       :class="{ on: $route.path === m.path }">{{ m.title }}</router-link>
        </div>
      </header>
      <main class="admin-main">
        <router-view />
      </main>
    </template>

    <!-- ===== 用户模式(Web页面布局) ===== -->
    <template v-else>
      <header class="web-nav">
        <div class="nav-inner">
          <div class="nav-brand" @click="go('/home')">
            <svg class="boat" viewBox="0 0 24 24" width="22" height="22">
              <path d="M3 15c3 2 15 2 18 0l-2.5 4.5c-.4.8-1.2 1.2-2 1.2h-9c-.8 0-1.6-.4-2-1.2L3 15z" fill="#b3574d"/>
              <path d="M12 3l4 10H8L12 3z" fill="#b98a3e"/>
            </svg>
            <span class="brand-name">传信纸船</span>
            <span class="brand-sub">把心事折成纸船，寄给在乎的人</span>
          </div>

          <nav class="nav-links">
            <span v-for="n in navMenus" :key="n.path" class="nav-link"
                  :class="{ on: isActive(n.path) }" @click="go(n.path)">{{ n.title }}</span>
          </nav>

          <div class="nav-right">
            <el-button round type="primary" size="small" @click="go('/letters/write')">✎ 写信</el-button>
            <el-dropdown trigger="click" @command="onCommand">
              <div class="avatar">{{ avatarChar }}</div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </header>

      <main class="web-main">
        <router-view />
      </main>

      <footer class="web-footer">传信纸船 · 纸短情长，见字如面</footer>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const avatarChar = computed(() => (userStore.realName || userStore.username || '客').slice(0, 1))

const navMenus = [
  { path: '/home', title: '首页' },
  { path: '/letters', title: '信件' },
  { path: '/diary', title: '日记' },
  { path: '/thoughts', title: '感想' },
  { path: '/notes', title: '其他' },
  { path: '/friends', title: '好友' },
  { path: '/shop', title: '商店' }
]

const adminMenus = [
  { path: '/admin/letters', title: '信件' },
  { path: '/admin/friends', title: '好友' },
  { path: '/admin/diary', title: '日记' },
  { path: '/admin/thoughts', title: '感想' },
  { path: '/admin/notes', title: '笔记' },
  { path: '/admin/stamps', title: '邮票' },
  { path: '/admin/envelopes', title: '信封' },
  { path: '/admin/coin', title: '铜钱' },
  { path: '/admin/orders', title: '订单' }
]

const isActive = (p) => route.path === p || route.path.startsWith(p + '/')
const go = (p) => router.push(p)

const onCommand = (cmd) => {
  if (cmd === 'profile') router.push('/profile')
  else if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

onMounted(async () => {
  if (userStore.token && !userStore.userId) {
    userStore.restoreFromStorage()
    await userStore.fetchUserInfo()
  }
})
</script>

<style scoped>
/* ---------- 页面骨架 ---------- */
.app-frame {
  min-height: 100vh;
  background: var(--paper-bg);
  display: flex;
  flex-direction: column;
}

/* ---------- 顶部导航 ---------- */
.web-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255, 253, 246, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 62px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}
.brand-name {
  font-family: var(--serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 2px;
}
.brand-sub {
  font-family: var(--serif);
  font-size: 11px;
  color: var(--ink-faint);
  letter-spacing: 1px;
  margin-left: 4px;
  padding-left: 12px;
  border-left: 1px solid var(--line);
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.nav-link {
  font-size: 14px;
  color: var(--ink-soft);
  padding: 7px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: all .15s;
  user-select: none;
}
.nav-link:hover { color: var(--accent); background: var(--accent-soft); }
.nav-link.on {
  color: var(--accent);
  background: var(--accent-soft);
  font-weight: 600;
}
.nav-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid #e8cfc7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--serif);
  font-size: 15px;
  cursor: pointer;
}

/* ---------- 内容区 ---------- */
.web-main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 48px;
}

/* ---------- 页脚 ---------- */
.web-footer {
  text-align: center;
  font-family: var(--serif);
  font-size: 12px;
  color: var(--ink-faint);
  letter-spacing: 2px;
  padding: 20px 0 26px;
  border-top: 1px solid var(--line);
}

/* ---------- 管理模式 ---------- */
.admin-topbar {
  background: var(--paper-card);
  border-bottom: 1px solid var(--line);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  position: sticky;
  top: 0;
  z-index: 20;
}
.admin-brand {
  font-family: var(--serif);
  font-weight: 700;
  font-size: 16px;
  color: var(--accent);
  cursor: pointer;
  white-space: nowrap;
}
.admin-links { display: flex; gap: 6px; flex-wrap: wrap; }
.admin-link {
  font-size: 13px;
  color: var(--ink-soft);
  text-decoration: none;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--paper-bg);
}
.admin-link.on { background: var(--accent); color: #fff; border-color: var(--accent); }
.admin-main { flex: 1; padding: 20px 24px; }
</style>
