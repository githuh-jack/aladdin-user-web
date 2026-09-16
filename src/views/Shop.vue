<template>
  <div>
    <div class="head-row">
      <span class="poetic-title">商店</span>
      <div class="coin-pill" @click="loadBalance">
        <span class="coin-emoji">◯</span>
        <span class="coin-num">{{ balance }}</span>
        <span class="coin-unit">文</span>
      </div>
    </div>

    <div class="seg" style="margin-bottom: 14px">
      <button class="seg-item" :class="{ on: activeTab === 'stampShop' }" @click="switchTab('stampShop')">邮票商店</button>
      <button class="seg-item" :class="{ on: activeTab === 'envelopeShop' }" @click="switchTab('envelopeShop')">信封商店</button>
    </div>

    <div v-loading="loading">
      <!-- 邮票商店 -->
      <div v-if="activeTab === 'stampShop'">
        <!-- 集市在售 -->
        <div class="block-head"><span class="poetic-title" style="font-size: 16px">集市在售</span></div>
        <div class="goods-grid">
        <div v-for="item in stampShopList" :key="item.id" class="paper-card goods-card">
          <div class="goods-stamp">
            <span class="goods-stamp-inner">{{ item.name?.slice(0, 2) || '邮' }}</span>
          </div>
          <div class="goods-name">{{ item.name }}</div>
          <div v-if="item.theme" class="theme-chip">{{ item.theme }}</div>
          <div class="goods-desc">{{ item.description || '—' }}</div>
          <div class="goods-tag">{{ item.stampType || '普通' }}</div>
          <div class="goods-bottom">
            <span class="goods-price">{{ item.price }} <small>文</small></span>
            <span class="goods-stock">
              <template v-if="item.stock === 0">缺货</template>
              <template v-else-if="item.stock < 0">充足</template>
              <template v-else>余 {{ item.stock }}</template>
            </span>
          </div>
          <div class="goods-actions">
            <el-input-number v-model="buyQty[item.id]" :min="1" :max="99" size="small" style="width: 100px" />
            <el-button round type="primary" size="small" :disabled="item.stock === 0" @click="buy('stamp', item)">购买</el-button>
          </div>
        </div>
        <div v-if="!loading && !stampShopList.length" class="empty-poem">暂无上架邮票。</div>
        </div>
      </div>

      <!-- 信封商店 -->
      <div v-else-if="activeTab === 'envelopeShop'" class="goods-grid">
        <div v-for="item in envelopeShopList" :key="item.id" class="paper-card goods-card">
          <div class="goods-envelope"><span>✉</span></div>
          <div class="goods-name">{{ item.name }}</div>
          <div class="goods-desc">{{ item.description || '—' }}</div>
          <div class="goods-tag">{{ item.envelopeType || '普通' }}</div>
          <div class="goods-bottom">
            <span class="goods-price">{{ item.price }} <small>文</small></span>
            <span class="goods-stock">
              <template v-if="item.stock === 0">缺货</template>
              <template v-else-if="item.stock < 0">充足</template>
              <template v-else>余 {{ item.stock }}</template>
            </span>
          </div>
          <div class="goods-actions">
            <el-input-number v-model="buyQty[`e${item.id}`]" :min="1" :max="99" size="small" style="width: 100px" />
            <el-button round type="primary" size="small" :disabled="item.stock === 0" @click="buy('envelope', item)">购买</el-button>
          </div>
        </div>
        <div v-if="!loading && !envelopeShopList.length" class="empty-poem">暂无上架信封。</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { stampApi, envelopeApi, coinApi, shopApi } from '@/api'

const activeTab = ref('stampShop')
const loading = ref(false)
const balance = ref(0)
const buyQty = reactive({})

const stampShopList = ref([])
const envelopeShopList = ref([])

const loadBalance = async () => {
  try {
    const r = await coinApi.balance()
    balance.value = r.data.balance
  } catch (e) { /* ignore */ }
}

const loadStampShop = async () => {
  loading.value = true
  try {
    const r = await stampApi.shopList()
    stampShopList.value = r.data || []
  } finally { loading.value = false }
}

const loadEnvelopeShop = async () => {
  loading.value = true
  try {
    const r = await envelopeApi.shopList()
    envelopeShopList.value = r.data || []
  } finally { loading.value = false }
}

const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'stampShop') loadStampShop()
  else loadEnvelopeShop()
}

const buy = async (itemType, item) => {
  const key = itemType === 'stamp' ? item.id : `e${item.id}`
  const quantity = buyQty[key] || 1
  const totalPrice = (item.price || 0) * quantity
  try {
    await ElMessageBox.confirm(
      `确认购买 ${quantity} 件「${item.name}」，需支付 ${totalPrice} 铜钱？`,
      '购买确认',
      { type: 'warning' }
    )
  } catch { return }

  try {
    await shopApi.buy({ itemType, itemId: item.id, quantity })
    ElMessage.success('购买成功')
    await loadBalance()
    if (activeTab.value === 'stampShop') {
      loadStampShop()
    } else loadEnvelopeShop()
  } catch (e) { /* error handled by interceptor */ }
}

onMounted(async () => {
  await loadBalance()
  await loadStampShop()
})
</script>

<style scoped>
.head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.coin-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, var(--paper-warm), var(--paper-deep));
  border: 1px solid #e0c486;
  color: #7a5b1f;
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 13px;
  cursor: pointer;
}
.coin-emoji { font-family: var(--serif); font-size: 14px; }
.coin-num { font-family: var(--serif); font-weight: 700; font-size: 16px; }
.coin-unit { font-size: 11px; opacity: 0.7; }

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
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
.goods-desc { font-size: 11px; color: var(--ink-faint); margin-top: 3px; min-height: 28px; }
.goods-tag {
  font-size: 10px;
  color: var(--gold);
  border: 1px solid var(--soft-border);
  border-radius: 999px;
  padding: 1px 8px;
  margin: 6px 0;
}
.goods-bottom { display: flex; align-items: baseline; justify-content: space-between; width: 100%; margin-top: 4px; }
.goods-price { font-family: var(--serif); font-weight: 700; color: var(--gold); font-size: 15px; }
.goods-price small { font-size: 10px; color: var(--ink-faint); font-weight: normal; }
.goods-stock { font-size: 11px; color: var(--ink-faint); }
.goods-actions { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.empty-poem { text-align: center; font-family: var(--serif); color: var(--ink-faint); font-size: 13px; padding: 50px 0; letter-spacing: 1px; grid-column: 1 / -1; }

.block-head { margin: 20px 0 10px; }
.theme-chip {
  font-size: 10px;
  color: var(--accent);
  border: 1px solid var(--soft-border);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 1px 8px;
  margin: 4px 0 2px;
}
</style>
