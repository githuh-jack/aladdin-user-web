<template>
  <div class="page-container">
    <div class="header-row">
      <h3 class="section-title">系统邮件</h3>
      <div>
        <el-button type="primary" @click="openSend">发送系统邮件</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" min-width="220" show-overflow-tooltip />
      <el-table-column label="附赠" min-width="180">
        <template #default="{ row }">{{ attachText(row) }}</template>
      </el-table-column>
      <el-table-column label="送达/已领" width="110" align="center">
        <template #default="{ row }">{{ row.recipientCount }} / {{ row.claimedCount }}</template>
      </el-table-column>
      <el-table-column prop="sys001" label="发送时间" width="170" />
    </el-table>

    <el-dialog v-model="sendVisible" title="发送系统邮件(全体用户)" width="620px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题" required><el-input v-model="form.title" maxlength="100" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
        <el-form-item label="附赠铜钱(文)"><el-input-number v-model="form.coinAmount" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="附赠邮票">
          <el-select v-model="form.stampId" clearable placeholder="不附赠" style="width: 100%">
            <el-option v-for="s in stamps" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="附赠信封">
          <el-select v-model="form.envelopeId" clearable placeholder="不附赠" style="width: 100%">
            <el-option v-for="e in envelopes" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="">
          <span class="send-tip">铜钱/邮票/信封至少附赠一种，玩家读取邮件时直接领取</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendVisible = false">取消</el-button>
        <el-button type="primary" :loading="sending" @click="send">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const list = ref([])
const stamps = ref([])
const envelopes = ref([])
const loading = ref(false)
const sendVisible = ref(false)
const sending = ref(false)
const form = reactive({ title: '', content: '', coinAmount: 0, stampId: null, envelopeId: null })

const attachText = (row) => {
  const parts = []
  if (row.coinAmount > 0) parts.push(`铜钱×${row.coinAmount}`)
  if (row.stampName) parts.push(`邮票「${row.stampName}」`)
  if (row.envelopeName) parts.push(`信封「${row.envelopeName}」`)
  return parts.length ? parts.join('、') : '—'
}

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.sysMails()
    list.value = r.data || []
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

const openSend = async () => {
  Object.assign(form, { title: '', content: '', coinAmount: 0, stampId: null, envelopeId: null })
  if (!stamps.value.length) {
    try { const r = await adminApi.stamps(); stamps.value = r.data || [] } catch {}
  }
  if (!envelopes.value.length) {
    try { const r = await adminApi.envelopes(); envelopes.value = r.data || [] } catch {}
  }
  sendVisible.value = true
}

const send = async () => {
  if (!form.title.trim()) { ElMessage.warning('请输入邮件标题'); return }
  sending.value = true
  try {
    const r = await adminApi.sysMailSend({ ...form })
    ElMessage.success(`发送成功，已送达 ${r.data?.count ?? 0} 位用户`)
    sendVisible.value = false
    load()
  } catch (e) { /* 拦截器已提示 */ } finally { sending.value = false }
}

onMounted(load)
</script>

<style scoped>
.section-title { margin-bottom: 12px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.send-tip { font-size: 12px; color: #909399; }
</style>
