const { applyLang, changeLang } = require('../../i18n.js')

Page({
  data: {
    keyword: '',
    lang: 'zh',
    t: {},
    rtl: false,
    // 轮播图数据
    banners: [
      { id: 1, image: '/images/zh/banner1.png', title: '2060+', subtitle: '全国服务门店为你服务' },
      { id: 2, image: '/images/zh/banner2.png', title: '专业团队', subtitle: '一对一专属顾问服务' },
      { id: 3, image: '/images/zh/banner3.png', title: '品质保障', subtitle: '全程跟踪直至完成' }
    ],
    // 滚动字幕
    marqueeText: '恭喜 张先生 成功注册商标  恭喜 李女士 完成公司注册  恭喜 王总 专利申请通过'
  },

  onLoad() {
    applyLang(this)
    this.startMarquee()
  },

  onShow() {
    applyLang(this)
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  changeLang(e) {
    changeLang(this, e.currentTarget.dataset.lang)
  },

  goQuery() {
    wx.setStorageSync('pendingKeyword', this.data.keyword || '')
    wx.switchTab({ url: '/pages/query/query' })
  },

  goConsult() {
    wx.switchTab({ url: '/pages/consult/consult' })
  },

  goServices() {
    wx.switchTab({ url: '/pages/services/services' })
  },

  goWebsite() {
    wx.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent('https://www.bastao.cn')}`
    })
  },

  // 启动滚动字幕
  startMarquee() {
    // 简单的字幕滚动效果，实际项目中可以使用 CSS 动画
  }
})
