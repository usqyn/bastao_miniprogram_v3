const { applyLang, changeLang } = require('../../i18n.js')
const share = require('../../utils/share.js')
Page({
  ...share,
  data:{ keyword:'', status:'unknown', title:'', icon:'⚠️', risk:'', advice:'', lang:'zh', t:{}, rtl:false, showDisclaimer:true, agreed:false },
  onLoad(q){ this._q=q||{}; this.applyResult() },
  onShow(){ this.applyResult() },
  changeLang(e){ changeLang(this, e.currentTarget.dataset.lang); this.applyResult(false) },
  applyResult(shouldApply=true){
    if(shouldApply) applyLang(this);
    const q=this._q||{}; const status=q.status||this.data.status||'unknown';
    const map=this.data.t.resultMap || {}; const item=map[status] || map.unknown || {};
    const iconMap={available:'✅', registered:'❌', unknown:'⚠️'};
    this.setData({keyword:decodeURIComponent(q.keyword||this.data.keyword||''), status, icon:iconMap[status]||'⚠️', title:item.title||'', risk:q.risk?decodeURIComponent(q.risk):(item.risk||''), advice:q.advice?decodeURIComponent(q.advice):(item.advice||'')})
  },
  toggleAgreed(){ this.setData({agreed:!this.data.agreed}) },
  acceptDisclaimer(){ if(this.data.agreed) this.setData({showDisclaimer:false}) },
  showDisclaimer(){ this.setData({showDisclaimer:true}) },
  goConsult(){ wx.switchTab({url:'/pages/consult/consult'}) }
})
