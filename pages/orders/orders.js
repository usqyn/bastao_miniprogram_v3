const { applyLang, changeLang } = require('../../i18n.js')
const share = require('../../utils/share.js')
const { OrderService } = require('../../services/supabase.js')

Page({
  ...share,
  data: {
    lang: 'zh',
    t: {},
    orders: [],
    filteredOrders: [],
    activeStatus: 'all'
  },

  onLoad() {
    applyLang(this)
    this.loadOrders()
  },

  onShow() {
    applyLang(this)
    this.loadOrders()
  },

  changeLang(e) {
    changeLang(this, e.currentTarget.dataset.lang)
  },

  // 加载订单
  async loadOrders() {
    const orders = await OrderService.list()
    const statusTexts = {
      'pending': '待付款',
      'paid': '已付款',
      'shipped': '已发货',
      'completed': '已完成'
    }

    const processedOrders = orders.map(order => {
      const totalCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
      return {
        ...order,
        totalCount,
        statusText: statusTexts[order.status] || order.status
      }
    })

    this.setData({ orders: processedOrders })
    this.filterOrders()
  },

  // 切换状态
  switchStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ activeStatus: status })
    this.filterOrders()
  },

  // 筛选订单
  filterOrders() {
    const { orders, activeStatus } = this.data
    let filtered = orders

    if (activeStatus !== 'all') {
      filtered = orders.filter(order => order.status === activeStatus)
    }

    this.setData({ filteredOrders: filtered })
  },

  // 立即支付
  async payOrder(e) {
    const order = e.currentTarget.dataset.order
    wx.showLoading({ title: '请求支付...' })
    try {
      const res = await wx.cloud.callFunction({
        name: 'wxpay_unifiedorder',
        data: { orderNo: order.orderNo, totalAmount: order.totalAmount }
      })
      wx.hideLoading()
      if (res.result && res.result.code === 0) {
        const pay = res.result.data
        await wx.requestPayment({
          timeStamp: pay.timeStamp,
          nonceStr: pay.nonceStr,
          package: pay.package,
          signType: pay.signType,
          paySign: pay.paySign
        })
        wx.redirectTo({
          url: `/pages/pay-result/pay-result?orderNo=${order.orderNo}&amount=${order.totalAmount}&status=success`
        })
      } else {
        wx.showToast({ title: '获取支付参数失败', icon: 'none' })
      }
    } catch (e) {
      wx.hideLoading()
      wx.redirectTo({
        url: `/pages/pay-result/pay-result?orderNo=${order.orderNo}&amount=${order.totalAmount}&status=fail`
      })
    }
  },

  // 查看详情
  viewDetail(e) {
    const order = e.currentTarget.dataset.order
    wx.showModal({
      title: '订单详情',
      content: `订单号: ${order.orderNo}\n金额: ¥${order.totalAmount}\n状态: ${order.statusText}`,
      showCancel: false
    })
  }
})
