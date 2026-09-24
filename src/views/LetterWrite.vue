<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">写一封信</span>
    </div>

    <!-- 信纸 -->
    <div class="letter-paper">
      <div class="paper-row">
        <span class="paper-label">寄给</span>
        <div class="seg receiver-seg">
          <button type="button" class="seg-item" :class="{ on: receiverType === 'friend' }" @click="receiverType = 'friend'">好友</button>
          <button type="button" class="seg-item" :class="{ on: receiverType === 'no' }" @click="receiverType = 'no'">编号</button>
          <button type="button" class="seg-item" :class="{ on: receiverType === 'random' }" @click="receiverType = 'random'">随机</button>
        </div>
        <el-select v-if="receiverType === 'friend'" v-model="form.receiverId" placeholder="选择一位好友" filterable
                   size="default" clearable style="flex: 1" :teleported="false">
          <el-option v-for="f in friends" :key="f.friendId" :label="f.friendName" :value="f.friendId" />
        </el-select>
        <el-input v-else-if="receiverType === 'no'" v-model.trim="form.receiverNo"
                  maxlength="6" placeholder="输入对方6位编号" style="flex: 1" clearable />
        <span v-else class="random-hint">系统将随机挑选一位有缘人寄出</span>
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
        <div class="stamp-box" :class="{ empty: !form.stampId }" title="点击贴邮票" @click="stampDialog = true">
          <template v-if="selectedStamp">{{ selectedStamp.stampName }}</template>
          <template v-else>贴邮票 +</template>
        </div>
        <div v-if="selectedStamp" class="stamp-days">约{{ selectedStamp.deliveryDays || 3 }}天达</div>
      </div>
    </div>

    <!-- 选信封 -->
    <div v-if="myEnvelopes.length" class="pick-block">
      <div class="pick-title">我的信封</div>
      <div class="chip-row">
        <span v-for="e in myEnvelopes" :key="e.envelopeId" class="chip"
              :class="{ on: form.envelopeId === e.envelopeId }" @click="toggleEnvelope(e)">
          {{ e.envelopeName }} ×{{ e.available }}
        </span>
      </div>
    </div>

    <!-- 操作 -->
    <div class="action-row">
      <el-button round size="large" @click="send('draft')">存为草稿</el-button>
      <el-button round size="large" type="primary" @click="send('send')">折入信封 · 寄出</el-button>
    </div>

    <!-- 贴邮票弹窗：选择可用邮票(寄出必须贴邮票) -->
    <el-dialog v-model="stampDialog" title="选择邮票" width="92%" style="max-width: 520px">
      <div v-if="availableStamps.length" class="stamp-grid">
        <div v-for="s in availableStamps" :key="s.stampId" class="stamp-option"
             :class="{ on: form.stampId === s.stampId }" @click="pickStamp(s)">
          <div class="stamp-option-icon">✉</div>
          <div class="stamp-option-name">{{ s.stampName }}</div>
          <div class="stamp-option-meta">{{ s.stampTheme || '经典' }} · 余 {{ s.available }}</div>
          <div class="stamp-option-meta">约 {{ s.deliveryDays || 3 }} 天送达</div>
        </div>
      </div>
      <div v-else class="empty-poem">没有可用邮票，去集市购买吧。</div>
      <template #footer>
        <el-button round type="primary" @click="stampDialog = false">确定</el-button>
      </template>
    </el-dialog>
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
  receiverNo: '',
  title: '',
  content: '',
  stampId: null,
  envelopeId: null,
  action: 'send'
})

// 收件方式: friend=好友 no=唯一编号 random=随机
const receiverType = ref('friend')
// 贴邮票弹窗
const stampDialog = ref(false)

const selectedStamp = computed(() => myStamps.value.find(s => s.stampId === form.stampId))
// 可用邮票(可用数量>0，已用完的模板不再出现)
const availableStamps = computed(() => myStamps.value.filter(s => (s.available || 0) > 0))

const pickStamp = (s) => {
  form.stampId = form.stampId === s.stampId ? null : s.stampId
}
const toggleEnvelope = (e) => {
  form.envelopeId = form.envelopeId === e.envelopeId ? null : e.envelopeId
}

const send = async (action) => {
  // 随机模式无需选择收件人；草稿也不要求
  if (action === 'send' && receiverType.value === 'friend' && !form.receiverId) {
    ElMessage.warning('请选择收件人')
    return
  }
  if (action === 'send' && receiverType.value === 'no' && !form.receiverNo) {
    ElMessage.warning('请输入对方6位编号')
    return
  }
  // 寄出必须贴邮票(标题可不填)
  if (action === 'send' && !form.stampId) {
    ElMessage.warning('请先贴上一枚邮票')
    stampDialog.value = true
    return
  }
  const payload = { ...form }
  if (receiverType.value === 'no') {
    // 按唯一编号寄信
    payload.receiverNo = form.receiverNo
    payload.receiverId = null
  }
  if (receiverType.value === 'random') {
    payload.receiverId = null
    payload.random = true
  }
  form.action = action
  await letterApi.write(payload)
  ElMessage.success(action === 'send' ? '纸船已出发 ⛵' : '已存为草稿')
  router.push('/letters')
}

onMounted(async () => {
  try { const r = await friendApi.list(); friends.value = r.data || [] } catch {}
  try { const r = await stampApi.mine(); myStamps.value = r.data || [] } catch {}
  try { const r = await envelopeApi.mine(); myEnvelopes.value = (r.data || []).filter(e => (e.available || 0) > 0) } catch {}
  if (route.query.receiverId) form.receiverId = Number(route.query.receiverId)
})
</script>

<style scoped>
.head-row { padding: 4px 0 12px; }
.letter-paper {
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 16px 60px;
  position: relative;
  box-shadow: 0 2px 10px rgba(140, 116, 80, 0.08);
}
.paper-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-right: 72px; }
.receiver-seg { flex-shrink: 0; }
.random-hint {
  font-family: var(--serif);
  font-size: 13px;
  color: var(--ink-faint);
  letter-spacing: 1px;
}
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
  background: repeating-linear-gradient(45deg, var(--accent-soft) 0 4px, var(--paper-warm) 4px 8px);
  border: 1px dashed var(--soft-border);
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
.stamp-box.empty { color: var(--ink-faint); }
.stamp-box { cursor: pointer; }
.stamp-box:hover { filter: brightness(0.98); }
.stamp-days {
  margin-top: 4px;
  text-align: center;
  font-size: 10px;
  color: var(--ink-faint);
  white-space: nowrap;
}

.stamp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.stamp-option {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;
  cursor: pointer;
  background: var(--paper-card);
}
.stamp-option.on {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.stamp-option-icon { font-size: 22px; margin-bottom: 4px; }
.stamp-option-name { font-size: 13px; font-weight: 600; color: var(--ink); }
.stamp-option-meta { font-size: 11px; color: var(--ink-faint); margin-top: 2px; }

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
