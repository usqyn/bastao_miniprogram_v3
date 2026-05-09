const { applyLang, changeLang } = require('../../i18n.js')

Page({
  data: {
    lang: 'zh',
    t: {},
    cartItems: [],
    allSelected: false,
    selectedCount: 0,
    totalPrice: 0
  },

  onLoad() {
    applyLang(this)
    this.loadCart()
  },

  onShow() {
    applyLang(this)
    this.loadCart()
  },

  changeLang(e) {
    changeLang(this, e.currentTarget.dataset.lang)
  },

  // 加载购物车数据
  loadCart() {
    const cart = wx.getStorageSync('cart') || []
    this.setData({ cartItems: cart })
    this.calculateTotal()
  },

  // 保存购物车数据
  saveCart() {
    wx.setStorageSync('cart', this.data.cartItems)
    this.calculateTotal()
  },

  // 计算总价
  calculateTotal() {
    const { cartItems } = this.data
    let totalPrice = 0
    let selectedCount = 0
    let allSelected = cartItems.length > 0

    cartItems.forEach(item => {
      if (item.selected) {
        totalPrice += parseFloat(item.price) * item.quantity
        selectedCount += item.quantity
      } else {
        allSelected = false
      }
    })

    this.setData({
      totalPrice: totalPrice.toFixed(2),
      selectedCount,
      allSelected
    })
  },

  // 切换选中
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const cartItems = this.data.cartItems.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    this.setData({ cartItems })
    this.saveCart()
  },

  // 全选
  toggleAllSelect() {
    const allSelected = !this.data.allSelected
    const cartItems = this.data.cartItems.map(item => ({
      ...item,
      selected: allSelected
    }))
    this.setData({ cartItems, allSelected })
    this.saveCart()
  },

  // 减少数量
  decreaseQty(e) {
    const id = e.currentTarget.dataset.id
    const cartItems = this.data.cartItems.map(item => {
      if (item.id === id && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 }
      }
      return item
    })
    this.setData({ cartItems })
    this.saveCart()
  },

  // 增加数量
  increaseQty(e) {
    const id = e.currentTarget.dataset.id
    const cartItems = this.data.cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: item.quantity + 1 }
      }
      return item
    })
    this.setData({ cartItems })
    this.saveCart()
  },

  // 删除商品
  removeItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          const cartItems = this.data.cartItems.filter(item => item.id !== id)
          this.setData({ cartItems })
          this.saveCart()
        }
      }
    })
  },

  // 去购物
  goShop() {
    wx.switchTab({ url: '/pages/services/services' })
  },

  // 去结算
  goCheckout() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }

    const selectedItems = this.data.cartItems.filter(item => item.selected)
    wx.setStorageSync('orderItems', selectedItems)
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm' })
  }
})
