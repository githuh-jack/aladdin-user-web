<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">笔友</span>
      <el-button round size="small" type="primary" @click="applyDialog = true">添加</el-button>
    </div>

    <div class="seg" style="margin-bottom: 14px">
      <button class="seg-item" :class="{ on: activeTab === 'list' }" @click="switchTab('list')">我的好友</button>
      <button class="seg-item" :class="{ on: activeTab === 'applies' }" @click="switchTab('applies')">好友申请</button>
    </div>

    <div v-loading="loading">
      <!-- 好友列表 -->
      <template v-if="activeTab === 'list'">
        <div v-for="f in list" :key="f.id" class="paper-card friend-card">
          <div class="friend-avatar">{{ (f.friendName || '友').slice(0, 1) }}</div>
          <div class="friend-info">
            <div class="friend-name">{{ f.friendName }}</div>
            <div class="friend-since">{{ f.addTime ? `成为笔友于 ${f.addTime}` : '' }}</div>
          </div>
          <el-button round size="small" type="primary" plain @click="writeLetter(f)">写信</el-button>
          <el-icon class="friend-del" @click="remove(f.id)"><Delete /></el-icon>
        </div>
        <div v-if="!loading && !list.length" class="empty-poem">还没有笔友，去添加一位吧。</div>
      </template>

      <!-- 好友申请 -->
      <template v-else>
        <div v-for="a in list" :key="a.id" class="paper-card friend-card">
          <div class="friend-avatar">{{ (a.friendName || '客').slice(0, 1) }}</div>
          <div class="friend-info">
            <div class="friend-name">{{ a.friendName }} 想成为你的笔友</div>
            <div class="friend-since">{{ a.applyRemark || '未留言' }}</div>
            <div class="friend-since faint">{{ a.sys001 }}</div>
          </div>
          <div class="apply-actions">
            <el-button round size="small" type="primary" @click="handle(a.id, 1)">通过</el-button>
            <el-button round size="small" @click="handle(a.id, 2)">婉拒</el-button>
          </div>
        </div>
        <div v-if="!loading && !list.length" class="empty-poem">暂无申请。</div>
      </template>
    </div>

    <el-dialog v-model="applyDialog" title="添加笔友" width="88%" style="max-width: 480px">
      <el-input v-model.number="applyForm.friendId" placeholder="输入对方的用户ID" />
      <el-input v-model="applyForm.remark" placeholder="自我介绍(可选)" style="margin-top: 12px" />
      <template #footer>
        <el-button round @click="applyDialog = false">取消</el-button>
        <el-button round type="primary" @click="doApply">发送申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { friendApi } from '@/api'

const router = useRouter()
const activeTab = ref('list')
const list = ref([])
const loading = ref(false)
const applyDialog = ref(false)
const applyForm = reactive({ friendId: null, remark: '' })

const load = async () => {
  loading.value = true
  try {
    const r = activeTab.value === 'list'
      ? await friendApi.list()
      : await friendApi.applies()
    list.value = r.data || []
  } finally { loading.value = false }
}

const switchTab = (t) => {
  activeTab.value = t
  load()
}

const handle = async (id, action) => {
  await friendApi.handle(id, { action })
  ElMessage.success(action === 1 ? '已通过' : '已婉拒')
  load()
}

const remove = async (id) => {
  await ElMessageBox.confirm('确定删除该好友？', '提示', { type: 'warning' })
  await friendApi.remove(id)
  ElMessage.success('已删除')
  load()
}

const doApply = async () => {
  if (!applyForm.friendId) { ElMessage.warning('请输入好友用户ID'); return }
  await friendApi.apply({ friendId: applyForm.friendId, remark: applyForm.remark })
  ElMessage.success('已发送申请')
  applyDialog.value = false
  applyForm.friendId = null
  applyForm.remark = ''
}

const writeLetter = (friend) => {
  router.push({ path: '/letters/write', query: { receiverId: friend.friendId } })
}

onMounted(load)
</script>

<style scoped>
.head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.friend-card { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.friend-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--paper-deep);
  border: 1px solid var(--line);
  color: var(--accent);
  font-family: var(--serif);
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.friend-info { flex: 1; min-width: 0; }
.friend-name { font-family: var(--serif); font-weight: 600; font-size: 15px; }
.friend-since { font-size: 11px; color: var(--ink-faint); margin-top: 4px; }
.friend-since.faint { color: var(--ink-faint); opacity: 0.8; }
.apply-actions { display: flex; gap: 6px; flex-shrink: 0; }
.friend-del { color: var(--ink-faint); cursor: pointer; }
.friend-del:hover { color: var(--accent); }
.empty-poem { text-align: center; font-family: var(--serif); color: var(--ink-faint); font-size: 13px; padding: 50px 0; letter-spacing: 1px; }
</style>
