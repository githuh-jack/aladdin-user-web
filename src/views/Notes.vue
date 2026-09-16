<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">话题</span>
      <div class="head-actions">
        <el-button v-if="!isGuest && activeTab === 'mine'" round type="primary" size="small" @click="openDialog()">发话题</el-button>
        <div class="seg">
          <button v-if="!isGuest" class="seg-item" :class="{ on: activeTab === 'mine' }" @click="switchTab('mine')">我的</button>
          <button class="seg-item" :class="{ on: activeTab === 'public' }" @click="switchTab('public')">广场</button>
        </div>
      </div>
    </div>

    <div v-loading="loading">
      <div v-for="n in list" :key="n.id" class="paper-card item-card" @click="viewDetail(n)">
        <div class="item-head">
          <span class="item-type">{{ n.noteType || '杂记' }}</span>
          <span v-if="n.isPublic === 1" class="item-public">公开</span>
          <span class="item-actions" v-if="!isGuest && activeTab === 'mine'">
            <el-icon @click.stop="openDialog(n)"><EditPen /></el-icon>
            <el-icon @click.stop="remove(n.id)"><Delete /></el-icon>
          </span>
        </div>
        <div class="item-title">{{ n.title || '(无标题)' }}</div>
        <div class="item-preview">{{ (n.content || '').slice(0, 70) }}</div>
        <div class="item-meta">
          {{ activeTab === 'mine' ? n.sys001 : (n.userName || '') }}
        </div>
        <div class="card-foot" @click.stop>
          <button class="foot-btn" :class="{ on: n.liked }" @click="toggleInteract(n)">
            <span class="foot-icon">♥</span>
            <span>{{ n.likeCount || 0 }}</span>
          </button>
          <button class="foot-btn" :class="{ on: expandedId === n.id }" @click="toggleComments(n)">
            <span>评论</span>
            <span>{{ n.commentCount || 0 }}</span>
          </button>
        </div>
        <div v-if="expandedId === n.id" class="comment-panel" @click.stop>
          <div v-loading="commentLoading" class="comment-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-main"><span class="comment-name">{{ c.userName }}</span>{{ c.content }}</div>
              <div class="comment-time">{{ (c.sys001 || '').slice(0, 16) }}</div>
            </div>
            <div v-if="!commentLoading && !comments.length" class="comment-empty">还没有回信。</div>
          </div>
          <div class="comment-input-row">
            <el-input v-model="commentText" size="small" maxlength="200" placeholder="写点什么回应…" class="comment-input" @keyup.enter="sendComment(n)" />
            <el-button size="small" round type="primary" @click="sendComment(n)">发送</el-button>
          </div>
        </div>
      </div>
      <div v-if="!loading && !list.length" class="empty-poem">
        {{ activeTab === 'mine' ? '还没有记录，随意写点什么。' : '广场还很安静。' }}
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing.id ? '编辑' : '发话题'" width="92%" style="max-width: 560px">
      <el-input v-model="editing.title" placeholder="标题" maxlength="50" class="dlg-title-input" borderless />
      <div class="dlg-label">分类</div>
      <el-input v-model="editing.noteType" placeholder="自由填写，如：清单 / 摘抄 / 计划" />
      <div class="dlg-label">正文</div>
      <el-input v-model="editing.content" type="textarea" :rows="8" resize="none" class="paper-textarea" />
      <div class="dlg-foot">
        <span>仅自己可见</span>
        <el-switch v-model="editing.isPublic" :active-value="1" :inactive-value="0" active-text="公开" />
      </div>
      <template #footer>
        <el-button round @click="dialogVisible = false">取消</el-button>
        <el-button round type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" width="92%" style="max-width: 560px">
      <template #header>
        <div>
          <div class="detail-title">{{ detailRow.title || '(无标题)' }}</div>
          <div class="detail-meta">{{ detailRow.userName }} · {{ detailRow.noteType }}</div>
        </div>
      </template>
      <div class="detail-content">{{ detailRow.content }}</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, EditPen } from '@element-plus/icons-vue'
import { noteApi, interactApi, commentApi } from '@/api'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const isGuest = computed(() => !userStore.token)

// 游客交互前先登录
const requireLogin = () => {
  ElMessage.warning('请先登录')
  router.push('/login?redirect=' + encodeURIComponent(location.pathname + location.search))
}

const activeTab = ref(!useUserStore().token ? 'public' : 'mine')
const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const detailRow = ref({})
const editing = reactive({})

const load = async () => {
  loading.value = true
  try {
    const r = activeTab.value === 'mine'
      ? await noteApi.list({ page: 1, limit: 50 })
      : await noteApi.publicList({ page: 1, limit: 50 })
    list.value = r.data || []
  } finally { loading.value = false }
}

const switchTab = (t) => {
  activeTab.value = t
  load()
}

const openDialog = (row) => {
  Object.keys(editing).forEach(k => delete editing[k])
  if (row) Object.assign(editing, row)
  else Object.assign(editing, { title: '', content: '', noteType: '其他', isPublic: 0 })
  dialogVisible.value = true
}

const save = async () => {
  if (editing.id) await noteApi.update(editing)
  else await noteApi.save(editing)
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

const remove = async (id) => {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await noteApi.remove(id)
  ElMessage.success('已删除')
  load()
}

const viewDetail = (row) => {
  detailRow.value = row
  detailVisible.value = true
}

const toggleInteract = async (n) => {
  if (isGuest.value) { requireLogin(); return }
  const r = await interactApi.toggle({ targetType: 'note', targetId: n.id, action: 'like' })
  const d = r.data || {}
  n.liked = d.active
  n.likeCount = d.count
}

const expandedId = ref(null)
const comments = ref([])
const commentLoading = ref(false)
const commentText = ref('')

const toggleComments = async (n) => {
  if (expandedId.value === n.id) { expandedId.value = null; return }
  expandedId.value = n.id
  commentText.value = ''
  comments.value = []
  commentLoading.value = true
  try {
    const r = await commentApi.list({ targetType: 'note', targetId: n.id })
    comments.value = r.data || []
  } finally { commentLoading.value = false }
}

const sendComment = async (n) => {
  if (isGuest.value) { requireLogin(); return }
  const content = (commentText.value || '').trim()
  if (!content) return
  await commentApi.add({ targetType: 'note', targetId: n.id, content })
  commentText.value = ''
  n.commentCount = (n.commentCount || 0) + 1
  const r = await commentApi.list({ targetType: 'note', targetId: n.id })
  comments.value = r.data || []
}

watch(activeTab, load)
onMounted(load)
</script>

<style scoped>
.head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.head-actions { display: flex; align-items: center; gap: 12px; }
.item-card { margin-bottom: 12px; cursor: pointer; }
.item-head { display: flex; align-items: center; gap: 8px; }
.item-type {
  font-size: 10px;
  color: var(--accent);
  border: 1px solid var(--soft-border);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 1px 8px;
}
.item-public {
  font-size: 10px;
  color: var(--gold);
  border: 1px solid var(--soft-border);
  border-radius: 999px;
  padding: 1px 8px;
}
.item-actions { margin-left: auto; display: flex; gap: 10px; color: var(--ink-faint); }
.item-actions .el-icon:hover { color: var(--accent); }
.item-title { font-family: var(--serif); font-weight: 600; font-size: 15px; margin-top: 8px; }
.item-preview {
  color: var(--ink-soft);
  font-size: 13px;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-meta { font-size: 11px; color: var(--ink-faint); margin-top: 8px; }
.card-foot {
  display: flex; align-items: center; gap: 18px;
  margin-top: 10px; padding-top: 8px;
  border-top: 1px dashed var(--line);
}
.foot-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; padding: 0; cursor: pointer;
  font-family: inherit; font-size: 12px; color: var(--ink-faint);
  transition: color .2s;
}
.foot-btn:hover { color: var(--ink-soft); }
.foot-btn.on { color: var(--accent); }
.comment-panel { margin-top: 10px; border-top: 1px dashed var(--line); padding-top: 10px; }
.comment-item { padding: 6px 0; border-bottom: 1px dotted var(--line); }
.comment-item:last-child { border-bottom: none; }
.comment-main { font-size: 12px; color: var(--ink); line-height: 20px; word-break: break-word; }
.comment-name { color: var(--accent); margin-right: 8px; }
.comment-time { font-size: 10px; color: var(--ink-faint); margin-top: 2px; }
.comment-empty { font-size: 12px; color: var(--ink-faint); padding: 8px 0; }
.comment-input-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.comment-input { flex: 1; }
.dlg-title-input :deep(.el-input__inner) { font-family: var(--serif); font-size: 16px; font-weight: 600; }
.dlg-label { font-size: 12px; color: var(--ink-faint); margin: 14px 0 8px; }
.dlg-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 13px; color: var(--ink-soft); }
.detail-title { font-family: var(--serif); font-weight: 700; font-size: 16px; }
.detail-meta { font-size: 11px; color: var(--ink-faint); margin-top: 2px; }
.detail-content { font-family: var(--serif); font-size: 15px; line-height: 28px; white-space: pre-wrap; word-break: break-word; }
.empty-poem { text-align: center; font-family: var(--serif); color: var(--ink-faint); font-size: 13px; padding: 50px 0; letter-spacing: 1px; }
</style>
