<template>
  <div>
    <!-- 问候 -->
    <div class="greet">
      <template v-if="!isGuest">
        <div class="greet-main">{{ greeting }}，{{ userStore.realName || userStore.username || '朋友' }}</div>
        <div class="greet-poem">纸上得来终觉浅，愿有纸船替你传。</div>
      </template>
      <template v-else>
        <div class="greet-main">欢迎来到传信纸船</div>
        <div class="greet-poem">把心事折成纸船，寄给在乎的人。游客可先逛逛广场，登录后开始你的故事。</div>
      </template>
    </div>

    <!-- 入口 -->
    <div class="entry-grid">
      <template v-if="!isGuest">
        <div class="entry" @click="$router.push('/letters')">
          <span class="entry-icon">📬</span><span>未读信件</span>
          <span v-if="unreadLetters" class="entry-badge">{{ unreadLetters }}</span>
        </div>
        <div class="entry" @click="$router.push('/letters/write')">
          <span class="entry-icon">✉️</span><span>写信</span>
        </div>
        <div class="entry" @click="$router.push('/diary/write')">
          <span class="entry-icon">📖</span><span>日记</span>
        </div>
        <div class="entry" @click="$router.push('/thoughts')">
          <span class="entry-icon">🍃</span><span>随记</span>
        </div>
        <div class="entry" @click="$router.push('/notes')">
          <span class="entry-icon">📎</span><span>话题</span>
        </div>
      </template>
      <template v-else>
        <div class="entry" @click="$router.push('/thoughts')">
          <span class="entry-icon">🍃</span><span>随记广场</span>
        </div>
        <div class="entry" @click="$router.push('/notes')">
          <span class="entry-icon">📎</span><span>话题广场</span>
        </div>
        <div class="entry entry-cta" @click="$router.push('/login')">
          <span class="entry-icon">⛵</span><span>登船 / 注册</span>
        </div>
      </template>
    </div>

    <!-- 游客提示 -->
    <div v-if="isGuest" class="guest-tip paper-card">
      你正在以游客身份浏览，可查看广场上的公开随记与话题。写信、日记等私人岛屿需要
      <span class="guest-login" @click="$router.push('/login')">登录</span>
      后才能抵达。
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { letterApi } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const unreadLetters = ref(0)

const isGuest = computed(() => !userStore.token)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '清晨好'
  if (h < 14) return '午安'
  if (h < 19) return '下午好'
  return '晚上好'
})

onMounted(async () => {
  if (isGuest.value) return
  try {
    const r = await letterApi.inbox({ page: 1, limit: 100 })
    unreadLetters.value = (r.data.items || []).filter(x => x.status === 1).length
  } catch {}
})
</script>

<style scoped>
.greet { padding: 10px 4px 16px; }
.greet-main { font-family: var(--serif); font-size: 22px; font-weight: 700; color: var(--ink); }
.greet-poem { font-family: var(--serif); font-size: 12px; color: var(--ink-faint); margin-top: 6px; letter-spacing: 1px; }

.entry-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  max-width: 640px;
}
.entry {
  position: relative;
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-soft);
  cursor: pointer;
  transition: transform .1s;
}
.entry:active { transform: scale(0.95); }
.entry-icon { font-size: 26px; }
.entry-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  line-height: 20px;
  text-align: center;
}
.entry-cta { border: 1px dashed var(--soft-border); }

.guest-tip {
  margin-top: 20px;
  padding: 14px 16px;
  font-family: var(--serif);
  font-size: 13px;
  color: var(--ink-soft);
  line-height: 1.8;
  max-width: 640px;
}
.guest-login { color: var(--accent); cursor: pointer; border-bottom: 1px dashed var(--accent); }
</style>
