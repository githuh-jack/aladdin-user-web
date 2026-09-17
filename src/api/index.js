import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: '/',
  timeout: 15000
})

request.interceptors.request.use(config => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers['Authorization'] = 'Bearer ' + userStore.token
  }
  return config
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== undefined && res.code !== 0 && res.code !== 200) {
      ElMessage.error(res.msg || res.message || '请求失败')
      if (res.code === 401 || res.code === 20001 || res.code === 20002 || res.code === 20003 || res.code === 20005) {
        const userStore = useUserStore()
        userStore.logout()
        window.location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search)
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    return res
  },
  error => {
    if (error.response && error.response.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search)
    }
    ElMessage.error(error.response?.data?.msg || error.message || '网络错误')
    return Promise.reject(error)
  }
)

// 鉴权
export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  logout: () => request.post('/auth/logout'),
  userInfo: () => request.get('/auth/userInfo'),
  userDetail: () => request.get('/system/user/info')
}

// 用户资料(邀请码/性别/地区/年龄/信用分/头像/个性签名)
export const profileApi = {
  me: () => request.get('/biz/profile/me'),
  save: (data) => request.post('/biz/profile/save', data)
}

// 信件
export const letterApi = {
  write: (data) => request.post('/biz/letter/write', data),
  publicWriters: () => request.get('/biz/letter/public/writers'),
  sent: (params) => request.get('/biz/letter/sent', { params }),
  inbox: (params) => request.get('/biz/letter/inbox', { params }),
  detail: (id) => request.get(`/biz/letter/detail/${id}`),
  remove: (id) => request.post(`/biz/letter/remove/${id}`)
}

// 好友
export const friendApi = {
  list: () => request.get('/biz/friend/list'),
  applies: () => request.get('/biz/friend/applies'),
  apply: (data) => request.post('/biz/friend/apply', data),
  handle: (id, data) => request.post(`/biz/friend/handle/${id}`, data),
  remove: (id) => request.post(`/biz/friend/remove/${id}`),
  blacklist: (targetId) => request.post(`/biz/friend/blacklist/${targetId}`),
  unblacklist: (targetId) => request.post(`/biz/friend/unblacklist/${targetId}`),
  blacklistList: () => request.get('/biz/friend/blacklist')
}

// 用户搜索(用于加好友)
export const userApi = {
  search: (params) => request.get('/system/user/list', { params })
}

// 日记
export const diaryApi = {
  list: (params) => request.get('/biz/diary/list', { params }),
  publicList: (params) => request.get('/biz/diary/public', { params }),
  detail: (id) => request.get(`/biz/diary/detail/${id}`),
  save: (data) => request.post('/biz/diary', data),
  update: (data) => request.post('/biz/diary/edit', data),
  remove: (id) => request.post(`/biz/diary/remove/${id}`)
}

// 其他笔记
export const noteApi = {
  list: (params) => request.get('/biz/note/list', { params }),
  publicList: (params) => request.get('/biz/note/public', { params }),
  detail: (id) => request.get(`/biz/note/detail/${id}`),
  save: (data) => request.post('/biz/note', data),
  update: (data) => request.post('/biz/note/edit', data),
  remove: (id) => request.post(`/biz/note/remove/${id}`)
}

// 邮票
export const stampApi = {
  shopList: () => request.get('/biz/stamp/shop'),
  mine: () => request.get('/biz/stamp/mine'),
  detail: (id) => request.get(`/biz/stamp/detail/${id}`),
  collection: () => request.get('/biz/stamp/collection')
}

// 互动(点赞/收藏)
export const interactApi = {
  toggle: (data) => request.post('/biz/interact/toggle', data)
}

// 评论
export const commentApi = {
  list: (params) => request.get('/biz/comment/list', { params }),
  add: (data) => request.post('/biz/comment', data)
}

// 信封
export const envelopeApi = {
  shopList: () => request.get('/biz/envelope/shop'),
  mine: () => request.get('/biz/envelope/mine'),
  detail: (id) => request.get(`/biz/envelope/detail/${id}`)
}

// 铜钱
export const coinApi = {
  balance: () => request.get('/biz/coin/balance'),
  logs: (params) => request.get('/biz/coin/logs', { params }),
  orders: (params) => request.get('/biz/coin/orders', { params })
}

// 商店
export const shopApi = {
  buy: (data) => request.post('/biz/shop/buy', data)
}

// 业务管理(仅admin)
export const adminApi = {
  letters: (params) => request.get('/biz/letter/admin/list', { params }),
  friends: () => request.get('/biz/friend/admin/list'),
  diary: (params) => request.get('/biz/diary/admin/list', { params }),
  notes: (params) => request.get('/biz/note/admin/list', { params }),
  stamps: () => request.get('/biz/stamp/admin/list'),
  stampAdd: (data) => request.post('/biz/stamp/admin/add', data),
  stampEdit: (data) => request.post('/biz/stamp/admin/edit', data),
  stampRemove: (id) => request.post(`/biz/stamp/admin/remove/${id}`),
  envelopes: () => request.get('/biz/envelope/admin/list'),
  envelopeAdd: (data) => request.post('/biz/envelope/admin/add', data),
  envelopeEdit: (data) => request.post('/biz/envelope/admin/edit', data),
  envelopeRemove: (id) => request.post(`/biz/envelope/admin/remove/${id}`),
  coinLogs: (params) => request.get('/biz/coin/admin/logs', { params }),
  coinOrders: (params) => request.get('/biz/coin/admin/orders', { params }),
  coinAdjust: (data) => request.post('/biz/coin/admin/adjust', data)
}

export default request
