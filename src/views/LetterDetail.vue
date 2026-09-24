<template>
  <div>
    <div class="back-row" @click="$router.back()">
      <el-icon><ArrowLeft /></el-icon><span>返回</span>
    </div>

    <div v-loading="loading">
      <!-- 信封头 -->
      <div class="envelope-head">
        <div class="env-stamp">
          <span class="env-stamp-inner">邮</span>
        </div>
        <div class="env-meta">
          <div class="env-title">{{ letter.title || '(无标题)' }}</div>
          <div class="env-line">{{ letter.senderName }} → {{ letter.receiverName || letter.receiverAddress || '收件地址待填' }}</div>
          <div class="env-line faint">{{ letter.sendTime || '尚未寄出' }}<template v-if="letter.readTime"> · 读于 {{ letter.readTime }}</template></div>
          <div v-if="letter.arrivalTime" class="env-line faint">预计 {{ letter.arrivalTime }} 送达</div>
          <div v-if="letter.stampName || letter.envelopeName" class="env-line faint">
            <template v-if="letter.stampName">邮票「{{ letter.stampName }}」</template>
            <template v-if="letter.envelopeName"> · 信封「{{ letter.envelopeName }}」</template>
          </div>
        </div>
      </div>

      <!-- 信纸正文 -->
      <div class="letter-paper">
        <div class="salutation">致 {{ letter.receiverName || letter.receiverAddress || '远方的朋友' }}：</div>
        <div class="letter-content">{{ letter.content }}</div>
        <div class="signature">—— {{ letter.senderName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { letterApi } from '@/api'

const route = useRoute()
const letter = ref({})
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const r = await letterApi.detail(route.params.id)
    letter.value = r.data || {}
  } finally { loading.value = false }
})
</script>

<style scoped>
.back-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ink-soft);
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 12px;
}
.back-row:active { color: var(--accent); }

.envelope-head {
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 14px 14px 0 0;
  border-bottom: 1px dashed var(--line);
  padding: 14px 16px;
  display: flex;
  gap: 14px;
}
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
.env-meta { flex: 1; min-width: 0; }
.env-title { font-family: var(--serif); font-weight: 700; font-size: 17px; color: var(--ink); }
.env-line { font-size: 12px; color: var(--ink-soft); margin-top: 5px; }
.env-line.faint { color: var(--ink-faint); }

.letter-paper {
  background:
    repeating-linear-gradient(to bottom, transparent 0, transparent 27px, var(--line) 27px, var(--line) 28px),
    var(--paper-card);
  border: 1px solid var(--line);
  border-top: none;
  border-radius: 0 0 14px 14px;
  padding: 20px 18px 30px;
  font-family: var(--serif);
}
.salutation { font-size: 15px; color: var(--ink); margin-bottom: 8px; }
.letter-content {
  font-size: 15px;
  line-height: 28px;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 140px;
}
.signature { text-align: right; color: var(--ink-soft); margin-top: 16px; }
</style>
