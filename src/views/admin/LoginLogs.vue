<template>
  <div class="page-container">
    <h3 class="section-title">登录日志</h3>
    <div class="filter-row">
      <el-input v-model="query.loginName" placeholder="登录名" style="width: 180px" clearable @keyup.enter="load" />
      <el-input v-model="query.userId" placeholder="用户ID" style="width: 120px" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="nick_name" label="昵称" width="140" />
      <el-table-column prop="user_id" label="用户ID" width="90" />
      <el-table-column prop="login_name" label="登录名" width="140" />
      <el-table-column prop="login_ip" label="IP" width="140" />
      <el-table-column prop="login_type" label="方式" width="90" />
      <el-table-column label="结果" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.code === 200 || row.code === 0" type="success">成功</el-tag>
          <el-tag v-else type="danger">{{ row.code || '失败' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="消息" min-width="140" show-overflow-tooltip />
      <el-table-column prop="login_time" label="登录时间" width="170" />
    </el-table>

    <el-pagination v-if="total > query.limit" layout="prev, pager, next" :total="total"
                   :page-size="query.limit" v-model:current-page="query.page" @current-change="load"
                   style="margin-top: 12px; justify-content: flex-end" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ page: 1, limit: 20, loginName: '', userId: '' })

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.loginLogs({
      page: query.page,
      limit: query.limit,
      loginName: query.loginName || undefined,
      userId: query.userId || undefined
    })
    const d = r.data || {}
    list.value = d.items || []
    total.value = d.total || 0
  } finally { loading.value = false }
}

const reset = () => {
  query.page = 1
  query.loginName = ''
  query.userId = ''
  load()
}

onMounted(load)
</script>
