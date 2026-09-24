<template>
  <div class="page-container">
    <h3 class="section-title">文竹生长</h3>
    <div class="filter-row">
      <el-input v-model="query.userId" placeholder="用户ID" style="width: 120px" clearable @keyup.enter="loadBamboo" />
      <el-button type="primary" @click="loadBamboo">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-table :data="bambooList" v-loading="loading" border>
      <el-table-column prop="userId" label="用户ID" width="100" />
      <el-table-column prop="nickName" label="昵称" min-width="140" />
      <el-table-column prop="heightCm" label="高度(cm)" width="110" />
      <el-table-column prop="sys001" label="建档时间" width="170" />
    </el-table>
    <el-pagination v-if="bambooTotal > query.limit" layout="prev, pager, next" :total="bambooTotal"
                   :page-size="query.limit" v-model:current-page="query.page" @current-change="loadBamboo"
                   style="margin-top: 12px; justify-content: flex-end" />

    <h4 class="section-title" style="margin-top: 24px">生长记录</h4>
    <div class="filter-row">
      <el-input v-model="logQuery.userId" placeholder="用户ID" style="width: 120px" clearable @keyup.enter="loadLogs" />
      <el-button type="primary" @click="loadLogs">查询</el-button>
    </div>
    <el-table :data="logList" v-loading="logLoading" border>
      <el-table-column prop="user_id" label="用户ID" width="100" />
      <el-table-column prop="nick_name" label="昵称" min-width="130" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.biz_type === 'letter'" size="small">写信</el-tag>
          <el-tag v-else size="small" type="success">日记</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="add_cm" label="生长(cm)" width="100" />
      <el-table-column prop="content_len" label="内容字数" width="100" />
      <el-table-column prop="ref_id" label="关联ID" width="100" />
      <el-table-column prop="sys001" label="时间" width="170" />
    </el-table>
    <el-pagination v-if="logTotal > logQuery.limit" layout="prev, pager, next" :total="logTotal"
                   :page-size="logQuery.limit" v-model:current-page="logQuery.page" @current-change="loadLogs"
                   style="margin-top: 12px; justify-content: flex-end" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

const bambooList = ref([])
const bambooTotal = ref(0)
const loading = ref(false)
const query = reactive({ page: 1, limit: 20, userId: '' })

const logList = ref([])
const logTotal = ref(0)
const logLoading = ref(false)
const logQuery = reactive({ page: 1, limit: 20, userId: '' })

const loadBamboo = async () => {
  loading.value = true
  try {
    const r = await adminApi.bambooList({ page: query.page, limit: query.limit, userId: query.userId || undefined })
    const d = r.data || {}
    bambooList.value = d.items || []
    bambooTotal.value = d.total || 0
  } finally { loading.value = false }
}

const loadLogs = async () => {
  logLoading.value = true
  try {
    const r = await adminApi.bambooLogs({ page: logQuery.page, limit: logQuery.limit, userId: logQuery.userId || undefined })
    const d = r.data || {}
    logList.value = d.items || []
    logTotal.value = d.total || 0
  } finally { logLoading.value = false }
}

const reset = () => {
  query.page = 1
  query.userId = ''
  loadBamboo()
}

onMounted(() => { loadBamboo(); loadLogs() })
</script>
