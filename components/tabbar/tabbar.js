const app = getApp()
const { dict } = require('../../i18n.js')

Component({
  properties: {
    current: { type: Number, value: 0 }
  },
  data: {
    tabs: [],
    currentLang: ''
  },
  lifetimes: {
    attached() {
      this.initTabs()
    },
    detached() {
      if (this.timer) clearInterval(this.timer)
    }
  },
  methods: {
    initTabs() {
      const lang = wx.getStorageSync('lang') || 'zh'
      const t = dict[lang] || dict.zh
      this.setData({
        currentLang: lang,
        tabs: [
          { icon: '🏠', text: t.tabs[0], path: '/pages/index/index' },
          { icon: '🌐', text: t.tabs[1], path: '/pages/webview/webview' },
          { icon: '🔍', text: t.tabs[2], path: '/pages/query/query' },
          { icon: '🛠', text: t.tabs[3], path: '/pages/services/services' },
          { icon: '📋', text: t.tabs[4], path: '/pages/consult/consult' }
        ]
      })
      this.startWatcher()
    },
    startWatcher() {
      if (this.timer) return
      this.timer = setInterval(() => {
        const lang = wx.getStorageSync('lang') || 'zh'
        if (lang !== this.data.currentLang) {
          this.initTabs()
        }
      }, 1000)
    },
    onTap(e) {
      const idx = e.currentTarget.dataset.index
      if (idx === this.data.current) return
      const path = this.data.tabs[idx].path
      if (path === '/pages/webview/webview') {
        wx.navigateTo({ url: path })
      } else {
        wx.switchTab({ url: path })
      }
    }
  }
})