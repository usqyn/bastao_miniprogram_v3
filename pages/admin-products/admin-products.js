const { AdminService, ProductService } = require('../../services/supabase.js')

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
      image: '/images/zh/banner1.jpg',
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

  async loadProducts() {
    try {
      const products = await ProductService.list()
      this.setData({ products })
    } catch (e) {
      console.error('加载商品失败:', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  async handleSearch() {
    const { searchKeyword } = this.data
    const allProducts = await ProductService.list()
    if (!searchKeyword) {
      this.setData({ products: allProducts })
      return
    }
    const filtered = allProducts.filter(p => 
      p.name.includes(searchKeyword) || 
      (p.slogan || '').includes(searchKeyword)
    )
    this.setData({ products: filtered })
  },

  showAddModal() {
    this.setData({
      showModal: true,
      isEdit: false,
      editId: null,
      form: {
        name: '', slogan: '', price: '', originalPrice: '',
        category: 0, spec: '', badge: '', promo: '',
        image: '/images/zh/banner1.jpg', tags: []
      }
    })
  },

  editProduct(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showModal: true, isEdit: true, editId: item.id,
      form: {
        name: item.name, slogan: item.slogan || '', price: item.price,
        originalPrice: item.originalPrice || '', category: item.category,
        spec: item.spec || '', badge: item.badge || '', promo: item.promo || '',
        image: item.image, tags: item.tags || []
      }
    })
  },

  deleteProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定删除该商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await ProductService.delete(id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadProducts()
          } catch (e) {
            console.error('删除失败:', e)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onCategoryChange(e) {
    this.setData({ 'form.category': parseInt(e.detail.value) })
  },

  async saveProduct() {
    const { form, isEdit, editId } = this.data
    if (!form.name || !form.price) {
      wx.showToast({ title: '请填写商品名称和价格', icon: 'none' })
      return
    }

    try {
      if (isEdit) {
        await ProductService.update(editId, form)
      } else {
        await ProductService.create({
          ...form,
          tags: form.tags.length > 0 ? form.tags : ['热销']
        })
      }
      this.setData({ showModal: false })
      this.loadProducts()
      wx.showToast({ title: isEdit ? '更新成功' : '添加成功', icon: 'success' })
    } catch (e) {
      console.error('保存失败:', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})
