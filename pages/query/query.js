const { applyLang, changeLang } = require('../../i18n.js')
Page({
  data:{ keyword:'', countryIndex:0, catIndex:0, country:'', category:'', lang:'zh', t:{}, rtl:false, loading:false },
  onLoad(){ applyLang(this); this.syncPickers() },
  onShow(){ applyLang(this); this.syncPickers(); const kw=wx.getStorageSync('pendingKeyword')||''; if(kw){ this.setData({keyword:kw}); wx.removeStorageSync('pendingKeyword') } },
  changeLang(e){ changeLang(this, e.currentTarget.dataset.lang); this.setData({countryIndex:0,catIndex:0}); this.syncPickers() },
  syncPickers(){ const t=this.data.t||{}; const countries=t.countries||[]; const cats=t.cats||[]; this.setData({country:countries[this.data.countryIndex]||'', category:cats[this.data.catIndex]||''}) },
  onKeyword(e){ this.setData({keyword:e.detail.value}) },
  onCountry(e){ this.setData({countryIndex:Number(e.detail.value)}); this.syncPickers() },
  onCat(e){ this.setData({catIndex:Number(e.detail.value)}); this.syncPickers() },
  doQuery(){
    if(!this.data.keyword || !this.data.keyword.trim()){ 
      wx.showToast({title:this.data.t.emptyKeyword, icon:'none'}); 
      return 
    }
    this.setData({loading:true})
    try {
      setTimeout(()=>{
        const pool=['available','registered','unknown'];
        const keywordLen = (this.data.keyword || '').length
        const status=pool[keywordLen % 3];
        this.setData({loading:false})
        wx.navigateTo({url:`/pages/result/result?keyword=${encodeURIComponent(this.data.keyword)}&country=${encodeURIComponent(this.data.country)}&category=${encodeURIComponent(this.data.category)}&status=${status}`})
      },800)
    } catch(e) {
      this.setData({loading:false})
      wx.showToast({title: '查询失败', icon: 'none'})
    }
  }
})
