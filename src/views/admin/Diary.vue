<template>
  <div class="page-container">
    <h3 class="section-title">日记管理</h3>
    <div class="filter-row">
      <el-input v-model="query.userId" placeholder="用户ID" style="width: 140px" clearable @keyup.enter="load" />
      <el-input v-model="query.keyWord" placeholder="标题关键字" style="width: 180px" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userName" label="作者" width="120" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="weather" label="天气" width="80" />
      <el-table-column prop="mood" label="心情" width="80" />
      <el-table-column prop="writeDate" label="日期" width="110" />
      <el-table-column label="可见性" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.isPublic === 1" type="success">公开</el-tag>
          <el-tag v-else type="info">私密</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sys001" label="创建时间" width="170" />
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

    <el-dialog v-model="detailVisible" title="日记详情" width="640px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="作者">{{ detail.userName }} (ID: {{ detail.userId }})</el-descriptions-item>
        <el-descriptions-item label="日期">{{ detail.writeDate }}</el-descriptions-item>
        <el-descriptions-item label="天气">{{ detail.weather || '—' }}</el-descriptions-item>
        <el-descriptions-item label="心情">{{ detail.mood || '—' }}</el-descriptions-item>
        <el-descriptions-item label="正文">
          <div class="content-box">{{ detail.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

const list = ref([])
const loading = ref(false)
const total = ref(0)
const detailVisible = ref(false)
const detail = ref({})
const query = reactive({ page: 1, limit: 10, userId: '', keyWord: '' })

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.diary({ ...query, userId: query.userId || undefined, keyWord: query.keyWord || undefined })
    list.value = r.data?.list || r.data?.items || r.data || []
    total.value = r.data?.total || list.value.length
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

const reset = () => {
  query.userId = ''
  query.keyWord = ''
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
