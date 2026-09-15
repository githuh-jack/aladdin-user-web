<template>
  <div>
    <!-- 问候 -->
    <div class="greet">
      <div class="greet-main">{{ greeting }}，{{ userStore.realName || userStore.username || '朋友' }}</div>
      <div class="greet-poem">纸上得来终觉浅，愿有纸船替你传。</div>
    </div>

    <!-- 数据小签 -->
    <div class="stats-row">
      <div class="stat-chip" @click="$router.push('/profile')">
        <span class="stat-num">{{ coinBalance }}</span>
        <span class="stat-label">铜钱</span>
      </div>
      <div class="stat-chip" @click="$router.push('/friends')">
        <span class="stat-num">{{ friendCount }}</span>
        <span class="stat-label">好友</span>
      </div>
      <div class="stat-chip" @click="$router.push('/letters')">
        <span class="stat-num">{{ unreadLetters }}</span>
        <span class="stat-label">未读</span>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="entry-grid">
      <div class="entry" @click="$router.push('/letters/write')">
        <span class="entry-icon">✉️</span><span>写信</span>
      </div>
      <div class="entry" @click="$router.push('/diary')">
        <span class="entry-icon">📖</span><span>日记</span>
      </div>
      <div class="entry" @click="$router.push('/thoughts')">
        <span class="entry-icon">🍃</span><span>感想</span>
      </div>
      <div class="entry" @click="$router.push('/notes')">
        <span class="entry-icon">📎</span><span>其他</span>
      </div>
      <div class="entry" @click="$router.push('/friends')">
        <span class="entry-icon">🤝</span><span>好友</span>
      </div>
      <div class="entry" @click="$router.push('/shop')">
        <span class="entry-icon">🛒</span><span>商店</span>
      </div>
    </div>

    <!-- 公开日记 -->
    <div class="block-head">
      <span class="poetic-title" style="font-size: 16px">纸上广场</span>
      <span class="poetic-sub">来自陌生人的日记</span>
    </div>
    <div class="diary-grid">
      <div v-for="d in publicDiaries" :key="d.id" class="paper-card diary-item">
        <div class="diary-title">{{ d.title || '(无标题)' }}</div>
        <div class="diary-preview">{{ (d.content || '').slice(0, 60) }}</div>
        <div class="diary-meta">{{ d.userName }} · {{ formatDate(d.writeDate) }}</div>
      </div>
    </div>
    <div v-if="!publicDiaries.length" class="empty-poem">广场还很安静，去写下第一篇吧。</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { coinApi, friendApi, letterApi, diaryApi } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const coinBalance = ref(0)
const friendCount = ref(0)
const unreadLetters = ref(0)
const publicDiaries = ref([])

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '清晨好'
  if (h < 14) return '午安'
  if (h < 19) return '下午好'
  return '晚上好'
})

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : ''

onMounted(async () => {
  try { const r = await coinApi.balance(); coinBalance.value = r.data.balance } catch {}
  try { const r = await friendApi.list(); friendCount.value = r.data.length } catch {}
  try {
    const r = await letterApi.inbox({ page: 1, limit: 100 })
    unreadLetters.value = (r.data.items || []).filter(x => x.status === 1).length
  } catch {}
  try {
    const r = await diaryApi.publicList({ page: 1, limit: 5 })
    publicDiaries.value = r.data || []
  } catch {}
})
</script>

<style scoped>
.greet { padding: 10px 4px 16px; }
.greet-main { font-family: var(--serif); font-size: 22px; font-weight: 700; color: var(--ink); }
.greet-poem { font-family: var(--serif); font-size: 12px; color: var(--ink-faint); margin-top: 6px; letter-spacing: 1px; }

.stats-row { display: flex; gap: 10px; margin-bottom: 16px; max-width: 560px; }
.stat-chip {
  flex: 1;
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 0;
  text-align: center;
  cursor: pointer;
}
.stat-chip:active { background: var(--paper-deep); }
.stat-num { display: block; font-family: var(--serif); font-size: 20px; font-weight: 700; color: var(--accent); }
.stat-label { font-size: 11px; color: var(--ink-faint); }

.entry-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 22px;
}
.entry {
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 0;
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
.entry-icon { font-size: 24px; }

.block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
.diary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.diary-item { margin-bottom: 0; }
.diary-title { font-family: var(--serif); font-weight: 600; font-size: 15px; }
.diary-preview {
  color: var(--ink-soft);
  font-size: 13px;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.diary-meta { color: var(--ink-faint); font-size: 11px; margin-top: 8px; }
.empty-poem {
  text-align: center;
  font-family: var(--serif);
  color: var(--ink-faint);
  font-size: 13px;
  padding: 30px 0;
  letter-spacing: 1px;
}
</style>
