// 云函数数据服务（替代 Supabase）
// 所有数据通过云函数操作微信云数据库

// ===== 云函数调用封装 =====
async function api(event) {
  try {
    const res = await wx.cloud.callFunction({ name: 'api', data: event })
    if (res.result && res.result.code === 0) return res.result
    throw new Error(res.result?.message || '云函数调用失败')
  } catch (e) {
    console.warn('[api] 调用失败:', e)
    throw e
  }
}

// ===== 本地存储管理服务（降级方案） =====
const LocalService = {
  _prefix: '',
  getKey(name) { return name },
  getAll(name) { return wx.getStorageSync(this.getKey(name)) || [] },
  saveAll(name, list) { wx.setStorageSync(this.getKey(name), list) },

  async create(name, item) {
    const list = this.getAll(name)
    item.id = Date.now() + Math.random().toString(36).substr(2, 4)
    item.created_at = item.created_at || new Date().toISOString()
    list.unshift(item)
    this.saveAll(name, list)
    return item
  },

  async list(name, query = null, page = 1, pageSize = 100) {
    let list = this.getAll(name)
    if (query && query.status) {
      list = list.filter(l => l.status === query.status)
    }
    if (query && query.orderNo) {
      list = list.filter(l => l.orderNo === query.orderNo)
    }
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  },

  async listAll(name) {
    return this.getAll(name)
  },

  async update(name, query, data) {
    const list = this.getAll(name)
    const idx = list.findIndex(l => l.id === query.id || l._id === query._id || l.orderNo === query.orderNo)
    if (idx > -1) {
      list[idx] = { ...list[idx], ...data, updated_at: new Date().toISOString() }
      this.saveAll(name, list)
    }
  },

  async delete(name, query) {
    const list = this.getAll(name)
    this.saveAll(name, list.filter(l => l.id !== query.id && l._id !== query._id))
  },

  async count(name, status = null) {
    const list = this.getAll(name)
    if (status) return list.filter(l => l.status === status).length
    return list.length
  },

  async getStats() {
    const all = this.getAll('leads')
    return {
      total: all.length,
      pending: all.filter(l => l.status === 'pending').length,
      contacted: all.filter(l => l.status === 'contacted').length,
      closed: all.filter(l => l.status === 'closed').length
    }
  }
}

// ===== 带降级的数据服务工厂 =====
function createService(name) {
  return {
    async create(data) {
      return LocalService.create(name, data)
    },

    async list() {
      return LocalService.listAll(name)
    },

    async listWithPage(query = null, page = 1, pageSize = 20) {
      const data = await LocalService.list(name, query, page, pageSize)
      const total = await LocalService.count(name)
      return { data, total }
    },

    async update(query, data) {
      await LocalService.update(name, query, data)
    },

    async delete(query) {
      await LocalService.delete(name, query)
    }
  }
}

// ===== 具体服务 =====
const BaseOrderService = createService('orders')
const BaseProductService = createService('products')
const BaseLeadService = createService('leads')

// OrderService
const OrderService = {
  async create(order) {
    return BaseOrderService.create({
      ...order,
      created_at: new Date().toISOString()
    })
  },

  async list() {
    return BaseOrderService.list()
  },

  async updateStatus(orderNo, status) {
    await BaseOrderService.update({ orderNo }, { status, updated_at: new Date().toISOString() })
  }
}

// ProductService
const ProductService = {
  async list() { return BaseProductService.list() },

  async create(product) {
    return BaseProductService.create({
      ...product,
      created_at: new Date().toISOString()
    })
  },

  async update(id, data) {
    await BaseProductService.update({ _id: id }, { ...data, updated_at: new Date().toISOString() })
  },

  async delete(id) {
    await BaseProductService.delete({ _id: id })
  }
}

// LeadService
const LeadService = {
  async create(data) {
    return BaseLeadService.create({
      ...data,
      status: 'pending',
      created_at: new Date().toISOString()
    })
  },

  async list(status = null, page = 1, pageSize = 20) {
    const query = status && status !== 'all' ? { status } : null
    const res = await BaseLeadService.listWithPage(query, page, pageSize)
    return res.data
  },

  async count(status = null) {
    try {
      const res = await BaseLeadService.listWithPage(status ? { status } : null, 1, 1)
      return res.total
    } catch {
      return LocalService.count('leads', status)
    }
  },

  async getStats() {
    try {
      const res = await api({ collection: 'leads', action: 'getStats' })
      return res.data
    } catch {
      return LocalService.getStats()
    }
  },

  async updateStatus(id, status) {
    await BaseLeadService.update({ _id: id }, { status, updated_at: new Date().toISOString() })
  },

  async delete(id) {
    await BaseLeadService.delete({ _id: id })
  }
}

// AdminService（本地存储，无需云函数）
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

async function heartbeat() {
  console.log('[Heartbeat] 本地模式')
  return true
}

module.exports = {
  OrderService,
  ProductService,
  LeadService,
  AdminService,
  heartbeat
}
