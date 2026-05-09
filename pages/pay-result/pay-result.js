const { applyLang } = require('../../i18n.js')

Page({
  data: {
    lang: 'zh',
    t: {},
    orderNo: '',
    amount: '0.00',
    status: 'success'
  },

  onLoad(options) {
    applyLang(this)
    this.setData({
      orderNo: options.orderNo || '',
      amount: options.amount || '0.00',
      status: options.status || 'success'
    })
  },

  // 查看订单
  viewOrder() {
    wx.redirectTo({ url: '/pages/orders/orders' })
  },

  // 继续购物
  continueShop() {
    wx.switchTab({ url: '/pages/services/services' })
  }
})
