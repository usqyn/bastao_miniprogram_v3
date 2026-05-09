const { applyLang, changeLang } = require('../../i18n.js')
Page({
  data:{ keyword:'', lang:'zh', t:{}, rtl:false },
  onLoad(){ applyLang(this) },
  onShow(){ applyLang(this) },
  onInput(e){ this.setData({keyword:e.detail.value}) },
  changeLang(e){ changeLang(this, e.currentTarget.dataset.lang) },
  goQuery(){ wx.setStorageSync('pendingKeyword', this.data.keyword || ''); wx.switchTab({url:'/pages/query/query'}) },
  goConsult(){ wx.switchTab({url:'/pages/consult/consult'}) },
  goServices(){ wx.switchTab({url:'/pages/services/services'}) },
  goWebsite(){ wx.navigateTo({url:`/pages/webview/webview?url=${encodeURIComponent('https://www.bastao.cn')}`}) }
})
