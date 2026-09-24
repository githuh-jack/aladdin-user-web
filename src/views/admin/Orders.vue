<template>
  <div class="page-container">
    <h3 class="section-title">订单管理</h3>
    <div class="filter-row">
      <el-input v-model="query.userId" placeholder="用户ID" style="width: 140px" clearable @keyup.enter="load" />
      <el-input v-model="query.itemType" placeholder="商品类型(stamp/envelope)" style="width: 220px" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userId" label="用户ID" width="100" />
      <el-table-column prop="userName" label="用户" width="120" />
      <el-table-column label="商品类型" width="100">
        <template #default="{ row }">
          {{ row.itemType === 'stamp' ? '邮票' : row.itemType === 'envelope' ? '信封' : row.itemType }}
        </template>
      </el-table-column>
      <el-table-column prop="itemName" label="商品名" min-width="160" show-overflow-tooltip />
      <el-table-column prop="quantity" label="数量" width="80" />
      <el-table-column prop="unitPrice" label="单价" width="90" />
      <el-table-column prop="totalPrice" label="总价" width="90" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">已完成</el-tag>
          <el-tag v-else-if="row.status === 2" type="danger">已退款</el-tag>
          <el-tag v-else type="info">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sys001" label="时间" width="170" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

const list = ref([])
const loading = ref(false)
const query = reactive({ page: 1, limit: 50, userId: '', itemType: '' })

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.coinOrders({
      page: query.page,
      limit: query.limit,
      userId: query.userId || undefined,
      itemType: query.itemType || undefined
    })
    list.value = r.data?.list || r.data?.items || r.data || []
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

const reset = () => {
  query.userId = ''
  query.itemType = ''
  load()
}

onMounted(load)
</script>

<style scoped>
.section-title { margin-bottom: 12px; }
.filter-row { display: flex; gap: 8px; margin-bottom: 12px; }
</style>
