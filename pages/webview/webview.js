Page({
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