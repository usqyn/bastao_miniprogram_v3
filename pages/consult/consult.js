const { applyLang, changeLang } = require('../../i18n.js')
const { LeadService } = require('../../services/supabase.js')

const serviceToTypeMap = {
  0: 1, 1: 1,
  2: 3, 3: 4,
  4: 2, 5: 2,
  6: 5,
  7: 0
}

Page({
  data: {
    name: '',
    phone: '',
    wechat: '',
    content: '',
    typeIndex: 0,
    type: '',
    lang: 'zh',
    t: {},
    rtl: false,
    loading: false
  },

  onLoad(options) {
    applyLang(this)
    if (options.type !== undefined && options.type !== null) {
      const typeIdx = serviceToTypeMap[options.type]
      if (typeIdx !== undefined) {
        this.setData({ typeIndex: typeIdx })
      }
    }
    this.syncType()
  },

  onShow() {
    applyLang(this)
    this.syncType()
  },

  changeLang(e) {
    changeLang(this, e.currentTarget.dataset.lang)
    this.setData({ typeIndex: 0 })
    this.syncType()
  },

  syncType() {
    const types = (this.data.t && this.data.t.types) || []
    this.setData({ type: types[this.data.typeIndex] || '' })
  },

  onName(e) { this.setData({ name: e.detail.value }) },
  onPhone(e) { this.setData({ phone: e.detail.value }) },
  onWechat(e) { this.setData({ wechat: e.detail.value }) },
  onContent(e) { this.setData({ content: e.detail.value }) },
  onType(e) { this.setData({ typeIndex: Number(e.detail.value) }); this.syncType() },

  async submit() {
    if (!this.data.name || !this.data.phone) {
      wx.showToast({ title: this.data.t.submitNeed, icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(this.data.phone)) {
      wx.showToast({ title: this.data.t.phoneInvalid || '手机号格式错误', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      await LeadService.create({
        name: this.data.name,
        phone: this.data.phone,
        wechat: this.data.wechat,
        type: this.data.type,
        content: this.data.content
      })

      this.setData({ loading: false })
      wx.showToast({ title: this.data.t.submitOk, icon: 'success' })
      this.setData({ name: '', phone: '', wechat: '', content: '' })
    } catch (err) {
      console.error('提交失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '提交失败', icon: 'none' })
    }
  }
})
