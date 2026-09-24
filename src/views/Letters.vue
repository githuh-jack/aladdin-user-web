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
          <button class="seg-item" :class="{ on: activeTab === 'sys' }" @click="switchTab('sys')">系统</button>
        </div>
      </div>
    </div>

    <!-- 系统邮件 -->
    <div v-if="activeTab === 'sys'" v-loading="loading" class="mail-grid">
      <div v-for="m in mails" :key="m.id" class="mail-card" @click="openMail(m)">
        <div class="mail-head">
          <span class="mail-badge">系</span>
          <div class="mail-title">
            <i v-if="!m.claimed" class="unread-dot"></i>
            {{ m.title }}
          </div>
          <el-tag v-if="m.claimed" size="small" type="success" class="env-tag">已领取</el-tag>
          <el-tag v-else size="small" type="warning" class="env-tag">待领取</el-tag>
        </div>
        <div class="mail-content">{{ m.content }}</div>
        <div class="mail-attach">附赠：{{ attachText(m) }}</div>
        <div class="mail-date">{{ m.sendTime || '' }}</div>
      </div>
      <div v-if="!loading && !mails.length" class="empty-poem">暂无系统邮件。</div>
    </div>

    <div v-else v-loading="loading" class="env-grid">
      <div v-for="item in list" :key="item.id" class="envelope" @click="$router.push(`/letters/${item.id}`)">
        <div class="env-flap"></div>
        <div class="env-body">
          <div class="env-stamp">
            <span class="env-stamp-inner">邮</span>
          </div>
          <div class="env-main">
            <div class="env-title">
              <i v-if="isUnread(item)" class="unread-dot"></i>
              {{ item.title || '(无标题)' }}
            </div>
            <div class="env-addr">
              <template v-if="isMineSent(item)">
                寄给 {{ item.receiverName || item.receiverAddress || '未指定收件人' }}
              </template>
              <template v-else>
                {{ item.senderName }} 寄给我的
              </template>
              <el-tag v-if="item.status === 0" size="small" type="info" class="env-tag">草稿</el-tag>
              <el-tag v-else-if="inTransit(item)" size="small" type="warning" class="env-tag">送信中</el-tag>
              <el-tag v-else-if="isMineSent(item) && item.status === 2" size="small" type="success" class="env-tag">已读</el-tag>
            </div>
            <div class="env-date">
              {{ item.sendTime || '尚未寄出' }}
            </div>
          </div>
          <el-icon class="env-del" @click.stop="remove(item.id)"><Delete /></el-icon>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { letterApi, sysMailApi } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const activeTab = ref('all')
const list = ref([])
const loading = ref(false)
// 系统邮件
const mails = ref([])
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
// 未读：我收到的且未读
const isUnread = (item) =>
  !isMineSent(item) && item.status === 1 &&
  (!item.arrivalTime || new Date(item.arrivalTime) <= new Date())
// 在途：已寄出且还没到到达时间
const inTransit = (item) =>
  item.status >= 1 && item.arrivalTime && new Date(item.arrivalTime) > new Date()

const load = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'sys') {
      const r = await sysMailApi.list()
      mails.value = r.data || []
      return
    }
    const r = await letterApi.list({ box: activeTab.value, page: 1, limit: 50 })
    list.value = r.data.items || []
  } finally { loading.value = false }
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
.empty-poem {
  text-align: center;
  font-family: var(--serif);
  color: var(--ink-faint);
  font-size: 13px;
  padding: 50px 0;
  letter-spacing: 1px;
}

/* 系统邮件 */
.mail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; align-items: start; }
.mail-card {
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(140, 116, 80, 0.08);
  transition: transform .1s;
}
.mail-card:active { transform: scale(0.98); }
.mail-head { display: flex; align-items: center; gap: 8px; }
.mail-badge {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--serif);
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mail-title {
  flex: 1;
  min-width: 0;
  font-family: var(--serif);
  font-weight: 600;
  font-size: 15px;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 6px;
}
.mail-content {
  font-size: 12px;
  color: var(--ink-soft);
  margin-top: 8px;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mail-attach { font-size: 11px; color: var(--accent); margin-top: 8px; }
.mail-date { font-size: 11px; color: var(--ink-faint); margin-top: 6px; }
.mail-detail-content { font-size: 14px; color: var(--ink-soft); line-height: 1.9; white-space: pre-wrap; }
.mail-detail-attach { font-size: 13px; color: var(--accent); margin-top: 14px; }
.mail-detail-claimed { font-size: 12px; color: var(--ink-faint); margin-top: 8px; }
</style>
