<template>
  <div class="page-container">
    <div class="header-row">
      <h3 class="section-title">问题反馈</h3>
      <div class="filter-row">
        <el-input v-model="query.keyword" clearable placeholder="编号/笔名/内容" style="width: 200px"
                  @keyup.enter="search" @clear="search" />
        <el-select v-model="query.status" clearable placeholder="状态" style="width: 120px" @change="search">
          <el-option label="待处理" :value="0" />
          <el-option label="已处理" :value="1" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userNo" label="编号" width="90" />
      <el-table-column prop="userName" label="用户" width="120" />
      <el-table-column prop="content" label="反馈内容" min-width="240" show-overflow-tooltip />
      <el-table-column prop="contact" label="联系方式" width="120" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">已处理</el-tag>
          <el-tag v-else type="warning">待处理</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="赠送铜钱" width="100">
        <template #default="{ row }">
          <span v-if="row.coinAmount > 0" class="coin-text">铜钱×{{ row.coinAmount }}</span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="reply" label="回复" min-width="180" show-overflow-tooltip />
      <el-table-column prop="sys001" label="反馈时间" width="170" />
      <el-table-column prop="handleTime" label="处理时间" width="170" />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 0" link type="primary" @click="openHandle(row)">处理</el-button>
          <span v-else class="done-text">已处理</span>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" background layout="total, sizes, prev, pager, next" :total="total"
                   :current-page="query.page" :page-size="query.limit"
                   :page-sizes="[10, 20, 50]"
                   @current-change="p => { query.page = p; load() }"
                   @size-change="s => { query.limit = s; query.page = 1; load() }" />

    <el-dialog v-model="dialogVisible" title="处理反馈" width="620px">
      <div v-if="current" class="fb-brief">
        <div class="fb-brief-meta">
          {{ current.userName || '未知用户' }}（编号 {{ current.userNo ?? '—' }}）
          <span v-if="current.contact" class="fb-brief-contact">联系方式：{{ current.contact }}</span>
        </div>
        <div class="fb-brief-content">{{ current.content }}</div>
      </div>
      <el-form label-width="90px">
        <el-form-item label="处理回复">
          <el-input v-model="form.reply" type="textarea" :rows="4" maxlength="1000" show-word-limit
                    placeholder="将随系统邮件发送给反馈人" />
        </el-form-item>
        <el-form-item label="赠送铜钱">
          <el-input-number v-model="form.coinAmount" :min="0" :max="99999" :precision="0" />
          <span class="coin-hint">大于0时随系统邮件赠送，反馈人在信箱领取</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ page: 1, limit: 10, keyword: '', status: undefined })

const dialogVisible = ref(false)
const saving = ref(false)
const current = ref(null)
const form = reactive({ reply: '', coinAmount: 0 })

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.feedbacks({ ...query })
    list.value = r.data?.list || []
    total.value = r.data?.total || 0
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

const search = () => {
  query.page = 1
  load()
}

const openHandle = (row) => {
  current.value = row
  form.reply = ''
  form.coinAmount = 0
  dialogVisible.value = true
}

const save = async () => {
  saving.value = true
  try {
    await adminApi.feedbackHandle(current.value.id, {
      reply: form.reply.trim(),
      coinAmount: form.coinAmount || 0
    })
    ElMessage.success('处理成功')
    dialogVisible.value = false
    load()
  } catch (e) { /* 拦截器已提示 */ } finally { saving.value = false }
}

onMounted(load)
</script>

<style scoped>
.section-title { margin-bottom: 12px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
.filter-row { display: flex; gap: 8px; align-items: center; }
.pager { margin-top: 14px; justify-content: flex-end; }
.coin-text { color: #b3574d; font-weight: 600; }
.done-text { color: #999; font-size: 12px; }
.fb-brief { background: #f7f4ec; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }
.fb-brief-meta { font-size: 12px; color: #8a8073; margin-bottom: 6px; }
.fb-brief-contact { margin-left: 10px; }
.fb-brief-content { font-size: 14px; color: #43392e; white-space: pre-wrap; word-break: break-word; }
.coin-hint { font-size: 12px; color: #999; margin-left: 10px; }
</style>
