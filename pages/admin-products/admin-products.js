const { AdminService } = require('../../services/supabase.js')

Page({
  data: {
    products: [],
    searchKeyword: '',
    categories: ['全部', '商标服务', '公司注册', '数字化', '专利服务', '课程工具'],
    showModal: false,
    isEdit: false,
    editId: null,
    form: {
      name: '',
      slogan: '',
      price: '',
      originalPrice: '',
      category: 0,
      spec: '',
      badge: '',
      promo: '',
      image: '/images/zh/banner1.png',
      tags: []
    }
  },

  onLoad() {
    if (!AdminService.checkLogin()) {
      wx.redirectTo({ url: '/pages/admin/admin' })
      return
    }
    this.loadProducts()
  },

  onShow() {
    this.loadProducts()
  },

  // 加载商品列表
  loadProducts() {
    const products = wx.getStorageSync('products') || this.getDefaultProducts()
    this.setData({ products })
  },

  // 默认商品数据
  getDefaultProducts() {
    const defaultProducts = [
      {
        id: 1,
        name: '商标注册套餐',
        slogan: '【品牌保护首选】',
        spec: '含查询+分类+递交全流程',
        image: '/images/zh/banner1.png',
        badge: 'HOT',
        promo: '限时优惠 立减¥200',
        price: '1280',
        originalPrice: '1480',
        tags: ['三语言', '顾问代办'],
        category: 1
      },
      {
        id: 2,
        name: '商标设计服务',
        slogan: '【融合哈萨克文化】',
        spec: '品牌命名+Logo设计',
        image: '/images/zh/banner2.png',
        badge: '新品',
        promo: '',
        price: '2680',
        originalPrice: '',
        tags: ['原创设计', '三语言'],
        category: 1
      },
      {
        id: 3,
        name: '中国公司注册',
        slogan: '【一站式代办】',
        spec: '营业执照+税务登记+银行开户',
        image: '/images/zh/banner3.png',
        badge: '',
        promo: '买1享3 赠记账3个月',
        price: '3980',
        originalPrice: '5680',
        tags: ['全程代办', '透明报价'],
        category: 2
      }
    ]
    wx.setStorageSync('products', defaultProducts)
    return defaultProducts
  },

  // 搜索
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  handleSearch() {
    const { searchKeyword } = this.data
    const allProducts = wx.getStorageSync('products') || []
    
    if (!searchKeyword) {
      this.setData({ products: allProducts })
      return
    }

    const filtered = allProducts.filter(p => 
      p.name.includes(searchKeyword) || 
      p.slogan.includes(searchKeyword)
    )
    this.setData({ products: filtered })
  },

  // 显示添加弹窗
  showAddModal() {
    this.setData({
      showModal: true,
      isEdit: false,
      editId: null,
      form: {
        name: '',
        slogan: '',
        price: '',
        originalPrice: '',
        category: 0,
        spec: '',
        badge: '',
        promo: '',
        image: '/images/zh/banner1.png',
        tags: []
      }
    })
  },

  // 编辑商品
  editProduct(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showModal: true,
      isEdit: true,
      editId: item.id,
      form: {
        name: item.name,
        slogan: item.slogan || '',
        price: item.price,
        originalPrice: item.originalPrice || '',
        category: item.category,
        spec: item.spec || '',
        badge: item.badge || '',
        promo: item.promo || '',
        image: item.image,
        tags: item.tags || []
      }
    })
  },

  // 删除商品
  deleteProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          let products = wx.getStorageSync('products') || []
          products = products.filter(p => p.id !== id)
          wx.setStorageSync('products', products)
          this.loadProducts()
          wx.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({ showModal: false })
  },

  // 表单输入
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({ [`form.${field}`]: value })
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({ 'form.category': parseInt(e.detail.value) })
  },

  // 保存商品
  saveProduct() {
    const { form, isEdit, editId } = this.data

    if (!form.name || !form.price) {
      wx.showToast({ title: '请填写商品名称和价格', icon: 'none' })
      return
    }

    let products = wx.getStorageSync('products') || []

    if (isEdit) {
      // 更新
      const index = products.findIndex(p => p.id === editId)
      if (index > -1) {
        products[index] = { ...products[index], ...form, id: editId }
      }
    } else {
      // 新增
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1
      products.push({
        ...form,
        id: newId,
        tags: form.tags.length > 0 ? form.tags : ['热销']
      })
    }

    wx.setStorageSync('products', products)
    this.setData({ showModal: false })
    this.loadProducts()
    wx.showToast({ title: isEdit ? '更新成功' : '添加成功', icon: 'success' })
  }
})
