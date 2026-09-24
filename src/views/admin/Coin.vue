<template>
  <div class="page-container">
    <div class="header-row">
      <h3 class="section-title">铜钱管理</h3>
      <el-button type="primary" @click="openAdjust">调整用户铜钱</el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="load">
      <el-tab-pane label="铜钱流水" name="logs">
        <div class="filter-row">
          <el-input v-model="query.userId" placeholder="用户ID" style="width: 140px" clearable @keyup.enter="load" />
          <el-input v-model="query.logType" placeholder="类型(shop/recharge等)" style="width: 200px" clearable @keyup.enter="load" />
          <el-button type="primary" @click="load">查询</el-button>
        </div>
        <el-table :data="list" v-loading="loading" border>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="userId" label="用户ID" width="100" />
          <el-table-column prop="userName" label="用户" width="120" />
          <el-table-column label="变动" width="100">
            <template #default="{ row }">
              <span :style="{ color: row.changeAmount >= 0 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
                {{ row.changeAmount >= 0 ? '+' : '' }}{{ row.changeAmount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balanceAfter" label="变动后余额" width="110" />
          <el-table-column prop="logType" label="类型" width="140" />
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
          <el-table-column prop="sys001" label="时间" width="170" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="购买订单" name="orders">
        <div class="filter-row">
          <el-input v-model="query.userId" placeholder="用户ID" style="width: 140px" clearable @keyup.enter="load" />
          <el-input v-model="query.itemType" placeholder="商品类型(stamp/envelope)" style="width: 220px" clearable @keyup.enter="load" />
          <el-button type="primary" @click="load">查询</el-button>
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
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="adjustVisible" title="调整用户铜钱" width="480px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="用户ID" required><el-input-number v-model="adjustForm.userId" style="width: 100%" /></el-form-item>
        <el-form-item label="变动数量" required>
          <el-input-number v-model="adjustForm.delta" style="width: 100%" placeholder="正数增加，负数扣减" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="adjustForm.remark" placeholder="管理员调整" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const activeTab = ref('logs')
const list = ref([])
const loading = ref(false)
const query = reactive({ page: 1, limit: 50, userId: '', logType: '', itemType: '' })
const adjustVisible = ref(false)
const adjustForm = reactive({ userId: undefined, delta: 0, remark: '' })

const load = async () => {
  loading.value = true
  try {
    const params = { page: query.page, limit: query.limit, userId: query.userId || undefined }
    const r = activeTab.value === 'logs'
      ? await adminApi.coinLogs({ ...params, logType: query.logType || undefined })
      : await adminApi.coinOrders({ ...params, itemType: query.itemType || undefined })
    list.value = r.data?.list || r.data?.items || r.data || []
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

const openAdjust = () => {
  adjustForm.userId = undefined
  adjustForm.delta = 0
  adjustForm.remark = ''
  adjustVisible.value = true
}

const submitAdjust = async () => {
  if (!adjustForm.userId) { ElMessage.warning('请输入用户ID'); return }
  if (!adjustForm.delta) { ElMessage.warning('请输入调整数量'); return }
  try {
    await adminApi.coinAdjust(adjustForm)
    ElMessage.success('调整成功')
    adjustVisible.value = false
    load()
  } catch (e) { /* 拦截器已提示 */ }
}

onMounted(load)
</script>

<style scoped>
.section-title { margin-bottom: 12px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.filter-row { display: flex; gap: 8px; margin-bottom: 12px; }
</style>
