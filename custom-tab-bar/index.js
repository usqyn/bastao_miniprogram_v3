const app = getApp()
const { dict } = require('../i18n.js')

Component({
  data: {
    tabs: [],
    currentLang: '',
    current: -1
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
          { icon: '/images/tabbar/home.png', text: t.tabs[0], path: '/pages/index/index' },
          { icon: '/images/tabbar/web.png', text: t.tabs[1], path: '/pages/webview/webview' },
          { icon: '/images/tabbar/query.png', text: t.tabs[2], path: '/pages/query/query' },
          { icon: '/images/tabbar/shop.png', text: t.tabs[3], path: '/pages/services/services' },
          { icon: '/images/tabbar/consult.png', text: t.tabs[4], path: '/pages/consult/consult' }
        ]
      })
      this.updateCurrent()
      this.startWatcher()
    },
    updateCurrent() {
      const pages = getCurrentPages()
      const route = pages[pages.length - 1]?.route
      const tabs = this.data.tabs
      if (!route || !tabs.length) return
      const idx = tabs.findIndex(t => t.path === '/' + route)
      if (idx !== -1 && idx !== this.data.current) {
        this.setData({ current: idx })
      }
    },
    startWatcher() {
      if (this.timer) return
      this.timer = setInterval(() => {
        const lang = wx.getStorageSync('lang') || 'zh'
        if (lang !== this.data.currentLang) {
          this.initTabs()
        }
        this.updateCurrent()
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
