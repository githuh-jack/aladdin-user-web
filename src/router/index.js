import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/home',
    children: [
      { path: 'home', name: 'Home', component: () => import('@/views/Home.vue'), meta: { guest: true } },
      { path: 'letters', name: 'Letters', component: () => import('@/views/Letters.vue') },
      { path: 'letters/write', name: 'LetterWrite', component: () => import('@/views/LetterWrite.vue') },
      { path: 'letters/:id', name: 'LetterDetail', component: () => import('@/views/LetterDetail.vue') },
      { path: 'diary', name: 'Diary', component: () => import('@/views/Diary.vue') },
      { path: 'diary/write', name: 'DiaryWrite', component: () => import('@/views/DiaryWrite.vue') },
      { path: 'thoughts', name: 'Thoughts', component: () => import('@/views/Thoughts.vue'), meta: { guest: true } },
      { path: 'notes', name: 'Notes', component: () => import('@/views/Notes.vue'), meta: { guest: true } },
      { path: 'shop', name: 'Shop', component: () => import('@/views/Shop.vue') },
      { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue') },
      { path: 'admin/letters', name: 'AdminLetters', component: () => import('@/views/admin/Letters.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/friends', name: 'AdminFriends', component: () => import('@/views/admin/Friends.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/diary', name: 'AdminDiary', component: () => import('@/views/admin/Diary.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/thoughts', name: 'AdminThoughts', component: () => import('@/views/admin/Thoughts.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/notes', name: 'AdminNotes', component: () => import('@/views/admin/Notes.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/stamps', name: 'AdminStamps', component: () => import('@/views/admin/Stamps.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/envelopes', name: 'AdminEnvelopes', component: () => import('@/views/admin/Envelopes.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/coin', name: 'AdminCoin', component: () => import('@/views/admin/Coin.vue'), meta: { requiresAdmin: true } },
      { path: 'admin/orders', name: 'AdminOrders', component: () => import('@/views/admin/Orders.vue'), meta: { requiresAdmin: true } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  // 游客可访问 public/guest 页面, 其余跳登录并记住来路
  if (!userStore.token && !to.meta.public && !to.meta.guest) {
    next('/login?redirect=' + encodeURIComponent(to.fullPath))
    return
  }
  if (userStore.token && !userStore.username) {
    userStore.restoreFromStorage()
  }
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/home')
    return
  }
  next()
})

export default router
