<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">写一封信</span>
    </div>

    <!-- 信纸 -->
    <div class="letter-paper">
      <div class="paper-row">
        <span class="paper-label">寄给</span>
        <el-select v-model="form.receiverId" placeholder="选择一位好友" filterable size="default"
                   style="flex: 1" :teleported="false">
          <el-option v-for="f in friends" :key="f.friendId" :label="f.friendName" :value="f.friendId" />
        </el-select>
      </div>
      <div class="paper-row">
        <span class="paper-label">题目</span>
        <el-input v-model="form.title" placeholder="这封信想说什么" borderless
                  class="title-input" maxlength="50" />
      </div>
      <el-input
        v-model="form.content"
        type="textarea"
        :rows="9"
        resize="none"
        placeholder="见字如面……"
        class="paper-textarea content-input"
      />

      <!-- 邮票角 -->
      <div class="stamp-corner">
        <div class="stamp-box" :class="{ empty: !form.stampId }">
          <template v-if="selectedStamp">{{ selectedStamp.stampName }}</template>
          <template v-else>贴邮票</template>
        </div>
      </div>
    </div>

    <!-- 选邮票 -->
    <div v-if="myStamps.length" class="pick-block">
      <div class="pick-title">我的邮票 <span class="pick-sub">点选即贴上</span></div>
      <div class="chip-row">
        <span v-for="s in myStamps" :key="s.stampId" class="chip"
              :class="{ on: form.stampId === s.stampId }" @click="toggleStamp(s)">
          {{ s.stampName }} ×{{ s.count }}
        </span>
      </div>
    </div>

    <!-- 选信封 -->
    <div v-if="myEnvelopes.length" class="pick-block">
      <div class="pick-title">我的信封</div>
      <div class="chip-row">
        <span v-for="e in myEnvelopes" :key="e.envelopeId" class="chip"
              :class="{ on: form.envelopeId === e.envelopeId }" @click="toggleEnvelope(e)">
          {{ e.envelopeName }} ×{{ e.count }}
        </span>
      </div>
    </div>

    <!-- 操作 -->
    <div class="action-row">
      <el-button round size="large" @click="send('draft')">存为草稿</el-button>
      <el-button round size="large" type="primary" @click="send('send')">折入信封 · 寄出</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { letterApi, friendApi, stampApi, envelopeApi } from '@/api'

const route = useRoute()
const router = useRouter()
const friends = ref([])
const myStamps = ref([])
const myEnvelopes = ref([])

const form = reactive({
  receiverId: null,
  title: '',
  content: '',
  stampId: null,
  envelopeId: null,
  action: 'send'
})

const selectedStamp = computed(() => myStamps.value.find(s => s.stampId === form.stampId))

const toggleStamp = (s) => {
  form.stampId = form.stampId === s.stampId ? null : s.stampId
}
const toggleEnvelope = (e) => {
  form.envelopeId = form.envelopeId === e.envelopeId ? null : e.envelopeId
}

const send = async (action) => {
  if (!form.receiverId) { ElMessage.warning('请选择收件人'); return }
  if (!form.title.trim()) { ElMessage.warning('请填写标题'); return }
  form.action = action
  await letterApi.write(form)
  ElMessage.success(action === 'send' ? '纸船已出发 ⛵' : '已存为草稿')
  router.push('/letters')
}

onMounted(async () => {
  try { const r = await friendApi.list(); friends.value = r.data || [] } catch {}
  try { const r = await stampApi.mine(); myStamps.value = r.data || [] } catch {}
  try { const r = await envelopeApi.mine(); myEnvelopes.value = r.data || [] } catch {}
  if (route.query.receiverId) form.receiverId = Number(route.query.receiverId)
})
</script>

<style scoped>
.head-row { padding: 4px 0 12px; }
.letter-paper {
  background:
    repeating-linear-gradient(to bottom, transparent 0, transparent 31px, var(--line) 31px, var(--line) 32px),
    var(--paper-card);
  background-attachment: local;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 16px 60px;
  position: relative;
  box-shadow: 0 2px 10px rgba(140, 116, 80, 0.08);
}
.paper-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.paper-label {
  font-family: var(--serif);
  color: var(--ink-faint);
  font-size: 14px;
  flex-shrink: 0;
}
.title-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none !important;
  padding-left: 0;
}
.title-input :deep(.el-input__inner) {
  font-family: var(--serif);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}
.content-input { margin-top: 4px; }
.content-input :deep(.el-textarea__inner) {
  background: transparent !important;
  box-shadow: none !important;
  padding-left: 0;
}
.stamp-corner {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 56px;
  height: 64px;
}
.stamp-box {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(45deg, var(--accent-soft) 0 4px, #fdf4ee 4px 8px);
  border: 1px dashed #d9a79f;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: var(--serif);
  font-size: 11px;
  color: var(--accent);
  padding: 4px;
  word-break: break-all;
}
.stamp-box.empty { color: #d9a79f; }

.pick-block { margin-top: 16px; }
.pick-title { font-size: 13px; color: var(--ink-soft); font-weight: 600; margin-bottom: 8px; }
.pick-sub { color: var(--ink-faint); font-weight: normal; font-size: 11px; }

.action-row {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 24px;
}
</style>
