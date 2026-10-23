<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">写一封信</span>
    </div>

    <!-- 信纸 -->
    <div class="letter-paper" :style="paperStyle">
      <div v-if="selectedPaper" class="paper-mask"></div>
      <div class="paper-inner">
      <div class="paper-row">
        <span class="paper-label">寄给</span>
        <div class="seg receiver-seg">
          <button type="button" class="seg-item" :class="{ on: receiverType === 'friend' }" @click="receiverType = 'friend'">好友</button>
          <button type="button" class="seg-item" :class="{ on: receiverType === 'no' }" @click="receiverType = 'no'">编号</button>
          <button type="button" class="seg-item" :class="{ on: receiverType === 'random' }" @click="receiverType = 'random'">随机</button>
        </div>
        <el-select v-if="receiverType === 'friend'" v-model="form.receiverIds" placeholder="选择好友(可多选群发)" filterable
                   size="default" multiple :multiple-limit="20" collapse-tags collapse-tags-tooltip
                   clearable style="flex: 1" :teleported="false">
          <el-option v-for="f in friends" :key="f.friendId" :label="friendLabel(f)" :value="f.friendId" />
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
        <div v-if="selectedStamp" class="stamp-days">{{ stampDaysText }}</div>
      </div>
      </div>
    </div>

    <!-- 选信纸 -->
    <div v-if="myEnvelopes.length" class="pick-block">
      <div class="pick-title">我的信纸<span class="pick-sub">（选一张作为写信的背景）</span></div>
      <div class="chip-row">
        <span v-for="e in myEnvelopes" :key="e.envelopeId" class="chip"
              :class="{ on: form.envelopeId === e.envelopeId }" @click="toggleEnvelope(e)">
          {{ e.envelopeName }} ×{{ e.available }}
        </span>
      </div>
    </div>

    <!-- 可见性 -->
    <div class="pick-block meta-row">
      <div>
        <div class="pick-title">可见性</div>
        <el-switch v-model="form.isPublic" :active-value="1" :inactive-value="0"
                   active-text="公开" inactive-text="私密" />
        <div class="pick-sub" style="margin-top: 4px">公开的信件会展示在信件广场</div>
      </div>
    </div>

    <!-- 操作 -->
    <div class="action-row">
      <el-button round size="large" @click="send('draft')">存为草稿</el-button>
      <el-button round size="large" type="primary" @click="send('send')">折入信笺 · 寄出</el-button>
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
  receiverIds: [],
  receiverNo: '',
  title: '',
  content: '',
  stampId: null,
  envelopeId: null,
  isPublic: 0,
  action: 'send'
})

// 好友下拉显示备注(有备注优先)，无备注显示昵称
const friendLabel = (f) => (f.remark ? `${f.remark}（${f.friendName}）` : f.friendName)
// 群发人数(决定消耗邮票数量)
const multiCount = computed(() => (receiverType.value === 'friend' ? (form.receiverIds || []).length : 0))
const stampDaysText = computed(() => {
  const d = selectedStamp.value?.deliveryDays || 3
  return multiCount.value > 1 ? `约${d}天达 · 需${multiCount.value}枚邮票` : `约${d}天达`
})

// 收件方式: friend=好友 no=唯一编号 random=随机
const receiverType = ref('friend')
// 贴邮票弹窗
const stampDialog = ref(false)

const selectedStamp = computed(() => myStamps.value.find(s => s.stampId === form.stampId))
// 可用邮票(可用数量>0，已用完的模板不再出现)
const availableStamps = computed(() => myStamps.value.filter(s => (s.available || 0) > 0))
// 选中的信纸(作为写信背景)
const selectedPaper = computed(() => myEnvelopes.value.find(e => e.envelopeId === form.envelopeId))
const paperStyle = computed(() => {
  const url = selectedPaper.value?.envelopeImageUrl
  return url
    ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}
})

const pickStamp = (s) => {
  form.stampId = form.stampId === s.stampId ? null : s.stampId
}
const toggleEnvelope = (e) => {
  form.envelopeId = form.envelopeId === e.envelopeId ? null : e.envelopeId
}

const send = async (action) => {
  // 随机模式无需选择收件人；草稿也不要求
  if (action === 'send' && receiverType.value === 'friend' && !(form.receiverIds || []).length) {
    ElMessage.warning('请选择收件人(可多选)')
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
  // 群发按人数消耗邮票：校验该邮票可用数量是否足够
  if (action === 'send' && multiCount.value > 1 && selectedStamp.value
      && (selectedStamp.value.available || 0) < multiCount.value) {
    ElMessage.warning(`「${selectedStamp.value.stampName}」余 ${selectedStamp.value.available} 枚，不足群发所需的 ${multiCount.value} 枚`)
    stampDialog.value = true
    return
  }
  const payload = { ...form, receiverId: null }
  if (receiverType.value === 'friend') {
    // 多选好友群发：后端按人数逐封寄出并扣减邮票
    payload.receiverIds = form.receiverIds
  }
  if (receiverType.value === 'no') {
    // 按唯一编号寄信
    payload.receiverNo = form.receiverNo
  }
  if (receiverType.value === 'random') {
    payload.random = true
  }
  delete payload.receiverId
  form.action = action
  await letterApi.write(payload)
  ElMessage.success(action === 'send' ? '纸船已出发 ⛵' : '已存为草稿')
  router.push('/letters')
}

onMounted(async () => {
  try { const r = await friendApi.list(); friends.value = r.data || [] } catch {}
  try { const r = await stampApi.mine(); myStamps.value = r.data || [] } catch {}
  try { const r = await envelopeApi.mine(); myEnvelopes.value = (r.data || []).filter(e => (e.available || 0) > 0) } catch {}
  if (route.query.receiverId) form.receiverIds = [Number(route.query.receiverId)]
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
/* 信纸背景图上覆盖一层半透明纸色，保证文字可读 */
.paper-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 253, 246, 0.75);
  pointer-events: none;
}
.paper-inner { position: relative; z-index: 1; }
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
