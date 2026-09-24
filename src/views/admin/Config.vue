<template>
  <div class="page-container">
    <h3 class="section-title">系统配置</h3>
    <div class="config-tip">奖励金额与价格在此调整，保存后立即生效。</div>
    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="configKey" label="配置键" width="240" />
      <el-table-column prop="remark" label="说明" min-width="240" />
      <el-table-column label="配置值" width="160">
        <template #default="{ row }">
          <el-input v-model="row.configValue" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="save(row)">保存</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api'

const list = ref([])
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.configList()
    list.value = r.data || []
  } finally { loading.value = false }
}

const save = async (row) => {
  await adminApi.configSave({ id: row.id, configValue: row.configValue })
  ElMessage.success('已保存，立即生效')
  load()
}

onMounted(load)
</script>

<style scoped>
.config-tip { font-size: 13px; color: var(--ink-faint); margin-bottom: 12px; }
</style>
