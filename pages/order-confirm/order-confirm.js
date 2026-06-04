const { applyLang } = require('../../i18n.js')
const share = require('../../utils/share.js')
const { OrderService } = require('../../services/supabase.js')

Page({
  ...share,
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

  loadOrderItems() {
    try {
      const orderItems = wx.getStorageSync('orderItems') || []
      this.setData({ orderItems })
      this.calculateTotal()
    } catch (e) {
      console.error('加载订单商品失败:', e)
      this.setData({ orderItems: [] })
    }
  },

  loadAddress() {
    try {
      const address = wx.getStorageSync('defaultAddress')
      this.setData({ address })
    } catch (e) {
      console.error('加载地址失败:', e)
    }
  },

  calculateTotal() {
    let goodsTotal = 0
    this.data.orderItems.forEach(item => {
      goodsTotal += parseFloat(item.price) * item.quantity
    })
    const freight = goodsTotal >= 0 ? 0 : 10
    const orderTotal = goodsTotal + freight - this.data.discount
    this.setData({ goodsTotal: goodsTotal.toFixed(2), freight, orderTotal: orderTotal.toFixed(2) })
  },

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
        wx.showToast({ title: '请授权地址信息', icon: 'none' })
      }
    })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  async submitOrder() {
    const { orderItems, address, remark, orderTotal } = this.data

    if (orderItems.length === 0) {
      wx.showToast({ title: '订单商品为空', icon: 'none' })
      return
    }

    try {
      wx.showLoading({ title: '提交中...' })

      const orderNo = 'BT' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()

      const order = {
        orderNo,
        items: orderItems,
        address: address || {},
        remark,
        totalAmount: orderTotal,
        status: 'pending',
        createTime: new Date().toISOString()
      }

      await OrderService.create(order)

      const savedOrders = wx.getStorageSync('orders') || []
      savedOrders.unshift(order)
      wx.setStorageSync('orders', savedOrders)

      const cart = wx.getStorageSync('cart') || []
      const newItemIds = orderItems.map(item => item.id)
      wx.setStorageSync('cart', cart.filter(item => !newItemIds.includes(item.id)))
      wx.removeStorageSync('orderItems')

      const res = await wx.cloud.callFunction({
        name: 'wxpay_unifiedorder',
        data: { orderNo, totalAmount: orderTotal }
      })

      wx.hideLoading()

      if (res.result.code === 0) {
        const pay = res.result.data
        await wx.requestPayment({
          timeStamp: pay.timeStamp,
          nonceStr: pay.nonceStr,
          package: pay.package,
          signType: pay.signType,
          paySign: pay.paySign
        })
        wx.redirectTo({
          url: `/pages/pay-result/pay-result?orderNo=${orderNo}&amount=${orderTotal}&status=success`
        })
      } else {
        throw new Error(res.result.message || '获取支付参数失败')
      }
    } catch (e) {
      wx.hideLoading()
      if (e.errMsg && e.errMsg.includes('requestPayment:fail')) {
        wx.redirectTo({
          url: `/pages/pay-result/pay-result?orderNo=${orderNo}&amount=${orderTotal}&status=fail`
        })
      } else {
        console.error('提交订单失败:', e)
        wx.showToast({ title: '提交失败', icon: 'none' })
      }
    }
  }
})
