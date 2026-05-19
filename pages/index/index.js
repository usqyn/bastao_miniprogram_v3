const { applyLang, changeLang, getLang } = require('../../i18n.js')

Page({
  data: {
    keyword: '',
    lang: 'zh',
    t: {},
    rtl: false,
    activeCategory: 'all',
    filteredServices: [],
    // 轮播图数据
    banners: [
      { id: 1, image: '/images/zh/banner1.png', title: '2060+', subtitle: '全国服务门店为你服务' },
      { id: 2, image: '/images/zh/banner2.png', title: '专业团队', subtitle: '一对一专属顾问服务' },
      { id: 3, image: '/images/zh/banner3.png', title: '品质保障', subtitle: '全程跟踪直至完成' }
    ]
  },

  onLoad() {
    applyLang(this)
    this.updateBanners()
  },

  onShow() {
    const lang = getLang()
    if (this.data.lang !== lang) {
      applyLang(this)
      this.updateBanners()
    }
    this.filterServices()
  },

  updateBanners() {
    const lang = getLang()
    const imagePath = `/images/${lang}/`
    const timestamp = Date.now()
    this.setData({
      banners: [
        { id: 1, image: imagePath + 'banner1.png?v=' + timestamp },
        { id: 2, image: imagePath + 'banner2.png?v=' + timestamp },
        { id: 3, image: imagePath + 'banner3.png?v=' + timestamp }
      ]
    })
  },

  filterServices() {
    const services = this.data.t.serviceList || []
    if (this.data.activeCategory === 'all') {
      this.setData({ filteredServices: services })
    } else {
      this.setData({ filteredServices: services.filter(s => s.category === this.data.activeCategory) })
    }
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category })
    this.filterServices()
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  changeLang(e) {
    const newLang = e.currentTarget.dataset.lang
    changeLang(this, newLang)
    setTimeout(() => {
      this.updateBanners()
    }, 100)
  },

  goQuery() {
    wx.setStorageSync('pendingKeyword', this.data.keyword || '')
    wx.switchTab({ url: '/pages/query/query' })
  },

  goConsult(e) {
    const index = e && e.currentTarget ? e.currentTarget.dataset.index : null
    const url = index !== undefined && index !== null ? `/pages/consult/consult?type=${index}` : '/pages/consult/consult'
    wx.switchTab({ url })
  },

  goServices() {
    wx.switchTab({ url: '/pages/services/services' })
  },

  goWebsite() {
    wx.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent('https://www.bastao.cn')}`
    })
  },

  })
