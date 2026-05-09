const { AdminService } = require('../../services/supabase.js')

Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    if (AdminService.checkLogin()) {
      wx.redirectTo({ url: '/pages/admin-stats/admin-stats' })
    }
    
    // 初始化默认管理员账号
    this.initAdminAccount()
  },

  // 初始化默认管理员账号
  initAdminAccount() {
    const adminUsers = wx.getStorageSync('admin_users')
    if (!adminUsers || adminUsers.length === 0) {
      wx.setStorageSync('admin_users', [
        { username: 'admin', password: '123456', name: '管理员' }
      ])
    }
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  async handleLogin() {
    const { username, password } = this.data

    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      await AdminService.login(username, password)
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/admin-stats/admin-stats' })
      }, 1000)
    } catch (error) {
      wx.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
