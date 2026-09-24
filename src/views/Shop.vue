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

    <!-- 商品详情(淘宝式：左图右介绍) -->
    <div v-if="detail" class="detail-wrap">
      <div class="back-row" @click="closeDetail">
        <el-icon><ArrowLeft /></el-icon><span>返回列表</span>
      </div>
      <div class="detail-main">
        <!-- 左：商品图 -->
        <div class="detail-img-box">
          <img v-if="detail.imageUrl" :src="detail.imageUrl" class="detail-img" alt="" />
          <div v-else :class="detailType === 'stamp' ? 'goods-stamp big' : 'goods-envelope big'">
            <span v-if="detailType === 'stamp'" class="goods-stamp-inner">{{ detail.name?.slice(0, 2) || '邮' }}</span>
            <span v-else>✉</span>
          </div>
        </div>
        <!-- 右：介绍 -->
        <div class="detail-info">
          <div class="detail-name">{{ detail.name }}</div>
          <div class="detail-tags">
            <span class="goods-tag">{{ detailType === 'stamp' ? (detail.stampType || '普通') : (detail.envelopeType || '普通') }}</span>
            <span v-if="detailType === 'stamp' && detail.theme" class="theme-chip">{{ detail.theme }}</span>
          </div>
          <div class="detail-price">{{ detail.price }} <small>文/件</small></div>
          <div v-if="detailType === 'stamp'" class="detail-row">
            <span class="detail-label">送达时间</span>
            <span class="detail-value">约 {{ detail.deliveryDays || 3 }} 天</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">库存</span>
            <span class="detail-value">
              <template v-if="detail.stock === 0">缺货</template>
              <template v-else-if="detail.stock < 0">充足</template>
              <template v-else>余 {{ detail.stock }}</template>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">购买数量</span>
            <el-input-number v-model="buyQty" :min="1" :max="99" size="default" style="width: 140px" />
          </div>
          <div class="detail-row">
            <span class="detail-label">合计</span>
            <span class="detail-total">{{ (detail.price || 0) * (buyQty || 1) }} 文</span>
          </div>
          <div class="detail-actions">
            <el-button round type="primary" size="large" :disabled="detail.stock === 0" @click="buy">立即购买</el-button>
          </div>
          <div class="detail-desc">
            <div class="detail-desc-title">商品介绍</div>
            <div>{{ detail.description || '——' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品列表 -->
    <div v-else v-loading="loading">
      <div class="seg" style="margin-bottom: 14px">
        <button class="seg-item" :class="{ on: activeTab === 'stampShop' }" @click="switchTab('stampShop')">邮票商店</button>
        <button class="seg-item" :class="{ on: activeTab === 'envelopeShop' }" @click="switchTab('envelopeShop')">信封商店</button>
      </div>

      <!-- 邮票商店 -->
      <div v-if="activeTab === 'stampShop'">
        <div class="block-head"><span class="poetic-title" style="font-size: 16px">集市在售</span></div>
        <div class="goods-grid">
          <div v-for="item in stampShopList" :key="item.id" class="paper-card goods-card" @click="openDetail('stamp', item)">
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
          </div>
          <div v-if="!loading && !stampShopList.length" class="empty-poem">暂无上架邮票。</div>
        </div>
      </div>

      <!-- 信封商店 -->
      <div v-else-if="activeTab === 'envelopeShop'" class="goods-grid">
        <div v-for="item in envelopeShopList" :key="item.id" class="paper-card goods-card" @click="openDetail('envelope', item)">
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
        </div>
        <div v-if="!loading && !envelopeShopList.length" class="empty-poem">暂无上架信封。</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { stampApi, envelopeApi, coinApi, shopApi } from '@/api'

const activeTab = ref('stampShop')
const loading = ref(false)
const balance = ref(0)

const stampShopList = ref([])
const envelopeShopList = ref([])

// 详情态
const detail = ref(null)
const detailType = ref('stamp')
const buyQty = ref(1)

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

const openDetail = (type, item) => {
  detailType.value = type
  detail.value = item
  buyQty.value = 1
  window.scrollTo(0, 0)
}

const closeDetail = () => {
  detail.value = null
}

const buy = async () => {
  const item = detail.value
  const quantity = buyQty.value || 1
  const totalPrice = (item.price || 0) * quantity
  try {
    await ElMessageBox.confirm(
      `确认购买 ${quantity} 件「${item.name}」，需支付 ${totalPrice} 铜钱？`,
      '购买确认',
      { type: 'warning' }
    )
  } catch { return }

  try {
    await shopApi.buy({ itemType: detailType.value, itemId: item.id, quantity })
    ElMessage.success('购买成功')
    await loadBalance()
    if (detailType.value === 'stamp') loadStampShop()
    else loadEnvelopeShop()
    closeDetail()
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
  cursor: pointer;
  transition: transform .1s, box-shadow .1s;
}
.goods-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(140, 116, 80, 0.15); }
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
.goods-stamp.big {
  width: 280px;
  height: 320px;
  margin-bottom: 0;
}
.goods-stamp.big .goods-stamp-inner {
  width: 120px;
  height: 120px;
  font-size: 40px;
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
.goods-envelope.big {
  width: 280px;
  height: 200px;
  font-size: 80px;
  margin-bottom: 0;
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

/* 详情页(淘宝式) */
.back-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ink-soft);
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 12px;
}
.back-row:active { color: var(--accent); }
.detail-wrap { background: var(--paper-card); border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
.detail-main { display: flex; gap: 24px; }
.detail-img-box {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper-warm);
  padding: 10px;
}
.detail-img { max-width: 100%; max-height: 340px; border-radius: 6px; }
.detail-info { flex: 1; min-width: 0; }
.detail-name { font-family: var(--serif); font-size: 20px; font-weight: 700; color: var(--ink); }
.detail-tags { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
.detail-price { font-family: var(--serif); font-size: 24px; font-weight: 700; color: var(--gold); margin: 10px 0 16px; }
.detail-price small { font-size: 12px; color: var(--ink-faint); font-weight: normal; }
.detail-row { display: flex; align-items: center; gap: 12px; margin: 10px 0; }
.detail-label { width: 70px; flex-shrink: 0; font-size: 13px; color: var(--ink-faint); }
.detail-value { font-size: 14px; color: var(--ink); }
.detail-total { font-family: var(--serif); font-size: 18px; font-weight: 700; color: var(--gold); }
.detail-actions { margin: 18px 0; }
.detail-desc { border-top: 1px dashed var(--line); padding-top: 12px; font-size: 13px; color: var(--ink-soft); line-height: 1.8; }
.detail-desc-title { font-weight: 600; margin-bottom: 6px; color: var(--ink); }
</style>
