const { AdminService, OrderService } = require('../../services/supabase.js')

Page({
  data: {
    orders: [],
    activeStatus: 'all'
  },

  onLoad() {
    if (!AdminService.checkLogin()) {
      wx.redirectTo({ url: '/pages/admin/admin' })
      return
    }
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  async loadOrders() {
    try {
      const orders = await OrderService.list()
      const statusTexts = { 'pending': '待付款', 'paid': '已付款', 'shipped': '已发货', 'completed': '已完成' }

      const processedOrders = (orders || []).map(order => {
        const items = order.items || []
        return {
          ...order,
          totalCount: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
          statusText: statusTexts[order.status] || order.status,
          createTime: this.formatTime(order.createTime || order.created_at)
        }
      })

      const { activeStatus } = this.data
      this.setData({ orders: activeStatus === 'all' ? processedOrders : processedOrders.filter(o => o.status === activeStatus) })
    } catch (e) {
      console.error('加载订单失败:', e)
      this.setData({ orders: [] })
    }
  },

  switchStatus(e) {
    this.setData({ activeStatus: e.currentTarget.dataset.status })
    this.loadOrders()
  },

  async refreshOrders() {
    wx.showLoading({ title: '刷新中...' })
    await this.loadOrders()
    wx.hideLoading()
    wx.showToast({ title: '刷新成功', icon: 'success' })
  },

  shipOrder(e) {
    const order = e.currentTarget.dataset.order
    wx.showModal({
      title: '确认发货',
      content: `确认订单 ${order.orderNo} 已发货？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await OrderService.updateStatus(order.orderNo, 'shipped')
            this.loadOrders()
            wx.showToast({ title: '发货成功', icon: 'success' })
          } catch (e) {
            console.error('发货失败:', e)
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  viewDetail(e) {
    const order = e.currentTarget.dataset.order
    const statusTexts = { 'pending': '待付款', 'paid': '已付款', 'shipped': '已发货', 'completed': '已完成' }
    const goodsList = (order.items || []).map(item => `${item.name} x${item.quantity}`).join('\n')
    wx.showModal({
      title: '订单详情',
      content: `订单号: ${order.orderNo}\n状态: ${statusTexts[order.status] || order.status}\n金额: ¥${order.totalAmount}\n\n商品:\n${goodsList}\n\n收货人: ${order.address?.name || '—'}\n电话: ${order.address?.phone || '—'}\n地址: ${order.address?.province || ''}${order.address?.city || ''}${order.address?.district || ''}${order.address?.detail || ''}`,
      showCancel: false
    })
  },

  formatTime(isoString) {
    if (!isoString) return '—'
    const date = new Date(isoString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
})
