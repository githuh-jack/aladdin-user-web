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

    <!-- 入口(仅登录用户) -->
    <div v-if="!isGuest" class="entry-grid">
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
      <div class="entry" @click="$router.push('/notes')">
        <span class="entry-icon">📎</span><span>话题</span>
      </div>
    </div>

    <!-- 游客：信件广场(仅展示写信人头像) -->
    <template v-if="isGuest">
      <div class="sq-block">
        <div class="sq-head">
          <span class="sq-title">⛵ 信件广场</span>
        </div>
        <div v-if="writers.length" class="writer-grid">
          <div v-for="w in writers" :key="w.user_id" class="writer" @click="$router.push('/login')">
            <img v-if="w.avatar_url" class="writer-avatar" :src="w.avatar_url" alt="头像" />
            <span v-else class="writer-avatar writer-avatar-fallback">{{ (w.sender_name || '客').slice(0, 1) }}</span>
            <span class="writer-name">{{ w.sender_name || '匿名旅人' }}</span>
          </div>
        </div>
        <div v-else class="sq-empty">还没有人寄出纸船，成为第一个吧</div>
        <div class="writer-hint">最近在这里写信的旅人。游客只能看看，写信需要
          <span class="guest-login" @click="$router.push('/login')">登录</span>
        </div>
      </div>
    </template>

    <!-- 公告弹窗(登录后可见) -->
    <el-dialog v-model="showNotice" title="📣 船长公告" width="92%" style="max-width: 560px">
      <div v-for="n in notices" :key="n.id" class="notice-item">
        <div class="notice-title">{{ n.title }}</div>
        <div class="notice-time">{{ n.sys001 }}</div>
        <div class="notice-content">{{ n.content }}</div>
      </div>
      <template #footer>
        <el-button round type="primary" @click="showNotice = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { letterApi, announcementApi } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const unreadLetters = ref(0)
// 信件广场：最近写信人(仅头像与昵称)
const writers = ref([])
// 公告(登录后弹窗)
const showNotice = ref(false)
const notices = ref([])

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
  if (isGuest.value) {
    try {
      const r = await letterApi.publicWriters()
      writers.value = r.data || []
    } catch {}
    return
  }
  try {
    const r = await letterApi.inbox({ page: 1, limit: 100 })
    unreadLetters.value = (r.data.items || []).filter(x => x.status === 1).length
  } catch {}
  // 登录后拉取公告，有则弹窗展示
  try {
    const r = await announcementApi.published()
    notices.value = r.data || []
    if (notices.value.length) showNotice.value = true
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

.sq-block { margin-top: 22px; }
.sq-head {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.sq-title { font-family: var(--serif); font-size: 16px; font-weight: 700; color: var(--ink); }
.writer-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.writer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 64px;
  cursor: pointer;
}
.writer:active { transform: scale(0.95); }
.writer-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--soft-border);
}
.writer-avatar-fallback {
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--serif);
  font-size: 20px;
}
.writer-name {
  font-size: 11px;
  color: var(--ink-soft);
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.writer-hint {
  margin-top: 14px;
  font-family: var(--serif);
  font-size: 12px;
  color: var(--ink-faint);
  line-height: 1.8;
}
.guest-login { color: var(--accent); cursor: pointer; border-bottom: 1px dashed var(--accent); }
.sq-empty {
  text-align: center;
  font-family: var(--serif);
  font-size: 12px;
  color: var(--ink-faint);
  padding: 18px 0;
  letter-spacing: 1px;
}

/* 公告弹窗 */
.notice-item { padding: 10px 4px; border-bottom: 1px dashed var(--line); }
.notice-item:last-child { border-bottom: none; }
.notice-title { font-family: var(--serif); font-size: 15px; font-weight: 700; color: var(--ink); }
.notice-time { font-size: 11px; color: var(--ink-faint); margin: 4px 0 6px; }
.notice-content { font-size: 13px; color: var(--ink-soft); line-height: 1.8; white-space: pre-wrap; }
</style>
