App({
  globalData:{ lang:'zh', isAdmin: false, adminPhone: '' },
  onLaunch(){
    wx.cloud.init({ env: 'bastao-prod-xxx' })
    const lang = wx.getStorageSync('lang') || 'zh'
    this.globalData.lang = lang
    
    const adminPhone = wx.getStorageSync('adminPhone') || ''
    this.globalData.adminPhone = adminPhone
    this.globalData.isAdmin = !!adminPhone
  }
})
