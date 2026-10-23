<template>
  <div class="feedback-page">
    <div class="page-head">
      <h2 class="page-title">问题反馈</h2>
      <p class="page-sub">遇到问题或有建议，写信告诉我们吧</p>
    </div>

    <div class="fb-grid">
      <!-- 提交反馈 -->
      <div class="fb-card">
        <h3 class="card-title">写下你的反馈</h3>
        <el-input v-model="form.content" type="textarea" :rows="6" maxlength="1000" show-word-limit
                  placeholder="请描述遇到的问题或建议…" />
        <el-input v-model="form.contact" maxlength="50" class="contact-input"
                  placeholder="联系方式(选填，便于我们回复你)">
          <template #prepend>联系方式</template>
        </el-input>
        <el-button type="primary" class="submit-btn" :loading="submitting" @click="submit">提交反馈</el-button>
        <p class="hint">处理结果会以系统邮件发送到你的信箱，可附赠铜钱奖励</p>
      </div>

      <!-- 我的反馈 -->
      <div class="fb-card">
        <h3 class="card-title">我的反馈</h3>
        <div v-if="loading" class="empty">加载中…</div>
        <div v-else-if="list.length === 0" class="empty">还没有反馈记录</div>
        <div v-else class="fb-list">
          <div v-for="fb in list" :key="fb.id" class="fb-item">
            <div class="fb-item-head">
              <span class="fb-time">{{ fb.sys001 }}</span>
              <el-tag v-if="fb.status === 1" type="success" size="small">已处理</el-tag>
              <el-tag v-else type="warning" size="small">待处理</el-tag>
            </div>
            <div class="fb-content">{{ fb.content }}</div>
            <div v-if="fb.status === 1" class="fb-reply">
              <div class="reply-label">处理回复</div>
              <div class="reply-text">{{ fb.reply || '已处理' }}</div>
              <div v-if="fb.coinAmount > 0" class="reply-coin">✦ 附赠铜钱×{{ fb.coinAmount }}，请在信箱查收</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { feedbackApi } from '@/api'

const form = reactive({ content: '', contact: '' })
const submitting = ref(false)
const loading = ref(false)
const list = ref([])

const submit = async () => {
  if (!form.content.trim()) { ElMessage.warning('请填写反馈内容'); return }
  submitting.value = true
  try {
    await feedbackApi.submit({ content: form.content.trim(), contact: form.contact.trim() })
    ElMessage.success('反馈已提交，感谢您的意见')
    form.content = ''
    form.contact = ''
    load()
  } catch (e) { /* 拦截器已提示 */ } finally { submitting.value = false }
}

const load = async () => {
  loading.value = true
  try {
    const r = await feedbackApi.mine()
    list.value = r.data || []
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.feedback-page { max-width: 1000px; margin: 0 auto; }
.page-head { text-align: center; margin-bottom: 22px; }
.page-title {
  font-family: var(--serif);
  font-size: 24px;
  color: var(--ink);
  letter-spacing: 3px;
  margin-bottom: 6px;
}
.page-sub { font-size: 13px; color: var(--ink-faint); }
.fb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
@media (max-width: 860px) { .fb-grid { grid-template-columns: 1fr; } }
.fb-card {
  background: var(--paper-card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
}
.card-title {
  font-family: var(--serif);
  font-size: 16px;
  color: var(--accent);
  margin-bottom: 14px;
  letter-spacing: 1px;
}
.contact-input { margin: 12px 0 16px; }
.submit-btn { width: 100%; }
.hint { font-size: 12px; color: var(--ink-faint); margin-top: 10px; text-align: center; }
.empty { text-align: center; color: var(--ink-faint); font-size: 13px; padding: 30px 0; }
.fb-list { display: flex; flex-direction: column; gap: 12px; max-height: 560px; overflow-y: auto; }
.fb-item {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--paper-bg);
}
.fb-item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.fb-time { font-size: 12px; color: var(--ink-faint); }
.fb-content { font-size: 14px; color: var(--ink); white-space: pre-wrap; word-break: break-word; }
.fb-reply {
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--accent-soft);
  border-radius: 8px;
}
.reply-label { font-size: 12px; color: var(--accent); margin-bottom: 4px; font-weight: 600; }
.reply-text { font-size: 13px; color: var(--ink); white-space: pre-wrap; word-break: break-word; }
.reply-coin { font-size: 12px; color: var(--accent); margin-top: 6px; }
</style>
