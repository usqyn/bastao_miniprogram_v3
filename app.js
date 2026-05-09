App({
  globalData:{ lang:'zh' },
  onLaunch(){
    wx.cloud.init({ env: 'your-env-id' })
    const lang = wx.getStorageSync('lang') || 'zh'
    this.globalData.lang = lang
  }
})
