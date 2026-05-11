const { applyLang, changeLang } = require('../../i18n.js')

Page({
  data: {
    lang: 'zh',
    t: {},
    rtl: false,
    activeCategory: 0,
    filteredProducts: [],
    cartCount: 0,
    cartTotal: '0.00'
  },

  onLoad() {
    applyLang(this)
    this.updateFilteredProducts()
    this.updateCartInfo()
  },

  onShow() {
    applyLang(this)
    this.updateFilteredProducts()
    this.updateCartInfo()
  },

  changeLang(e) {
    changeLang(this, e.currentTarget.dataset.lang)
    this.updateFilteredProducts()
  },

  updateFilteredProducts() {
    const t = this.data.t
    const products = t.products || []
    const activeCategory = this.data.activeCategory

    let filtered = products
    if (activeCategory > 0) {
      filtered = products.filter(p => p.category === activeCategory)
    }

    this.setData({ filteredProducts: filtered })
  },

  // 更新购物车信息
  updateCartInfo() {
    const cart = wx.getStorageSync('cart') || []
    let cartCount = 0
    let cartTotal = 0

    cart.forEach(item => {
      cartCount += item.quantity
      cartTotal += parseFloat(item.price) * item.quantity
    })

    this.setData({
      cartCount,
      cartTotal: cartTotal.toFixed(2)
    })
  },

  // 切换分类
  switchCategory(e) {
    const index = e.currentTarget.dataset.index
    const t = this.data.t
    const products = t.products || []
    const categories = t.categories || []

    let filtered = products
    if (index > 0 && index < categories.length) {
      filtered = products.filter(p => p.category === index)
    }

    this.setData({
      activeCategory: index,
      filteredProducts: filtered
    })
  },

  // 查看商品详情
  viewProduct(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: item.name,
      content: `${item.slogan || ''}\n价格: ¥${item.price}\n${item.spec || ''}`,
      confirmText: '加入购物车',
      success: (res) => {
        if (res.confirm) {
          this.addToCart({ currentTarget: { dataset: { item } } })
        }
      }
    })
  },

  // 加入购物车
  addToCart(e) {
    const product = e.currentTarget.dataset.item
    const cart = wx.getStorageSync('cart') || []

    // 查找是否已存在
    const existIndex = cart.findIndex(item => item.id === product.id)

    if (existIndex > -1) {
      cart[existIndex].quantity += 1
    } else {
      cart.push({
        ...product,
        quantity: 1,
        selected: true
      })
    }

    wx.setStorageSync('cart', cart)
    this.updateCartInfo()

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  // 去购物车
  goCart() {
    wx.navigateTo({ url: '/pages/cart/cart' })
  },

  // 去结算
  goCheckout() {
    const cart = wx.getStorageSync('cart') || []
    const selectedItems = cart.filter(item => item.selected)

    if (selectedItems.length === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }

    wx.setStorageSync('orderItems', selectedItems)
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm' })
  },

  // 去咨询（保留原功能）
  goConsult(e) {
    const name = e.currentTarget.dataset.name || ''
    wx.switchTab({ url: '/pages/consult/consult' })
  }
})
