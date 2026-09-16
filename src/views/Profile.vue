<template>
  <div v-loading="loading">
    <!-- 名片 + 铜钱 -->
    <div class="top-grid">
      <div class="profile-card paper-card">
        <div class="avatar-circle">{{ avatarChar }}</div>
        <div class="name">{{ userStore.realName || userStore.username || '旅人' }}</div>
        <div class="sub">ID · {{ userStore.userId || '—' }}</div>
        <div class="roles">
          <span v-for="r in (userStore.roles || [])" :key="r" class="role-chip">{{ r }}</span>
          <span v-if="!userStore.roles || !userStore.roles.length" class="role-chip">普通用户</span>
        </div>
      </div>

      <div class="coin-card paper-card">
        <div class="coin-emoji">◯</div>
        <div class="coin-value">{{ balance }} <small>文</small></div>
        <div class="coin-label">当前铜钱</div>
        <el-button round type="primary" size="small" @click="$router.push('/shop')">去商店</el-button>
      </div>
    </div>

    <!-- 统计 -->
    <div class="stat-row">
      <div class="stat-item paper-card" title="管理好友" style="cursor: pointer" @click="openFriends">
        <div class="stat-num">{{ friendCount }}</div>
        <div class="stat-label">好友</div>
      </div>
      <div class="stat-item paper-card" title="查看邮票收藏进度" style="cursor: pointer" @click="openCollection">
        <div class="stat-num">{{ myStamps.length }}</div>
        <div class="stat-label">邮票种类</div>
      </div>
      <div class="stat-item paper-card">
        <div class="stat-num">{{ myEnvelopes.length }}</div>
        <div class="stat-label">信封种类</div>
      </div>
      <div class="stat-item paper-card">
        <div class="stat-num">{{ orders.length }}</div>
        <div class="stat-label">订单总数</div>
      </div>
      <div class="stat-item paper-card" @click="activeTab = 'logs'">
        <div class="stat-num">{{ logs.length }}</div>
        <div class="stat-label">流水条数</div>
      </div>
    </div>

    <!-- 我的资产与记录 -->
    <div class="block-head">
      <span class="poetic-title" style="font-size: 16px">我的资产与记录</span>
    </div>
    <div class="seg" style="margin-bottom: 14px">
      <button class="seg-item" :class="{ on: activeTab === 'stamps' }" @click="activeTab = 'stamps'">我的邮票</button>
      <button class="seg-item" :class="{ on: activeTab === 'envelopes' }" @click="activeTab = 'envelopes'">我的信封</button>
      <button class="seg-item" :class="{ on: activeTab === 'logs' }" @click="activeTab = 'logs'">铜钱流水</button>
      <button class="seg-item" :class="{ on: activeTab === 'orders' }" @click="activeTab = 'orders'">购买订单</button>
    </div>

    <!-- 我的邮票 -->
    <div v-if="activeTab === 'stamps'" class="goods-grid">
      <div v-for="s in myStamps" :key="s.stampId" class="paper-card goods-card">
        <div class="goods-stamp"><span class="goods-stamp-inner">{{ (s.stampName || '邮').slice(0, 2) }}</span></div>
        <div class="goods-name">{{ s.stampName }}</div>
        <div class="goods-tag">{{ s.stampType || '普通' }} · 持有 {{ s.count }}</div>
        <el-button round size="small" @click="viewImage(s.stampImageUrl, s.stampName)">查看</el-button>
      </div>
      <div v-if="!myStamps.length" class="empty-poem">还没有邮票，去商店挑一枚吧。</div>
    </div>

    <!-- 我的信封 -->
    <div v-else-if="activeTab === 'envelopes'" class="goods-grid">
      <div v-for="e in myEnvelopes" :key="e.envelopeId" class="paper-card goods-card">
        <div class="goods-envelope"><span>✉</span></div>
        <div class="goods-name">{{ e.envelopeName }}</div>
        <div class="goods-tag">持有 {{ e.count }}</div>
        <el-button round size="small" @click="viewImage(e.envelopeImageUrl, e.envelopeName)">查看</el-button>
      </div>
      <div v-if="!myEnvelopes.length" class="empty-poem">还没有信封，去商店挑一个吧。</div>
    </div>

    <!-- 铜钱流水 -->
    <div v-else-if="activeTab === 'logs'">
      <div v-for="log in logs" :key="log.id" class="paper-card log-card">
        <div class="log-left">
          <div class="log-type">{{ log.logType }}</div>
          <div class="log-time">{{ log.sys001 }}</div>
          <div class="log-remark">{{ log.remark || '' }}</div>
        </div>
        <div class="log-right">
          <div :class="['log-amt', log.changeAmount >= 0 ? 'plus' : 'minus']">
            {{ log.changeAmount >= 0 ? '+' : '' }}{{ log.changeAmount }}
          </div>
          <div class="log-bal">余 {{ log.balanceAfter }}</div>
        </div>
      </div>
      <div v-if="!logs.length" class="empty-poem">还没有铜钱变动。</div>
    </div>

    <!-- 购买订单 -->
    <div v-else-if="activeTab === 'orders'">
      <div v-for="o in orders" :key="o.id" class="paper-card order-card">
        <div class="order-head">
          <span class="order-type">{{ o.itemType === 'stamp' ? '邮票' : o.itemType === 'envelope' ? '信封' : o.itemType }}</span>
          <el-tag v-if="o.status === 1" size="small" type="success">已完成</el-tag>
          <el-tag v-else-if="o.status === 0" size="small" type="info">待处理</el-tag>
          <el-tag v-else size="small" type="danger">失败</el-tag>
        </div>
        <div class="order-name">{{ o.itemName }} × {{ o.quantity }}</div>
        <div class="order-bottom">
          <span class="order-price">{{ o.totalPrice }} 文</span>
          <span class="order-time">{{ o.sys001 }}</span>
        </div>
      </div>
      <div v-if="!orders.length" class="empty-poem">暂无订单。</div>
    </div>

    <!-- 好友管理 -->
    <el-dialog v-model="friendsVisible" title="我的好友" width="94%" style="max-width: 760px">
      <Friends />
    </el-dialog>

    <!-- 邮票收藏进度 -->
    <el-dialog v-model="collectionVisible" title="邮票收藏进度" width="92%" style="max-width: 480px">
      <template v-if="collectionList.length">
        <div v-for="c in collectionList" :key="c.theme" class="collection-row">
          <span class="collection-theme">{{ c.theme }}</span>
          <el-progress class="collection-bar" :percentage="collectionPct(c)" :stroke-width="8" :show-text="false" />
          <span class="collection-num">{{ c.collected }}/{{ c.total }}</span>
        </div>
      </template>
      <div v-else class="empty-poem">还没有收藏任何邮票，去商店挑一枚吧。</div>
    </el-dialog>

    <!-- 退出 -->
    <div class="logout-row">
      <el-button round @click="logout">退出登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { coinApi, stampApi, envelopeApi, friendApi } from '@/api'
import Friends from './Friends.vue'

const router = useRouter()
const userStore = useUserStore()
const avatarChar = computed(() => (userStore.realName || userStore.username || '客').slice(0, 1))

const loading = ref(false)
const activeTab = ref('stamps')
const balance = ref(0)
const myStamps = ref([])
const myEnvelopes = ref([])
const orders = ref([])
const logs = ref([])

// 好友管理(点击"好友"卡片查看)
const friendsVisible = ref(false)
const friendCount = ref(0)

const openFriends = () => { friendsVisible.value = true }
const loadFriendCount = async () => {
  try {
    const r = await friendApi.list()
    friendCount.value = (r.data || []).length
  } catch (e) { /* ignore */ }
}

// 邮票收藏进度(点击"邮票种类"卡片查看)
const collectionVisible = ref(false)
const collectionList = ref([])

const openCollection = async () => {
  collectionVisible.value = true
  try {
    const r = await stampApi.collection()
    collectionList.value = r.data || []
  } catch (e) { /* ignore */ }
}

const collectionPct = (c) => {
  if (!c.total) return 0
  return Math.min(100, Math.round(((c.collected || 0) / c.total) * 100))
}

const loadAll = async () => {
  loading.value = true
  try {
    const [b, s, e, o, l] = await Promise.all([
      coinApi.balance(),
      stampApi.mine(),
      envelopeApi.mine(),
      coinApi.orders({ page: 1, limit: 50 }),
      coinApi.logs({ page: 1, limit: 50 })
    ])
    balance.value = b.data?.balance ?? 0
    myStamps.value = s.data || []
    myEnvelopes.value = e.data || []
    orders.value = o.data || []
    logs.value = l.data?.items || l.data || []
    loadFriendCount()
  } finally { loading.value = false }
}

const viewImage = (url, name) => {
  if (!url) {
    ElMessage.info('暂无图片')
    return
  }
  ElMessageBox.alert(`<img src="${url}" style="max-width: 100%" alt="${name}" />`, name || '图片', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  })
}

const logout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(loadAll)
</script>

<style scoped>
.top-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
  align-items: stretch;
}
.profile-card {
  text-align: center;
  padding: 22px 16px 18px;
  margin-bottom: 0;
}
.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  border: 2px solid var(--soft-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--serif);
  font-size: 28px;
  margin: 0 auto 10px;
}
.name { font-family: var(--serif); font-size: 18px; font-weight: 700; color: var(--ink); }
.sub { font-size: 11px; color: var(--ink-faint); margin-top: 4px; }
.roles { display: flex; justify-content: center; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
.role-chip {
  font-size: 10px;
  color: var(--gold);
  border: 1px solid var(--soft-border);
  background: var(--paper-warm);
  border-radius: 999px;
  padding: 2px 10px;
}

.coin-card {
  text-align: center;
  padding: 18px 16px;
  margin-bottom: 0;
  background: linear-gradient(135deg, #fbf3e3, #f5e6c5);
  border-color: #e0c486;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.coin-emoji { font-family: var(--serif); font-size: 20px; color: #b98a3e; }
.coin-value { font-family: var(--serif); font-size: 32px; font-weight: 700; color: #7a5b1f; }
.coin-value small { font-size: 13px; color: #a78748; font-weight: normal; }
.coin-label { font-size: 11px; color: #8a6f3e; margin: 4px 0 10px; }

.stat-row { display: flex; gap: 10px; margin-bottom: 16px; }
.stat-item { flex: 1; text-align: center; padding: 12px 0; cursor: default; }
.stat-num { font-family: var(--serif); font-size: 20px; font-weight: 700; color: var(--accent); }
.stat-label { font-size: 11px; color: var(--ink-faint); margin-top: 2px; }

.block-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.goods-card {
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.goods-stamp {
  width: 56px;
  height: 64px;
  background: repeating-linear-gradient(45deg, var(--accent-soft) 0 4px, var(--paper-warm) 4px 8px);
  border: 1px dashed var(--soft-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.goods-stamp-inner {
  font-family: var(--serif);
  color: var(--accent);
  font-weight: 700;
  font-size: 14px;
  border: 1px solid var(--soft-border);
  border-radius: 3px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.goods-envelope {
  width: 56px;
  height: 40px;
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-size: 22px;
  margin-bottom: 8px;
}
.goods-name { font-family: var(--serif); font-weight: 600; font-size: 14px; }
.goods-tag {
  font-size: 10px;
  color: var(--gold);
  border: 1px solid #e3d2ac;
  border-radius: 999px;
  padding: 1px 8px;
  margin: 6px 0 10px;
}

.log-card, .order-card { margin-bottom: 10px; }
.log-card { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 14px; }
.log-type { font-family: var(--serif); font-weight: 600; font-size: 14px; }
.log-time { font-size: 11px; color: var(--ink-faint); margin-top: 2px; }
.log-remark { font-size: 12px; color: var(--ink-soft); margin-top: 4px; }
.log-right { text-align: right; }
.log-amt { font-family: var(--serif); font-weight: 700; font-size: 16px; }
.log-amt.plus { color: #6b9c4e; }
.log-amt.minus { color: var(--accent); }
.log-bal { font-size: 11px; color: var(--ink-faint); margin-top: 2px; }

.order-card { padding: 12px 14px; }
.order-head { display: flex; align-items: center; justify-content: space-between; }
.order-type {
  font-size: 10px;
  color: var(--accent);
  border: 1px solid var(--soft-border);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 1px 8px;
}
.order-name { font-family: var(--serif); font-weight: 600; margin-top: 8px; }
.order-bottom { display: flex; justify-content: space-between; margin-top: 8px; }
.order-price { color: var(--gold); font-weight: 700; }
.order-time { font-size: 11px; color: var(--ink-faint); }

.empty-poem { text-align: center; font-family: var(--serif); color: var(--ink-faint); font-size: 13px; padding: 40px 0; letter-spacing: 1px; grid-column: 1 / -1; }

.collection-row { display: flex; align-items: center; gap: 10px; }
.collection-row + .collection-row { margin-top: 10px; }
.collection-theme {
  font-size: 12px;
  color: var(--ink-soft);
  width: 76px;
  flex-shrink: 0;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.collection-bar { flex: 1; }
.collection-num { font-family: var(--serif); font-size: 12px; color: var(--ink-faint); width: 52px; flex-shrink: 0; text-align: right; }

.logout-row { text-align: center; margin-top: 24px; }
</style>
