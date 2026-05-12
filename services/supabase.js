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

// 客户线索服务
const LeadService = {
  // 创建线索
  async create(lead) {
    return request('/customers', 'POST', {
      ...lead,
      status: 'pending',
      created_at: new Date().toISOString()
    })
  },

  // 获取线索列表
  async list(status = null, page = 1, pageSize = 20) {
    let url = `/customers?select=*&order=created_at.desc&limit=${pageSize}&offset=${(page - 1) * pageSize}`
    if (status && status !== 'all') {
      url += `&status=eq.${status}`
    }
    return request(url)
  },

  // 获取线索总数
  async count(status = null) {
    let url = '/customers?select=count'
    if (status) {
      url += `&status=eq.${status}`
    }
    const result = await request(url)
    return result[0]?.count || 0
  },

  // 更新线索状态
  async updateStatus(id, status) {
    return request(`/customers?id=eq.${id}`, 'PATCH', {
      status,
      updated_at: new Date().toISOString()
    })
  },

  // 删除线索
  async delete(id) {
    return request(`/customers?id=eq.${id}`, 'DELETE')
  },

  // 获取统计
  async getStats() {
    const [total, pending, contacted, closed] = await Promise.all([
      this.count(),
      this.count('pending'),
      this.count('contacted'),
      this.count('closed')
    ])
    return { total, pending, contacted, closed }
  }
}

module.exports = {
  LeadService
}
