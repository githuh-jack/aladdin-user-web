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
        <div class="greet-poem">把心事折成纸船，寄给在乎的人。先逛逛广场，登录后开始你的故事。</div>
      </template>
    </div>

    <!-- 未读信件提示 -->
    <div v-if="!isGuest && unreadLetters > 0" class="unread-banner" @click="$router.push('/letters')">
      📬 你有 {{ unreadLetters }} 封未读信件，点击查看
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

    <!-- 信件广场(游客与登录用户均可浏览) -->
    <div class="sq-block">
      <div class="sq-head">
        <span class="sq-title">⛵ 信件广场</span>
      </div>

      <!-- 最近写信的旅人(仅头像与昵称) -->
      <div v-if="writers.length" class="writer-grid">
        <div v-for="w in writers" :key="w.userId || w.user_id" class="writer">
          <img v-if="w.avatarUrl || w.avatar_url" class="writer-avatar" :src="w.avatarUrl || w.avatar_url" alt="头像" />
          <span v-else class="writer-avatar writer-avatar-fallback">{{ (w.senderName || w.sender_name || '客').slice(0, 1) }}</span>
          <span class="writer-name">{{ w.senderName || w.sender_name || '匿名旅人' }}</span>
        </div>
      </div>

      <!-- 设置公开的信件 · 最新20条 -->
      <div v-loading="loading" class="pub-list">
        <div v-for="l in publicLetters" :key="l.id" class="pub-letter paper-card" @click="viewLetter(l)">
          <div class="pub-head">
            <img v-if="l.avatarUrl" class="pub-avatar" :src="l.avatarUrl" alt="头像" />
            <span v-else class="pub-avatar pub-avatar-fallback">{{ (l.senderName || '客').slice(0, 1) }}</span>
            <span class="pub-name">{{ l.senderName || '匿名旅人' }}</span>
            <span class="pub-time">{{ l.sendTime || '' }}</span>
          </div>
          <div v-if="l.title" class="pub-title">{{ l.title }}</div>
          <div class="pub-content">{{ l.content }}</div>
        </div>
        <div v-if="!loading && !publicLetters.length" class="sq-empty">还没有公开的信笺漂到这里</div>
      </div>
    </div>

    <!-- 公开信件详情(直接用列表数据，游客也可看) -->
    <el-dialog v-model="letterDialog" width="92%" style="max-width: 560px">
      <template #header>
        <div class="pub-detail-head">
          <span class="pub-detail-name">{{ currentLetter?.senderName || '匿名旅人' }}</span>
          <span class="pub-detail-time">{{ currentLetter?.sendTime || '' }}</span>
        </div>
      </template>
      <div class="pub-detail-content">{{ currentLetter?.content }}</div>
      <template #footer>
        <el-button round @click="letterDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 公告弹窗(登录后可见，可勾选不再提示) -->
    <el-dialog v-model="showNotice" title="📣 船长公告" width="92%" style="max-width: 560px">
      <div v-for="n in notices" :key="n.id" class="notice-item">
        <div class="notice-title">{{ n.title }}</div>
        <div class="notice-time">{{ n.sys001 }}</div>
        <div class="notice-content">{{ n.content }}</div>
      </div>
      <template #footer>
        <div class="notice-foot">
          <el-checkbox v-model="neverRemind">不再提示</el-checkbox>
          <el-button round type="primary" @click="closeNotice">我知道了</el-button>
        </div>
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
// 信件广场：设置公开的信件(最新20条)
const publicLetters = ref([])
const loading = ref(false)
// 公开信件详情
const letterDialog = ref(false)
const currentLetter = ref(null)
// 公告(登录后弹窗)
const showNotice = ref(false)
const notices = ref([])
const neverRemind = ref(false)

const NOTICE_KEY = 'paperboat_notice_dismissed_id'

const isGuest = computed(() => !userStore.token)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '清晨好'
  if (h < 14) return '午安'
  if (h < 19) return '下午好'
  return '晚上好'
})

const viewLetter = (l) => {
  currentLetter.value = l
  letterDialog.value = true
}

// 勾选"不再提示"后，记住最新公告id；有新公告仍会弹出
const closeNotice = () => {
  if (neverRemind.value && notices.value.length) {
    try { localStorage.setItem(NOTICE_KEY, String(notices.value[0].id)) } catch {}
  }
  showNotice.value = false
}

onMounted(async () => {
  try {
    const r = await letterApi.publicWriters()
    writers.value = r.data || []
  } catch {}
  try {
    loading.value = true
    const r = await letterApi.publicLetters()
    publicLetters.value = r.data || []
  } catch {} finally { loading.value = false }

  if (isGuest.value) return
  try {
    const r = await letterApi.inbox({ page: 1, limit: 100 })
    unreadLetters.value = (r.data.items || []).filter(x => x.status === 1).length
  } catch {}
  // 登录后拉取公告，有则弹窗展示(最新一条已勾选"不再提示"过的除外)
  try {
    const r = await announcementApi.published()
    notices.value = r.data || []
    if (notices.value.length) {
      let dismissed = null
      try { dismissed = localStorage.getItem(NOTICE_KEY) } catch {}
      showNotice.value = dismissed !== String(notices.value[0].id)
    }
  } catch {}
})
</script>

<style scoped>
.greet { padding: 10px 4px 16px; }
.greet-main { font-family: var(--serif); font-size: 22px; font-weight: 700; color: var(--ink); }
.greet-poem { font-family: var(--serif); font-size: 12px; color: var(--ink-faint); margin-top: 6px; letter-spacing: 1px; }

.unread-banner {
  background: var(--accent-soft);
  border: 1px solid var(--soft-border);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--accent);
  cursor: pointer;
  margin-bottom: 14px;
  font-weight: 600;
}

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
  margin-bottom: 16px;
}
.writer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 64px;
}
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
.sq-empty {
  text-align: center;
  font-family: var(--serif);
  font-size: 12px;
  color: var(--ink-faint);
  padding: 18px 0;
  letter-spacing: 1px;
}

/* 公开信件列表 */
.pub-list { display: flex; flex-direction: column; gap: 12px; max-width: 640px; }
.pub-letter {
  padding: 12px 14px;
  cursor: pointer;
  transition: transform .1s;
}
.pub-letter:active { transform: scale(0.99); }
.pub-head { display: flex; align-items: center; gap: 8px; }
.pub-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--soft-border);
  flex-shrink: 0;
}
.pub-avatar-fallback {
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--serif);
  font-size: 13px;
}
.pub-name { font-size: 13px; font-weight: 600; color: var(--ink); }
.pub-time { margin-left: auto; font-size: 11px; color: var(--ink-faint); }
.pub-title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
  margin-top: 8px;
}
.pub-content {
  font-size: 13px;
  color: var(--ink-soft);
  margin-top: 6px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pub-detail-head { display: flex; align-items: baseline; gap: 10px; }
.pub-detail-name { font-family: var(--serif); font-weight: 700; font-size: 16px; color: var(--ink); }
.pub-detail-time { font-size: 11px; color: var(--ink-faint); }
.pub-detail-content {
  font-family: var(--serif);
  font-size: 15px;
  line-height: 28px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--ink);
}

/* 公告弹窗 */
.notice-item { padding: 10px 4px; border-bottom: 1px dashed var(--line); }
.notice-item:last-child { border-bottom: none; }
.notice-title { font-family: var(--serif); font-size: 15px; font-weight: 700; color: var(--ink); }
.notice-time { font-size: 11px; color: var(--ink-faint); margin: 4px 0 6px; }
.notice-content { font-size: 13px; color: var(--ink-soft); line-height: 1.8; white-space: pre-wrap; }
.notice-foot { display: flex; align-items: center; justify-content: space-between; }
</style>
