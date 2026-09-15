<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">信箱</span>
      <div class="seg">
        <button class="seg-item" :class="{ on: activeTab === 'inbox' }" @click="switchTab('inbox')">收到的</button>
        <button class="seg-item" :class="{ on: activeTab === 'sent' }" @click="switchTab('sent')">寄出的</button>
      </div>
    </div>

    <div v-loading="loading" class="env-grid">
      <div v-for="item in list" :key="item.id" class="envelope" @click="$router.push(`/letters/${item.id}`)">
        <div class="env-flap"></div>
        <div class="env-body">
          <div class="env-stamp">
            <span class="env-stamp-inner">邮</span>
          </div>
          <div class="env-main">
            <div class="env-title">
              <i v-if="activeTab === 'inbox' && item.status === 1" class="unread-dot"></i>
              {{ item.title || '(无标题)' }}
            </div>
            <div class="env-addr">
              <template v-if="activeTab === 'inbox'">
                {{ item.senderName }} 寄给我的
              </template>
              <template v-else>
                寄给 {{ item.receiverName }}
              </template>
              <el-tag v-if="item.status === 0" size="small" type="info" class="env-tag">草稿</el-tag>
              <el-tag v-else-if="activeTab === 'sent' && item.status === 2" size="small" type="success" class="env-tag">已读</el-tag>
            </div>
            <div class="env-date">{{ item.sendTime || '尚未寄出' }}</div>
          </div>
          <el-icon class="env-del" @click.stop="remove(item.id)"><Delete /></el-icon>
        </div>
      </div>
    </div>
    <div v-if="!loading && !list.length" class="empty-poem">
      {{ activeTab === 'inbox' ? '信箱空空的，去给朋友写一封吧。' : '还没有寄出过信。' }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { letterApi } from '@/api'

const activeTab = ref('inbox')
const list = ref([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = activeTab.value === 'inbox'
      ? await letterApi.inbox({ page: 1, limit: 50 })
      : await letterApi.sent({ page: 1, limit: 50 })
    list.value = r.data.items || []
  } finally { loading.value = false }
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

watch(activeTab, load)
onMounted(load)
</script>

<style scoped>
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
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
  background: repeating-linear-gradient(45deg, var(--accent-soft) 0 4px, #fdf4ee 4px 8px);
  border: 1px dashed #d9a79f;
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
  border: 1px solid #d9a79f;
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
</style>
