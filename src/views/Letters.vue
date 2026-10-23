<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">信箱</span>
      <div class="head-actions">
        <el-button round type="primary" size="small" @click="$router.push('/letters/write')">✎ 写信</el-button>
        <div class="seg">
          <button class="seg-item" :class="{ on: activeTab === 'all' }" @click="switchTab('all')">全部</button>
          <button class="seg-item" :class="{ on: activeTab === 'inbox' }" @click="switchTab('inbox')">收到的</button>
          <button class="seg-item" :class="{ on: activeTab === 'sent' }" @click="switchTab('sent')">寄出的</button>
        </div>
      </div>
    </div>

    <!-- 未读提示 -->
    <div v-if="unreadCount > 0" class="unread-banner" @click="switchTab('inbox')">
      📬 你有 {{ unreadCount }} 封未读信件，点击查看
    </div>

    <div v-loading="loading" class="env-grid">
      <div v-for="item in list" :key="item.isSys ? `sys-${item.id}` : item.id" class="envelope"
           :class="item.isSys ? 'env-sys' : (isMineSent(item) ? 'env-sent' : 'env-recv')"
           @click="openItem(item)">
        <div class="env-flap"></div>
        <div class="env-body">
          <div class="env-stamp">
            <span class="env-stamp-inner">{{ item.isSys ? '系' : '邮' }}</span>
          </div>
          <div class="env-main">
            <div class="env-title">
              <i v-if="isUnread(item)" class="unread-dot"></i>
              {{ item.title || '(无标题)' }}
            </div>
            <div class="env-addr">
              <template v-if="item.isSys">
                系统寄给我的
              </template>
              <template v-else-if="isMineSent(item)">
                寄给 {{ item.receiverName || item.receiverAddress || '未指定收件人' }}
              </template>
              <template v-else>
                {{ item.senderName }} 寄给我的
              </template>
              <el-tag v-if="item.isSys" size="small" :type="item.claimed ? 'success' : 'warning'" class="env-tag">
                {{ item.claimed ? '已领取' : '待领取' }}
              </el-tag>
              <el-tag v-else-if="item.status === 0" size="small" type="info" class="env-tag">草稿</el-tag>
              <el-tag v-else-if="inTransit(item)" size="small" type="warning" class="env-tag">送信中</el-tag>
              <el-tag v-else-if="item.status === 4" size="small" type="danger" class="env-tag">{{ returnText(item) }}</el-tag>
              <el-tag v-else-if="isMineSent(item) && item.status === 2" size="small" type="success" class="env-tag">已读</el-tag>
            </div>
            <div class="env-date">
              {{ item.sendTime || '尚未寄出' }}
            </div>
          </div>
          <span v-if="canRefuse(item)" class="env-refuse" @click.stop="refuse(item)">拒收</span>
          <span v-if="canAct(item)" class="env-act" @click.stop="openReport(item)">举报</span>
          <span v-if="canAct(item) && !isFriend(item)" class="env-act" @click.stop="addFriend(item)">{{ appliedSet.has(String(item.senderId)) ? '已申请' : '加好友' }}</span>
          <span v-if="isFriend(item)" class="env-act" @click.stop="openHistory(item)">来往</span>
          <el-icon v-if="!item.isSys" class="env-del" @click.stop="remove(item.id)"><Delete /></el-icon>
        </div>
      </div>
    </div>

    <!-- 系统邮件详情(打开即领取附赠) -->
    <el-dialog v-model="mailDialog" :title="currentMail?.title || '系统邮件'" width="92%" style="max-width: 560px">
      <div class="mail-detail-content">{{ currentMail?.content }}</div>
      <div class="mail-detail-attach">附赠：{{ currentMail ? attachText(currentMail) : '—' }}</div>
      <div v-if="currentMail?.claimTime" class="mail-detail-claimed">已于 {{ currentMail.claimTime }} 领取</div>
      <template #footer>
        <el-button round @click="mailDialog = false">关闭</el-button>
        <el-button v-if="currentMail && !currentMail.claimed" round type="primary" @click="claimMail">领取附赠</el-button>
      </template>
    </el-dialog>

    <!-- 举报信件 -->
    <el-dialog v-model="reportDialog" title="举报这封信" width="92%" style="max-width: 460px">
      <div class="report-cats">
        <span v-for="c in REPORT_CATS" :key="c" class="chip" :class="{ on: reportForm.category === c }"
              @click="reportForm.category = c">{{ c }}</span>
      </div>
      <el-input v-model="reportForm.description" type="textarea" :rows="4" maxlength="200" show-word-limit
                placeholder="补充说明(选填，选择「其他」时必填)" style="margin-top: 12px" />
      <template #footer>
        <el-button round @click="reportDialog = false">取消</el-button>
        <el-button round type="primary" :loading="reporting" @click="submitReport">提交举报</el-button>
      </template>
    </el-dialog>

    <!-- 来往信封(与好友的全部往来信件) -->
    <el-dialog v-model="historyDialog" :title="historyFriendName + ' 的来往信封'" width="94%" style="max-width: 620px">
      <div v-loading="historyLoading">
        <div v-if="historyList.length" class="history-list">
          <div v-for="h in historyList" :key="h.id" class="history-item paper-card" @click="router.push(`/letters/${h.id}`)">
            <div class="history-head">
              <span class="history-dir" :class="{ mine: Number(h.boxRecv) !== 1 }">{{ Number(h.boxRecv) === 1 ? '收' : '寄' }}</span>
              <span class="history-title">{{ h.title || '(无标题)' }}</span>
              <span class="history-time">{{ h.sendTime }}</span>
            </div>
            <div class="history-preview">{{ h.content }}</div>
          </div>
        </div>
        <div v-else class="empty-poem" style="padding: 30px 0">还没有来往信件，写一封吧。</div>
      </div>
      <template #footer>
        <el-button round @click="historyDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    <div v-if="!loading && !list.length" class="empty-poem">
      {{ emptyText }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { letterApi, sysMailApi, friendApi, reportApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('all')
const list = ref([])
const loading = ref(false)
// 系统邮件详情弹窗
const mailDialog = ref(false)
const currentMail = ref(null)

const emptyText = computed(() => {
  if (activeTab.value === 'inbox') return '信箱空空的，去给朋友写一封吧。'
  if (activeTab.value === 'sent') return '还没有寄出过信。'
  return '信箱空空的，去给朋友写一封吧。'
})

// 附赠描述
const attachText = (m) => {
  const parts = []
  if (m.coinAmount > 0) parts.push(`铜钱×${m.coinAmount}`)
  if (m.stampName) parts.push(`邮票「${m.stampName}」`)
  if (m.envelopeName) parts.push(`信封「${m.envelopeName}」`)
  return parts.length ? parts.join('、') : '无'
}

// 是否我寄出的
const isMineSent = (item) => String(item.senderId) === String(userStore.userId)
// 未读：系统邮件未领取 / 我收到的且未读
const isUnread = (item) => {
  if (item.isSys) return !item.claimed
  return !isMineSent(item) && item.status === 1 &&
    (!item.arrivalTime || new Date(item.arrivalTime) <= new Date())
}
// 在途：已寄出且还没到到达时间
const inTransit = (item) =>
  !item.isSys && item.status >= 1 && item.arrivalTime && new Date(item.arrivalTime) > new Date()

// 已退回/退回中文案(含原因)
const returnText = (item) => {
  const arrived = !item.returnTime || new Date(item.returnTime) <= new Date()
  const prefix = arrived ? '已退回' : '退回中'
  return item.returnReason ? `${prefix}·${item.returnReason}` : prefix
}

// 可拒收：我收到的、未读、已到达的普通信件
const canRefuse = (item) =>
  !item.isSys && !isMineSent(item) && item.status === 1 &&
  (!item.arrivalTime || new Date(item.arrivalTime) <= new Date())

// 未读信件数(含未领取的系统邮件)
const unreadCount = computed(() => list.value.filter(i => isUnread(i)).length)

const load = async () => {
  loading.value = true
  try {
    const r = await letterApi.list({ box: activeTab.value, page: 1, limit: 50 })
    let items = (r.data.items || []).map(i => ({ ...i, isSys: false }))
    // 系统邮件并入全部/收到列表(来源标记为系统，点击弹窗查看)
    if (activeTab.value !== 'sent') {
      try {
        const sr = await sysMailApi.list()
        const sysItems = (sr.data || []).map(m => ({
          ...m,
          isSys: true,
          senderName: '系统'
        }))
        items = [...sysItems, ...items]
      } catch {}
    }
    list.value = items
    // 好友集合：用于"加好友/来往"按钮状态
    try {
      const fr = await friendApi.list()
      friendIds.value = new Set((fr.data || []).map(f => String(f.friendId ?? f.userId)))
      // 已申请未通过集合
      const ar = await friendApi.applies()
      appliedSet.value = new Set((ar.data || [])
        .filter(a => Number(a.status) === 0)
        .map(a => String(a.targetId ?? a.toUserId ?? a.friendId)))
    } catch {}
  } finally { loading.value = false }
}

// 点击卡片：系统邮件走弹窗，普通信件跳详情
const openItem = (item) => {
  if (item.isSys) openMail(item)
  else router.push(`/letters/${item.id}`)
}

// 打开系统邮件详情，读取时直接领取附赠
const openMail = async (m) => {
  currentMail.value = m
  mailDialog.value = true
  if (!m.claimed) {
    try {
      const r = await sysMailApi.claim(m.id)
      m.claimed = 1
      m.claimTime = new Date().toLocaleString()
      if (r.msg) ElMessage.success(r.msg)
    } catch {}
  }
}

const claimMail = async () => {
  if (!currentMail.value) return
  try {
    const r = await sysMailApi.claim(currentMail.value.id)
    currentMail.value.claimed = 1
    currentMail.value.claimTime = new Date().toLocaleString()
    if (r.msg) ElMessage.success(r.msg)
  } catch {}
}

// 拒收：信件按邮票送达时长退回寄件人
const refuse = async (item) => {
  await ElMessageBox.confirm('拒收后这封信将退回寄件人，确定拒收吗？', '拒收信件', { type: 'warning' })
  await letterApi.refuse(item.id)
  ElMessage.success('已拒收，信件正在退回寄件人')
  load()
}

// ===== 举报 / 加好友 / 来往信封 =====
const REPORT_CATS = ['辱骂攻击', '色情低俗', '广告骚扰', '政治敏感', '违法信息', '其他']
const friendIds = ref(new Set())
const appliedSet = ref(new Set())
const isFriend = (item) => friendIds.value.has(String(item.senderId))

const canAct = (item) => !item.isSys && Number(item.boxRecv) === 1

const openReport = (item) => {
  reportForm.targetId = item.id
  reportForm.category = ''
  reportForm.description = ''
  reportDialog.value = true
}
const reportDialog = ref(false)
const reporting = ref(false)
const reportForm = reactive({ targetId: null, category: '', description: '' })
const submitReport = async () => {
  if (!reportForm.category) return ElMessage.warning('请选择举报类型')
  if (reportForm.category === '其他' && !reportForm.description.trim()) {
    return ElMessage.warning('选择「其他」时请补充说明')
  }
  reporting.value = true
  try {
    await reportApi.reportLetter({
      letterId: reportForm.targetId,
      category: reportForm.category,
      description: reportForm.description.trim()
    })
    ElMessage.success('举报已提交，感谢你的反馈')
    reportDialog.value = false
  } finally { reporting.value = false }
}

const addFriend = async (item) => {
  const uid = item.senderId
  if (!uid) return
  await ElMessageBox.confirm(
    `向「${item.senderName || '这位旅人'}」发送好友申请？通过后可以查看来往信封。`,
    '添加好友',
    { type: 'info', confirmButtonText: '发送申请', cancelButtonText: '取消' }
  )
  await friendApi.apply({ targetId: uid, applyRemark: '' })
  ElMessage.success('好友申请已寄出')
  appliedSet.value = new Set([...appliedSet.value, String(uid)])
}

const historyDialog = ref(false)
const historyLoading = ref(false)
const historyList = ref([])
const historyFriendName = ref('')
const openHistory = async (item) => {
  historyFriendName.value = item.senderName || '这位好友'
  historyDialog.value = true
  historyLoading.value = true
  try {
    const r = await letterApi.history(item.senderId)
    historyList.value = r.data || []
  } finally { historyLoading.value = false }
}

const switchTab = (t) => {
  activeTab.value = t
  load()
}

const remove = async (id) => {
  await ElMessageBox.confirm('确定删除这封信？', '提示', { type: 'warning' })
  await letterApi.remove(id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.head-actions { display: flex; align-items: center; gap: 12px; }
.env-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; align-items: start; }
.envelope {
  position: relative;
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(140, 116, 80, 0.08);
  transition: transform .1s;
}
.envelope:active { transform: scale(0.98); }
/* 收到的信(暖金) 与 寄出的信(青绿) 双色区分 */
.envelope.env-recv {
  background: #fdf6e5;
  border-left: 4px solid #d9a441;
}
.envelope.env-sent {
  background: #eef6ec;
  border-left: 4px solid #6f9e63;
}
/* 系统邮件(淡紫) */
.envelope.env-sys {
  background: #f3f0fa;
  border-left: 4px solid #9a86c8;
}
.env-flap {
  height: 14px;
  background: linear-gradient(135deg, var(--paper-deep) 0%, transparent 50%),
              linear-gradient(-135deg, var(--paper-deep) 0%, transparent 50%);
  border-bottom: 1px dashed var(--line);
}
.env-body { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px 14px; }
.env-stamp {
  width: 42px;
  height: 48px;
  background: repeating-linear-gradient(45deg, var(--accent-soft) 0 4px, var(--paper-warm) 4px 8px);
  border: 1px dashed var(--soft-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.env-stamp-inner {
  font-family: var(--serif);
  color: var(--accent);
  font-weight: 700;
  font-size: 16px;
  border: 1px solid var(--soft-border);
  border-radius: 3px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.env-main { flex: 1; min-width: 0; }
.env-title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 15px;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 6px;
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}
.env-addr { font-size: 12px; color: var(--ink-soft); margin-top: 6px; display: flex; align-items: center; gap: 6px; }
.env-tag { transform: scale(0.85); transform-origin: left center; }
.env-date { font-size: 11px; color: var(--ink-faint); margin-top: 6px; }
.env-del { color: var(--ink-faint); cursor: pointer; padding: 2px; }
.env-del:hover { color: var(--accent); }
.env-refuse {
  font-size: 12px;
  color: #c0704d;
  cursor: pointer;
  padding: 2px 4px;
  flex-shrink: 0;
}
.env-refuse:hover { color: #a34f2c; text-decoration: underline; }
.env-act {
  font-size: 12px;
  color: var(--gold, #a8863c);
  cursor: pointer;
  padding: 2px 4px;
  flex-shrink: 0;
}
.env-act:hover { color: #7a5c1e; text-decoration: underline; }

/* 举报弹窗 */
.report-cats { display: flex; flex-wrap: wrap; gap: 8px; }
.report-cats .chip {
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--soft-border, #e5dcc6);
  cursor: pointer;
  color: var(--ink-soft, #6b5d4d);
  background: #fffdf6;
}
.report-cats .chip.on {
  color: #fff;
  background: var(--accent, #7a5c3e);
  border-color: var(--accent, #7a5c3e);
}

/* 来往信封 */
.history-list { display: flex; flex-direction: column; gap: 10px; max-height: 60vh; overflow-y: auto; }
.history-item { padding: 10px 14px; cursor: pointer; }
.history-item:active { transform: scale(0.99); }
.history-head { display: flex; align-items: center; gap: 8px; }
.history-dir {
  font-size: 11px;
  border-radius: 4px;
  padding: 1px 6px;
  background: #eef4ec;
  color: #5a7a52;
  flex-shrink: 0;
}
.history-dir.mine { background: #f3ecdf; color: #8a6f45; }
.history-title {
  font-family: var(--serif, serif);
  font-weight: 600;
  font-size: 13px;
  color: var(--ink, #3d3327);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.history-time { font-size: 11px; color: var(--ink-faint, #b0a48c); flex-shrink: 0; }
.history-preview {
  font-size: 12px;
  color: var(--ink-soft, #6b5d4d);
  margin-top: 6px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.empty-poem {
  text-align: center;
  font-family: var(--serif);
  color: var(--ink-faint);
  font-size: 13px;
  padding: 50px 0;
  letter-spacing: 1px;
}

/* 未读提示 */
.unread-banner {
  background: var(--accent-soft);
  border: 1px solid var(--soft-border);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--accent);
  cursor: pointer;
  margin-bottom: 12px;
  font-weight: 600;
}

.mail-detail-content { font-size: 14px; color: var(--ink-soft); line-height: 1.9; white-space: pre-wrap; }
.mail-detail-attach { font-size: 13px; color: var(--accent); margin-top: 14px; }
.mail-detail-claimed { font-size: 12px; color: var(--ink-faint); margin-top: 8px; }
</style>
