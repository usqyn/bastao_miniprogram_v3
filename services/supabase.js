// Supabase 服务封装
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('../config/supabase.js')

// HTTP 请求封装
function request(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${SUPABASE_URL}/rest/v1${url}`,
      method,
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : ''
      },
      data: data ? JSON.stringify(data) : null,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`))
        }
      },
      fail: reject
    })
  })
}

// Supabase 心跳保活（防止免费版项目被暂停）
async function heartbeat() {
  try {
    await request('/customers?select=id&limit=1', 'GET')
    console.log('[Supabase Heartbeat] OK')
    return true
  } catch (e) {
    console.warn('[Supabase Heartbeat] 失败:', e.message)
    return false
  }
}

// 本地存储管理服务（Supabase 不可用时的降级方案）
const LocalLeadService = {
  getAll() {
    return wx.getStorageSync('leads') || []
  },
  saveAll(leads) {
    wx.setStorageSync('leads', leads)
  },

  async create(lead) {
    const leads = this.getAll()
    leads.unshift({
      id: Date.now(),
      ...lead,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    this.saveAll(leads)
    return leads[0]
  },

  async list(status = null, page = 1, pageSize = 20) {
    let leads = this.getAll()
    if (status && status !== 'all') {
      leads = leads.filter(l => l.status === status)
    }
    const start = (page - 1) * pageSize
    return leads.slice(start, start + pageSize)
  },

  async count(status = null) {
    let leads = this.getAll()
    if (status) {
      leads = leads.filter(l => l.status === status)
    }
    return leads.length
  },

  async getStats() {
    const all = this.getAll()
    return {
      total: all.length,
      pending: all.filter(l => l.status === 'pending').length,
      contacted: all.filter(l => l.status === 'contacted').length,
      closed: all.filter(l => l.status === 'closed').length
    }
  },

  async updateStatus(id, status) {
    const leads = this.getAll()
    const idx = leads.findIndex(l => l.id === id)
    if (idx > -1) {
      leads[idx].status = status
      leads[idx].updated_at = new Date().toISOString()
      this.saveAll(leads)
    }
  },

  async delete(id) {
    const leads = this.getAll().filter(l => l.id !== id)
    this.saveAll(leads)
  }
}

// 管理员服务（基于本地存储）
const AdminService = {
  login(username, password) {
    return new Promise((resolve, reject) => {
      const users = wx.getStorageSync('admin_users') || []
      const user = users.find(u => u.username === username && u.password === password)
      if (user) {
        wx.setStorageSync('admin_token', 'token_' + Date.now())
        wx.setStorageSync('admin_user', user)
        resolve(user)
      } else {
        reject(new Error('账号或密码错误'))
      }
    })
  },

  checkLogin() {
    return !!wx.getStorageSync('admin_token')
  },

  logout() {
    wx.removeStorageSync('admin_token')
    wx.removeStorageSync('admin_user')
  }
}

// 带自动降级的线索服务（优先 Supabase，失败时用本地存储）
const LeadService = {
  async _withFallback(supabaseFn, localFn) {
    try {
      return await supabaseFn()
    } catch {
      console.warn('[LeadService] Supabase 不可用，使用本地存储')
      return localFn()
    }
  },

  async create(lead) {
    return this._withFallback(
      () => request('/customers', 'POST', { ...lead, status: 'pending', created_at: new Date().toISOString() }),
      () => LocalLeadService.create(lead)
    )
  },

  async list(status = null, page = 1, pageSize = 20) {
    return this._withFallback(
      () => {
        let url = `/customers?select=*&order=created_at.desc&limit=${pageSize}&offset=${(page - 1) * pageSize}`
        if (status && status !== 'all') url += `&status=eq.${status}`
        return request(url)
      },
      () => LocalLeadService.list(status, page, pageSize)
    )
  },

  async count(status = null) {
    return this._withFallback(
      () => {
        let url = '/customers?select=count'
        if (status) url += `&status=eq.${status}`
        return request(url).then(r => r[0]?.count || 0)
      },
      () => LocalLeadService.count(status)
    )
  },

  async updateStatus(id, status) {
    return this._withFallback(
      () => request(`/customers?id=eq.${id}`, 'PATCH', { status, updated_at: new Date().toISOString() }),
      () => LocalLeadService.updateStatus(id, status)
    )
  },

  async delete(id) {
    return this._withFallback(
      () => request(`/customers?id=eq.${id}`, 'DELETE'),
      () => LocalLeadService.delete(id)
    )
  },

  async getStats() {
    return this._withFallback(
      async () => {
        const [total, pending, contacted, closed] = await Promise.all([
          this.count(),
          this.count('pending'),
          this.count('contacted'),
          this.count('closed')
        ])
        return { total, pending, contacted, closed }
      },
      () => LocalLeadService.getStats()
    )
  }
}

// ===== 本地存储降级：商品管理 =====
const LocalProductService = {
  getAll() { return wx.getStorageSync('products') || [] },
  saveAll(list) { wx.setStorageSync('products', list) },

  async list() { return this.getAll() },
  async create(product) {
    const list = this.getAll()
    const id = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1
    product.id = id
    list.push(product)
    this.saveAll(list)
    return product
  },
  async update(id, data) {
    const list = this.getAll()
    const idx = list.findIndex(p => p.id === id)
    if (idx > -1) { list[idx] = { ...list[idx], ...data }; this.saveAll(list) }
  },
  async delete(id) {
    this.saveAll(this.getAll().filter(p => p.id !== id))
  }
}

// ===== 带自动降级的商品服务 =====
const ProductService = {
  async _withFallback(supabaseFn, localFn) {
    try { return await supabaseFn() } catch { console.warn('[ProductService] 降级本地'); return localFn() }
  },

  async list() {
    return this._withFallback(
      () => request('/products?select=*&order=id.asc'),
      () => LocalProductService.list()
    )
  },
  async create(product) {
    return this._withFallback(
      () => request('/products', 'POST', { ...product, created_at: new Date().toISOString() }),
      () => LocalProductService.create(product)
    )
  },
  async update(id, data) {
    return this._withFallback(
      () => request(`/products?id=eq.${id}`, 'PATCH', { ...data, updated_at: new Date().toISOString() }),
      () => LocalProductService.update(id, data)
    )
  },
  async delete(id) {
    return this._withFallback(
      () => request(`/products?id=eq.${id}`, 'DELETE'),
      () => LocalProductService.delete(id)
    )
  }
}

// ===== 本地存储降级：订单管理 =====
const LocalOrderService = {
  getAll() { return wx.getStorageSync('orders') || [] },
  saveAll(list) { wx.setStorageSync('orders', list) },

  async list() { return this.getAll() },
  async create(order) {
    const list = this.getAll()
    list.unshift(order)
    this.saveAll(list)
    return order
  },
  async updateStatus(orderNo, status) {
    const list = this.getAll()
    const idx = list.findIndex(o => o.orderNo === orderNo)
    if (idx > -1) { list[idx].status = status; list[idx].updated_at = new Date().toISOString(); this.saveAll(list) }
  }
}

// ===== 带自动降级的订单服务 =====
const OrderService = {
  async _withFallback(supabaseFn, localFn) {
    try { return await supabaseFn() } catch { console.warn('[OrderService] 降级本地'); return localFn() }
  },

  async list() {
    return this._withFallback(
      () => request('/orders?select=*&order=created_at.desc'),
      () => LocalOrderService.list()
    )
  },
  async create(order) {
    return this._withFallback(
      () => request('/orders', 'POST', { ...order, created_at: new Date().toISOString() }),
      () => LocalOrderService.create(order)
    )
  },
  async updateStatus(orderNo, status) {
    return this._withFallback(
      () => request(`/orders?orderNo=eq.${orderNo}`, 'PATCH', { status, updated_at: new Date().toISOString() }),
      () => LocalOrderService.updateStatus(orderNo, status)
    )
  }
}

module.exports = {
  LeadService,
  AdminService,
  ProductService,
  OrderService,
  heartbeat
}
