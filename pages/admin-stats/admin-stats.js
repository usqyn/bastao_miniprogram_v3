const { AdminService } = require('../../services/supabase.js')

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
    // 检查登录状态
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
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
    this.setData({ currentDate: dateStr })
  },

  // 加载统计数据
  loadStats() {
    // 从本地存储获取订单数据
    const orders = wx.getStorageSync('orders') || []
    
    // 计算总收入
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount || 0)
    }, 0)

    // 计算待处理订单
    const pendingOrders = orders.filter(o => o.status === 'pending').length

    // 今日统计
    const today = new Date().toDateString()
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createTime).toDateString()
      return orderDate === today
    })
    const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0)

    // 最近订单
    const recentOrders = orders.slice(0, 5).map(order => {
      const statusTexts = {
        'pending': '待付款',
        'paid': '已付款',
        'shipped': '已发货',
        'completed': '已完成'
      }
      return {
        ...order,
        statusText: statusTexts[order.status] || order.status,
        createTime: this.formatTime(order.createTime)
      }
    })

    this.setData({
      stats: {
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders: orders.length,
        totalProducts: 8,
        pendingOrders
      },
      todayStats: {
        orders: todayOrders.length,
        revenue: todayRevenue.toFixed(2),
        views: Math.floor(Math.random() * 100) + 50 // 模拟访问数据
      },
      recentOrders
    })
  },

  formatTime(isoString) {
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
