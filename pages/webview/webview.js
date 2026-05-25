const share = require('../../utils/share.js')
Page({
  ...share,
  data:{ url:'https://www.bastao.cn' },
  onLoad(q){
    if(q.url){
      this.setData({ url: decodeURIComponent(q.url) })
    }
  },
  goBack(){
    wx.navigateBack()
  }
})