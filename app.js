App({
  globalData:{ lang:'zh', isAdmin: false, adminPhone: '' },
  onLaunch(){
    wx.cloud.init()
    // 心跳保活
    const { heartbeat } = require('./services/supabase.js')
    heartbeat()
    const lang = wx.getStorageSync('lang') || 'zh'
    this.globalData.lang = lang
    
    const adminPhone = wx.getStorageSync('adminPhone') || ''
    this.globalData.adminPhone = adminPhone
    this.globalData.isAdmin = !!adminPhone
  },
  onShareAppMessage() {
    return {
      title: '巴丝淘',
      path: '/pages/index/index'
    }
  },
  onShareTimeline() {
    return {
      title: '巴丝淘',
      query: '',
      imageUrl: ''
    }
  }
})
