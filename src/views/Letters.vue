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
    <div v-if="!loading && !list.length" class="empty-poem">
      {{ emptyText }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { letterApi, sysMailApi } from '@/api'
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
