<template>
  <div class="page-container">
    <div class="header-row">
      <h3 class="section-title">公告管理</h3>
      <div>
        <el-button type="primary" @click="openDialog()">新增公告</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" min-width="260" show-overflow-tooltip />
      <el-table-column prop="sys001" label="创建时间" width="170" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">发布</el-tag>
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

    <el-dialog v-model="dialogVisible" :title="editing.id ? '编辑公告' : '新增公告'" width="620px">
      <el-form :model="editing" label-width="80px">
        <el-form-item label="标题" required><el-input v-model="editing.title" maxlength="100" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="editing.content" type="textarea" :rows="5" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editing.status" :active-value="1" :inactive-value="0" active-text="发布" inactive-text="下架" />
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
    const r = await adminApi.announcements()
    list.value = r.data || []
  } catch (e) { /* 拦截器已提示 */ } finally { loading.value = false }
}

const openDialog = (row) => {
  Object.keys(editing).forEach(k => delete editing[k])
  if (row) Object.assign(editing, row)
  else Object.assign(editing, { title: '', content: '', status: 1 })
  dialogVisible.value = true
}

const save = async () => {
  if (!editing.title || !editing.title.trim()) { ElMessage.warning('请输入公告标题'); return }
  try {
    if (editing.id) await adminApi.announcementEdit(editing)
    else await adminApi.announcementAdd(editing)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } catch (e) { /* 拦截器已提示 */ }
}

const remove = async (id) => {
  await ElMessageBox.confirm('确定删除该公告？', '提示', { type: 'warning' })
  await adminApi.announcementRemove(id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.section-title { margin-bottom: 12px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
</style>
