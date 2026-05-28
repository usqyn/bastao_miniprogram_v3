const { AdminService, OrderService, ProductService } = require('../../services/supabase.js')

Page({
  data: {
    currentDate: '',
    stats: {
      totalRevenue: '0.00',
      totalOrders: 0,
      totalProducts: 8,
      pendingOrders: 0
    },
    todayStats: {
      orders: 0,
      revenue: '0.00',
      views: 0
    },
    recentOrders: []
  },

  onLoad() {
    if (!AdminService.checkLogin()) {
      wx.redirectTo({ url: '/pages/admin/admin' })
      return
    }
    this.setCurrentDate()
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  setCurrentDate() {
    const now = new Date()
    this.setData({ currentDate: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日` })
  },

  async loadStats() {
    try {
      const [orders, products] = await Promise.all([
        OrderService.list(),
        ProductService.list()
      ])

      const ordersList = orders || []

      const totalRevenue = ordersList.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0)
      const pendingOrders = ordersList.filter(o => o.status === 'pending').length

      const today = new Date().toDateString()
      const todayOrders = ordersList.filter(o => {
        const orderDate = new Date(o.createTime || o.created_at).toDateString()
        return orderDate === today
      })
      const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0)

      const statusTexts = { 'pending': '待付款', 'paid': '已付款', 'shipped': '已发货', 'completed': '已完成' }
      const recentOrders = ordersList.slice(0, 5).map(order => ({
        ...order,
        statusText: statusTexts[order.status] || order.status,
        createTime: this.formatTime(order.createTime || order.created_at)
      }))

      this.setData({
        stats: {
          totalRevenue: totalRevenue.toFixed(2),
          totalOrders: ordersList.length,
          totalProducts: (products || []).length || 8,
          pendingOrders
        },
        todayStats: {
          orders: todayOrders.length,
          revenue: todayRevenue.toFixed(2),
          views: Math.floor(Math.random() * 100) + 50
        },
        recentOrders
      })
    } catch (e) {
      console.error('加载统计失败:', e)
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  formatTime(isoString) {
    if (!isoString) return '—'
    const date = new Date(isoString)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  // 跳转到商品管理
  goProducts() {
    wx.navigateTo({ url: '/pages/admin-products/admin-products' })
  },

  // 跳转到订单管理
  goOrders() {
    wx.navigateTo({ url: '/pages/admin-orders/admin-orders' })
  },

  // 跳转到数据统计
  goStats() {},

  goLeads() {
    wx.navigateTo({ url: '/pages/admin-leads/admin-leads' })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          AdminService.logout()
          wx.redirectTo({ url: '/pages/admin/admin' })
        }
      }
    })
  }
})
