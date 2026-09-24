<template>
  <div class="page-container">
    <div class="header-row">
      <h3 class="section-title">信封管理</h3>
      <div>
        <el-button type="primary" @click="openDialog()">新增信封</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column prop="envelopeType" label="类型" width="100" />
      <el-table-column prop="price" label="单价(文)" width="100" />
      <el-table-column label="库存" width="100">
        <template #default="{ row }">{{ row.stock < 0 ? '不限' : row.stock }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">上架</el-tag>
          <el-tag v-else type="info">下架</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing.id ? '编辑信封' : '新增信封'" width="600px">
      <el-form :model="editing" label-width="110px">
        <el-form-item label="名称" required><el-input v-model="editing.name" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="editing.envelopeType" placeholder="普通/精美/限量" /></el-form-item>
        <el-form-item label="单价(文)" required><el-input-number v-model="editing.price" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="库存(-1不限)"><el-input-number v-model="editing.stock" :min="-1" style="width: 100%" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="editing.imageUrl" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="editing.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="上架">
          <el-switch v-model="editing.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const editing = reactive({})

const load = async () => {
  loading.value = true
  try {
    const r = await adminApi.envelopes()
    list.value = r.data || []
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

const openDialog = (row) => {
  Object.keys(editing).forEach(k => delete editing[k])
  if (row) Object.assign(editing, row)
  else Object.assign(editing, { name: '', envelopeType: '普通', price: 1, stock: -1, imageUrl: '', description: '', status: 1 })
  dialogVisible.value = true
}

const save = async () => {
  if (!editing.name) { ElMessage.warning('请输入信封名称'); return }
  try {
    if (editing.id) await adminApi.envelopeEdit(editing)
    else await adminApi.envelopeAdd(editing)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) { /* 拦截器已提示 */ }
}

const remove = async (id) => {
  await ElMessageBox.confirm('确定删除该信封？', '提示', { type: 'warning' })
  await adminApi.envelopeRemove(id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.section-title { margin-bottom: 12px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
</style>
