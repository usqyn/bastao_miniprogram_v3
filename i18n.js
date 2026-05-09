const zh = require('./i18n/zh.js')
const kkArab = require('./i18n/kkArab.js')
const kkCyrl = require('./i18n/kkCyrl.js')

const dict = { zh, kkArab, kkCyrl }

function getLang(){ return wx.getStorageSync('lang') || 'zh' }

function applyLang(page){
  const lang = getLang()
  const t = dict[lang]
  page.setData({ lang, t, rtl:lang==='kkArab', filteredProducts: t.products || [] })
  wx.setStorageSync('appLang', lang)
  page.setData({ appLang:lang })
  setTabs(lang)
}

function setTabs(lang){
  const labels = (dict[lang] || dict.zh).tabs
  if(!wx.setTabBarItem) return
  labels.forEach((text, index) => wx.setTabBarItem({ index, text }))
}

function changeLang(page, lang){
  wx.setStorageSync('lang', lang)
  applyLang(page)
  wx.showToast({ title:dict[lang].switchOk, icon:'none' })
}

module.exports = { dict, getLang, applyLang, changeLang, setTabs }