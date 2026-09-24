<template>
  <div class="page-container">
    <h3 class="section-title">头像审核</h3>
    <div class="filter-row">
      <el-select v-model="status" placeholder="全部状态" style="width: 140px" clearable @change="load">
        <el-option label="待审核" :value="0" />
        <el-option label="已通过" :value="1" />
        <el-option label="已拒绝" :value="2" />
      </el-select>
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="userName" label="用户" width="140">
        <template #default="{ row }">
          {{ row.userName || ('用户' + row.userId) }}
        </template>
      </el-table-column>
      <el-table-column prop="userId" label="用户ID" width="90" />
      <el-table-column label="头像" width="100">
        <template #default="{ row }">
          <el-image :src="row.imageUrl" :preview-src-list="[row.imageUrl]" preview-teleported
                    fit="cover" style="width: 48px; height: 48px; border-radius: 50%" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 0" type="warning">待审核</el-tag>
          <el-tag v-else-if="row.status === 1" type="success">已通过</el-tag>
          <el-tag v-else type="danger">已拒绝</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
      <el-table-column prop="sys001" label="提交时间" width="170" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button link type="success" @click="review(row, true)">通过</el-button>
            <el-button link type="danger" @click="review(row, false)">拒绝</el-button>
          </template>
          <span v-else class="reviewed-tip">已处理</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'

const list = ref([])
const loading = ref(false)
const status = ref(null)

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.avatarReviews({ status: status.value ?? undefined })
    list.value = r.data || []
  } finally { loading.value = false }
}

const reset = () => {
  status.value = null
  load()
}

const review = async (row, pass) => {
  let remark = ''
  if (!pass) {
    const res = await ElMessageBox.prompt('请输入拒绝原因（可选）', '拒绝头像', {
      confirmButtonText: '确认拒绝',
      cancelButtonText: '取消',
      inputPlaceholder: '如：图片不适宜作为头像'
    }).catch(() => null)
    if (res === null) return
    remark = res.value || ''
  }
  await adminApi.avatarReview({ id: row.id, pass, remark })
  ElMessage.success(pass ? '已通过，头像已生效' : '已拒绝')
  load()
}

onMounted(load)
</script>

<style scoped>
.reviewed-tip { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
