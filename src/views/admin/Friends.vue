<template>
  <div class="page-container">
    <div class="header-row">
      <h3 class="section-title">好友关系</h3>
      <el-button type="primary" @click="load">刷新</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userId" label="发起方ID" width="100" />
      <el-table-column prop="friendId" label="被加方ID" width="100" />
      <el-table-column prop="friendName" label="被加方" width="120" />
      <el-table-column prop="applyRemark" label="申请备注" min-width="160" show-overflow-tooltip />
      <el-table-column prop="addTime" label="添加时间" width="170" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 0" type="primary">申请中</el-tag>
          <el-tag v-else-if="row.status === 1" type="success">已通过</el-tag>
          <el-tag v-else-if="row.status === 2" type="danger">已拒绝</el-tag>
          <el-tag v-else type="info">已删除</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sys001" label="创建时间" width="170" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api'

const list = ref([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.friends()
    list.value = r.data || []
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.section-title { margin-bottom: 12px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
</style>
