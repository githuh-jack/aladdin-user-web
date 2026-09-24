<template>
  <div class="page-container">
    <h3 class="section-title">信件管理</h3>
    <div class="filter-row">
      <el-input v-model="query.senderId" placeholder="发件人ID" style="width: 150px" clearable @keyup.enter="load" />
      <el-input v-model="query.receiverId" placeholder="收件人ID" style="width: 150px" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="senderName" label="发件人" width="110" />
      <el-table-column prop="receiverName" label="收件人" width="110" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="stampName" label="邮票" width="100" />
      <el-table-column prop="envelopeName" label="信封" width="100" />
      <el-table-column prop="sendTime" label="发送时间" width="170" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.status === 0">草稿</el-tag>
          <el-tag v-else-if="row.status === 1" type="primary">已发送</el-tag>
          <el-tag v-else-if="row.status === 2" type="success">已读</el-tag>
          <el-tag v-else type="danger">已删除</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.limit"
      :total="total"
      layout="total, sizes, prev, pager, next"
      style="margin-top: 12px; justify-content: flex-end"
      @change="load"
    />

    <el-dialog v-model="detailVisible" title="信件详情" width="640px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="发件人">{{ detail.senderName }} (ID: {{ detail.senderId }})</el-descriptions-item>
        <el-descriptions-item label="收件人">{{ detail.receiverName }} (ID: {{ detail.receiverId }})</el-descriptions-item>
        <el-descriptions-item label="发送时间">{{ detail.sendTime || '—' }}</el-descriptions-item>
        <el-descriptions-item label="阅读时间">{{ detail.readTime || '—' }}</el-descriptions-item>
        <el-descriptions-item label="邮票">{{ detail.stampName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="信封">{{ detail.envelopeName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="正文">
          <div class="content-box">{{ detail.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const detailVisible = ref(false)
const detail = ref({})
const query = reactive({ page: 1, limit: 10, senderId: '', receiverId: '' })

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.letters({ ...query, senderId: query.senderId || undefined, receiverId: query.receiverId || undefined })
    list.value = r.data?.list || r.data?.items || []
    total.value = r.data?.total || 0
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

const reset = () => {
  query.senderId = ''
  query.receiverId = ''
  query.page = 1
  load()
}

const viewDetail = (row) => {
  detail.value = row
  detailVisible.value = true
}

onMounted(load)
</script>

<style scoped>
.section-title { margin-bottom: 12px; }
.filter-row { display: flex; gap: 8px; margin-bottom: 12px; }
.content-box { white-space: pre-wrap; background: #f5f7fa; padding: 10px; border-radius: 4px; }
</style>
