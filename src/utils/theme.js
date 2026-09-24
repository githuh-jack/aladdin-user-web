// 用户可选主题色板(存 localStorage, 挂 html[data-theme])
export const THEMES = [
  { key: '', name: '朱砂', color: '#b3574d' },
  { key: 'celadon', name: '青瓷', color: '#4e8d7c' },
  { key: 'indigo', name: '黛蓝', color: '#5b6d9e' },
  { key: 'sakura', name: '绯樱', color: '#c26583' },
  { key: 'ink', name: '黛墨', color: '#6b6357' }
]

const STORAGE_KEY = 'paper-theme'

export function applyTheme(key) {
  if (key) {
    document.documentElement.dataset.theme = key
  } else {
    delete document.documentElement.dataset.theme
  }
  localStorage.setItem(STORAGE_KEY, key)
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    document.documentElement.dataset.theme = saved
  }
  return saved || ''
}
