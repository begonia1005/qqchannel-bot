import { defineStore } from 'pinia'

export type Tabs = 'log' | 'note' | 'card' | 'config' | 'scene'
export type ToastType = 'success' | 'warning' | 'info' | 'error'
let toastId = 0

export const useUIStore = defineStore('ui', {
  state: () => ({
    activeTab: 'log' as Tabs,
    connectionStatus: true, // 连接状态
    statusAlertVisible: true,
    toasts: [] as { id: number, type: ToastType, msg: string }[],
    theme: localStorage.getItem('theme') || 'lemonade'
  }),
  actions: {
    toast(type: ToastType, msg: string) {
      const obj = { type, msg, id: ++toastId }
      this.toasts.push(obj)
      setTimeout(() => {
        const index = this.toasts.indexOf(obj)
        if (index >= 0) {
          this.toasts.splice(index, 1)
        }
      }, 5000)
    },
    setTheme(theme: string) {
      this.theme = theme
      document.documentElement.dataset.theme = theme
      localStorage.setItem('theme', theme)
    }
  }
})
