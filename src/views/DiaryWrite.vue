<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">{{ isEdit ? '改一页日记' : '写一篇日记' }}</span>
    </div>

    <!-- 日记纸 -->
    <div class="diary-paper">
      <el-input v-model="form.title" placeholder="这一页的标题" borderless
                class="title-input" maxlength="50" />
      <el-input
        v-model="form.content"
        type="textarea"
        :rows="11"
        resize="none"
        placeholder="今天……"
        class="content-input"
      />

      <!-- 角落邮戳 -->
      <div class="postmark" :class="{ empty: !form.mood && !form.weather }">
        <span v-if="form.mood || form.weather">{{ moodEmoji }} {{ weatherEmoji }}</span>
        <span v-else>心情·天气</span>
      </div>
    </div>

    <!-- 心情 -->
    <div class="pick-block">
      <div class="pick-title">今天的心情</div>
      <div class="chip-row">
        <span v-for="m in moods" :key="m.text" class="chip"
              :class="{ on: form.mood === m.text }" @click="form.mood = form.mood === m.text ? '' : m.text">
          {{ m.emoji }} {{ m.text }}
        </span>
      </div>
    </div>

    <!-- 天气 -->
    <div class="pick-block">
      <div class="pick-title">今天的天气</div>
      <div class="chip-row">
        <span v-for="w in weathers" :key="w.text" class="chip"
              :class="{ on: form.weather === w.text }" @click="form.weather = form.weather === w.text ? '' : w.text">
          {{ w.emoji }} {{ w.text }}
        </span>
      </div>
    </div>

    <!-- 可见性 -->
    <div class="pick-block meta-row">
      <div>
        <div class="pick-title">可见性</div>
        <el-switch v-model="form.isPublic" :active-value="1" :inactive-value="0"
                   active-text="公开" inactive-text="私密" />
      </div>
    </div>

    <!-- 操作 -->
    <div class="action-row">
      <el-button round size="large" @click="$router.back()">取消</el-button>
      <el-button round size="large" type="primary" @click="save">{{ isEdit ? '保存修改' : '收好这一页' }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { diaryApi } from '@/api'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.query.id)
const saving = ref(false)

const moods = [
  { emoji: '😊', text: '开心' }, { emoji: '😌', text: '平静' }, { emoji: '🥀', text: '低落' },
  { emoji: '😢', text: '难过' }, { emoji: '🤩', text: '兴奋' }, { emoji: '😮‍💨', text: '疲惫' }
]
const weathers = [
  { emoji: '☀️', text: '晴' }, { emoji: '☁️', text: '阴' }, { emoji: '🌧️', text: '雨' },
  { emoji: '❄️', text: '雪' }, { emoji: '🌬️', text: '风' }, { emoji: '⛈️', text: '雷' }
]
const moodEmoji = computed(() => (moods.find(m => m.text === form.mood) || { emoji: '' }).emoji)
const weatherEmoji = computed(() => (weathers.find(w => w.text === form.weather) || { emoji: '' }).emoji)

// 本地当天日期(避免 toISOString 的 UTC 偏移)
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const form = reactive({
  title: '',
  content: '',
  mood: '',
  weather: '',
  writeDate: today(),
  isPublic: 0
})

const save = async () => {
  if (!form.title.trim()) { ElMessage.warning('给这一页起个标题吧'); return }
  saving.value = true
  try {
    if (isEdit.value) {
      await diaryApi.update({ id: route.query.id, ...form })
      ElMessage.success('这一页已改好')
    } else {
      // 日期不需要选择：新日记自动记为当天
      await diaryApi.save({ ...form, writeDate: today() })
      ElMessage.success('已收好这一页')
    }
    router.push('/diary')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  // 编辑模式：从我的日记里取出这一页
  if (route.query.id) {
    try {
      const r = await diaryApi.list({ page: 1, limit: 100 })
      const d = (r.data || []).find(x => String(x.id) === String(route.query.id))
      if (d) {
        form.title = d.title || ''
        form.content = d.content || ''
        form.mood = d.mood || ''
        form.weather = d.weather || ''
        form.writeDate = (d.writeDate || '').slice(0, 10)
        form.isPublic = d.isPublic ?? 0
      }
    } catch (e) { /* ignore */ }
  }
})
</script>

<style scoped>
.head-row { padding: 4px 0 12px; }
.diary-paper {
  background:
    repeating-linear-gradient(to bottom, transparent 0, transparent 31px, var(--line) 31px, var(--line) 32px),
    var(--paper-card);
  background-attachment: local;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 16px 64px;
  position: relative;
  box-shadow: 0 2px 10px rgba(140, 116, 80, 0.08);
}
.title-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none !important;
  padding-left: 0;
}
.title-input :deep(.el-input__inner) {
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 600;
  color: var(--ink);
}
.content-input { margin-top: 6px; }
.content-input :deep(.el-textarea__inner) {
  background: transparent !important;
  box-shadow: none !important;
  padding-left: 0;
  font-family: var(--serif);
  font-size: 15px;
  line-height: 32px;
  color: var(--ink);
}
.postmark {
  position: absolute;
  top: 14px;
  right: 14px;
  min-width: 64px;
  height: 56px;
  padding: 0 8px;
  background: var(--paper-card);
  border: 1px dashed #b9a988;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transform: rotate(4deg);
}
.postmark.empty { color: #c3b391; font-size: 11px; font-family: var(--serif); }

.pick-block { margin-top: 16px; }
.pick-title { font-size: 13px; color: var(--ink-soft); font-weight: 600; margin-bottom: 8px; }
.meta-row { display: flex; gap: 48px; align-items: flex-end; }

.action-row {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 24px;
}
</style>
