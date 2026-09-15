<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">日记</span>
      <div class="head-actions">
        <el-button v-if="activeTab === 'mine'" round type="primary" size="small" @click="$router.push('/diary/write')">写日记</el-button>
        <div class="seg">
          <button class="seg-item" :class="{ on: activeTab === 'mine' }" @click="switchTab('mine')">我的</button>
          <button class="seg-item" :class="{ on: activeTab === 'public' }" @click="switchTab('public')">广场</button>
        </div>
      </div>
    </div>

    <!-- 时间线卡片 -->
    <div v-loading="loading" class="timeline">
      <div v-for="d in list" :key="d.id" class="day-card">
        <div class="date-bubble">
          <div class="date-md">{{ fmtMD(d.writeDate) }}</div>
          <div class="date-week">{{ fmtWeek(d.writeDate) }}</div>
        </div>
        <div class="day-body paper-card" @click="viewDetail(d)">
          <div class="day-head">
            <span class="day-emoji">{{ moodEmoji(d.mood) }}</span>
            <span class="day-weather">{{ weatherEmoji(d.weather) }} {{ d.weather || '' }}</span>
            <span v-if="d.isPublic === 1" class="day-public">公开</span>
            <span class="day-actions" v-if="activeTab === 'mine'">
              <el-icon @click.stop="$router.push(`/diary/write?id=${d.id}`)"><EditPen /></el-icon>
              <el-icon @click.stop="remove(d.id)"><Delete /></el-icon>
            </span>
          </div>
          <div class="day-title">{{ d.title || '(无标题)' }}</div>
          <div class="day-preview">{{ (d.content || '').slice(0, 70) }}</div>
        </div>
      </div>
      <div v-if="!loading && !list.length" class="empty-poem">
        {{ activeTab === 'mine' ? '今天还没有留下字迹。' : '广场还很安静。' }}
      </div>
    </div>

    <!-- 查看详情 -->
    <el-dialog v-model="detailVisible" width="92%" style="max-width: 560px" :show-close="true">
      <template #header>
        <div class="detail-head">
          <span class="detail-emoji">{{ moodEmoji(detailRow.mood) }}</span>
          <div>
            <div class="detail-title">{{ detailRow.title || '(无标题)' }}</div>
            <div class="detail-meta">{{ detailRow.userName }} · {{ detailRow.writeDate }} · {{ detailRow.mood }} {{ weatherEmoji(detailRow.weather) }}</div>
          </div>
        </div>
      </template>
      <div class="detail-content">{{ detailRow.content }}</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, EditPen } from '@element-plus/icons-vue'
import { diaryApi } from '@/api'

const activeTab = ref('mine')
const list = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const detailRow = ref({})

const moods = [
  { emoji: '😊', text: '开心' }, { emoji: '😌', text: '平静' }, { emoji: '🥀', text: '低落' },
  { emoji: '😢', text: '难过' }, { emoji: '🤩', text: '兴奋' }, { emoji: '😮‍💨', text: '疲惫' }
]
const weathers = [
  { emoji: '☀️', text: '晴' }, { emoji: '☁️', text: '阴' }, { emoji: '🌧️', text: '雨' },
  { emoji: '❄️', text: '雪' }, { emoji: '🌬️', text: '风' }, { emoji: '⛈️', text: '雷' }
]
const moodEmoji = (t) => (moods.find(m => m.text === t) || { emoji: '🍃' }).emoji
const weatherEmoji = (t) => (weathers.find(w => w.text === t) || { emoji: '' }).emoji

const fmtMD = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getMonth() + 1}.${String(dt.getDate()).padStart(2, '0')}`
}
const fmtWeek = (d) => {
  if (!d) return ''
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(d).getDay()]
}

const load = async () => {
  loading.value = true
  try {
    const r = activeTab.value === 'mine'
      ? await diaryApi.list({ page: 1, limit: 50 })
      : await diaryApi.publicList({ page: 1, limit: 50 })
    list.value = r.data || []
  } finally { loading.value = false }
}

const switchTab = (t) => {
  activeTab.value = t
  load()
}

const remove = async (id) => {
  await ElMessageBox.confirm('撕掉这一页日记？', '提示', { type: 'warning' })
  await diaryApi.remove(id)
  ElMessage.success('已删除')
  load()
}

const viewDetail = (row) => {
  detailRow.value = row
  detailVisible.value = true
}

watch(activeTab, load)
onMounted(load)
</script>

<style scoped>
.head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.head-actions { display: flex; align-items: center; gap: 12px; }

.timeline { display: flex; flex-direction: column; gap: 12px; }
.day-card { display: flex; gap: 12px; align-items: flex-start; }
.date-bubble {
  width: 52px;
  flex-shrink: 0;
  text-align: center;
  background: var(--paper-deep);
  border-radius: 12px;
  padding: 8px 0;
  border: 1px solid var(--line);
}
.date-md { font-family: var(--serif); font-weight: 700; color: var(--ink); font-size: 14px; }
.date-week { font-size: 11px; color: var(--ink-faint); margin-top: 2px; }
.day-body { flex: 1; cursor: pointer; padding: 12px 14px; }
.day-head { display: flex; align-items: center; gap: 8px; }
.day-emoji { font-size: 18px; }
.day-weather { font-size: 12px; color: var(--ink-soft); }
.day-public {
  font-size: 10px;
  color: var(--gold);
  border: 1px solid #e3d2ac;
  border-radius: 999px;
  padding: 1px 8px;
}
.day-actions { margin-left: auto; display: flex; gap: 10px; color: var(--ink-faint); }
.day-actions .el-icon:hover { color: var(--accent); }
.day-title { font-family: var(--serif); font-weight: 600; font-size: 15px; margin-top: 8px; }
.day-preview {
  color: var(--ink-soft);
  font-size: 13px;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dlg-title-input :deep(.el-input__inner) {
  font-family: var(--serif);
  font-size: 16px;
  font-weight: 600;
}
.dlg-label { font-size: 12px; color: var(--ink-faint); margin: 14px 0 8px; }
.dlg-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 13px; color: var(--ink-soft); }

.detail-head { display: flex; align-items: center; gap: 10px; }
.detail-emoji { font-size: 26px; }
.detail-title { font-family: var(--serif); font-weight: 700; font-size: 16px; }
.detail-meta { font-size: 11px; color: var(--ink-faint); margin-top: 2px; }
.detail-content {
  font-family: var(--serif);
  font-size: 15px;
  line-height: 28px;
  white-space: pre-wrap;
  word-break: break-word;
}
.empty-poem {
  text-align: center;
  font-family: var(--serif);
  color: var(--ink-faint);
  font-size: 13px;
  padding: 50px 0;
  letter-spacing: 1px;
}
</style>
