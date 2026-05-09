const { applyLang, changeLang } = require('../../i18n.js')
Page({
  data:{ keyword:'', status:'unknown', title:'', icon:'⚠️', risk:'', advice:'', lang:'zh', t:{}, rtl:false },
  onLoad(q){ this._q=q||{}; this.applyResult() },
  onShow(){ this.applyResult() },
  changeLang(e){ changeLang(this, e.currentTarget.dataset.lang); this.applyResult(false) },
  applyResult(shouldApply=true){
    if(shouldApply) applyLang(this);
    const q=this._q||{}; const status=q.status||this.data.status||'unknown';
    const map=this.data.t.resultMap || {}; const item=map[status] || map.unknown || {};
    const iconMap={available:'✅', registered:'❌', unknown:'⚠️'};
    this.setData({keyword:decodeURIComponent(q.keyword||this.data.keyword||''), status, icon:iconMap[status]||'⚠️', title:item.title||'', risk:item.risk||'', advice:item.advice||''})
  },
  goConsult(){ wx.switchTab({url:'/pages/consult/consult'}) }
})
