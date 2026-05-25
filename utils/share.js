module.exports = {
  onShareAppMessage() {
    return {
      title: '巴丝淘',
      path: '/pages/index/index'
    }
  },
  onShareTimeline() {
    return {
      title: '巴丝淘',
      query: '',
      imageUrl: ''
    }
  }
}
