const { applyLang } = require('../../i18n.js')

Page({
  data: {
    lang: 'zh',
    t: {},
    orderItems: [],
    address: null,
    remark: '',
    goodsTotal: '0.00',
    freight: 0,
    discount: 0,
    orderTotal: '0.00'
  },

  onLoad() {
    applyLang(this)
    this.loadOrderItems()
    this.loadAddress()
  },

  onShow() {
    applyLang(this)
  },

  // 加载订单商品
  loadOrderItems() {
    const orderItems = wx.getStorageSync('orderItems') || []
    this.setData({ orderItems })
    this.calculateTotal()
  },

  // 加载地址
  loadAddress() {
    const address = wx.getStorageSync('defaultAddress')
    this.setData({ address })
  },

  // 计算总价
  calculateTotal() {
    let goodsTotal = 0
    this.data.orderItems.forEach(item => {
      goodsTotal += parseFloat(item.price) * item.quantity
    })
    
    const freight = goodsTotal >= 99 ? 0 : 10
    const orderTotal = goodsTotal + freight - this.data.discount

    this.setData({
      goodsTotal: goodsTotal.toFixed(2),
      freight,
      orderTotal: orderTotal.toFixed(2)
    })
  },

  // 选择地址
  chooseAddress() {
    wx.chooseAddress({
      success: (res) => {
        const address = {
          name: res.userName,
          phone: res.telNumber,
          province: res.provinceName,
          city: res.cityName,
          district: res.countyName,
          detail: res.detailInfo
        }
        this.setData({ address })
        wx.setStorageSync('defaultAddress', address)
      },
      fail: () => {
        wx.showToast({
          title: '请授权地址信息',
          icon: 'none'
        })
      }
    })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 提交订单
  submitOrder() {
    const { orderItems, address, remark, orderTotal } = this.data

    if (!address) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }

    if (orderItems.length === 0) {
      wx.showToast({ title: '订单商品为空', icon: 'none' })
      return
    }

    // 显示加载中
    wx.showLoading({ title: '提交中...' })

    // 生成订单号
    const orderNo = 'BT' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()

    // 构建订单数据
    const order = {
      orderNo,
      items: orderItems,
      address,
      remark,
      totalAmount: orderTotal,
      status: 'pending',
      createTime: new Date().toISOString()
    }

    // 保存订单到本地（模拟）
    const orders = wx.getStorageSync('orders') || []
    orders.unshift(order)
    wx.setStorageSync('orders', orders)

    // 清空购物车中已结算的商品
    const cart = wx.getStorageSync('cart') || []
    const newItemIds = orderItems.map(item => item.id)
    const newCart = cart.filter(item => !newItemIds.includes(item.id))
    wx.setStorageSync('cart', newCart)

    // 清除临时订单数据
    wx.removeStorageSync('orderItems')

    setTimeout(() => {
      wx.hideLoading()
      
      // 跳转到支付页面（模拟支付）
      wx.redirectTo({
        url: `/pages/pay-result/pay-result?orderNo=${orderNo}&amount=${orderTotal}&status=success`
      })
    }, 1000)
  }
})
