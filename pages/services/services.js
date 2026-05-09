const { applyLang, changeLang } = require('../../i18n.js')
Page({
  data:{lang:'zh',t:{},rtl:false},
  onLoad(){ applyLang(this) },
  onShow(){ applyLang(this) },
  changeLang(e){ changeLang(this, e.currentTarget.dataset.lang) },
  goConsult(){wx.switchTab({url:'/pages/consult/consult'})}
})
