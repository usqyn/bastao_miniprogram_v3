const { applyLang, changeLang } = require('../../i18n.js')

Page({
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
  loadOrders() {
    const orders = wx.getStorageSync('orders') || []
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
  payOrder(e) {
    const order = e.currentTarget.dataset.order
    wx.redirectTo({
      url: `/pages/pay-result/pay-result?orderNo=${order.orderNo}&amount=${order.totalAmount}&status=success`
    })
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
