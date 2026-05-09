// Supabase 服务封装
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../config/supabase.js')

// 简单的 HTTP 请求封装
function request(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${SUPABASE_URL}/rest/v1${url}`,
      method,
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...headers
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`))
        }
      },
      fail: reject
    }
    
    if (data) {
      options.data = JSON.stringify(data)
    }
    
    wx.request(options)
  })
}

// 商品服务
const ProductService = {
  // 获取商品列表
  async getProducts(category = null) {
    let url = '/products?select=*&order=created_at.desc'
    if (category) {
      url += `&category=eq.${category}`
    }
    return request(url)
  },

  // 获取单个商品
  async getProduct(id) {
    return request(`/products?id=eq.${id}&select=*`)
  },

  // 创建商品
  async createProduct(product) {
    return request('/products', 'POST', product)
  },

  // 更新商品
  async updateProduct(id, product) {
    return request(`/products?id=eq.${id}`, 'PATCH', product)
  },

  // 删除商品
  async deleteProduct(id) {
    return request(`/products?id=eq.${id}`, 'DELETE')
  }
}

// 订单服务
const OrderService = {
  // 获取订单列表
  async getOrders(status = null, page = 1, limit = 20) {
    let url = `/orders?select=*,order_items(*)&order=created_at.desc&limit=${limit}&offset=${(page - 1) * limit}`
    if (status) {
      url += `&status=eq.${status}`
    }
    return request(url)
  },

  // 获取单个订单
  async getOrder(orderNo) {
    return request(`/orders?order_no=eq.${orderNo}&select=*,order_items(*)`)
  },

  // 创建订单
  async createOrder(order) {
    return request('/orders', 'POST', order)
  },

  // 更新订单状态
  async updateOrderStatus(orderNo, status) {
    return request(`/orders?order_no=eq.${orderNo}`, 'PATCH', { status, updated_at: new Date().toISOString() })
  },

  // 获取订单统计
  async getOrderStats() {
    return request('/rpc/get_order_stats', 'POST')
  }
}

// 管理员服务
const AdminService = {
  // 管理员登录
  async login(username, password) {
    // 这里应该调用 Supabase Auth 或自定义验证
    // 简化版本：检查本地存储的管理员凭证
    const adminUsers = wx.getStorageSync('admin_users') || []
    const user = adminUsers.find(u => u.username === username && u.password === password)
    if (user) {
      wx.setStorageSync('admin_token', 'mock_token_' + Date.now())
      return { success: true, user }
    }
    throw new Error('用户名或密码错误')
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('admin_token')
    return !!token
  },

  // 退出登录
  logout() {
    wx.removeStorageSync('admin_token')
  }
}

module.exports = {
  ProductService,
  OrderService,
  AdminService
}
