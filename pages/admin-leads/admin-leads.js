// 客户线索管理页面
const db = wx.cloud.database()

Page({
  data: {
    // 登录状态
    isLoggedIn: false,
    username: '',
    password: '',
    loading: false,
    
    // 线索数据
    leads: [],
    stats: {
      total: 0,
      pending: 0,
      contacted: 0,
      closed: 0
    },
    
    // 筛选和分页
    activeFilter: 'all',
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalCount: 0,
    
    // 选择状态
    allSelected: false,
    
    // 状态选项
    statusOptions: [
      { value: 'pending', label: '新线索' },
      { value: 'contacted', label: '已联系' },
      { value: 'closed', label: '已关闭' }
    ]
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    if (this.data.isLoggedIn) {
      this.loadData()
    }
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('admin_token')
    if (token) {
      this.setData({ isLoggedIn: true })
      this.loadData()
    }
  },

  // 登录输入
  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  // 登录
  handleLogin() {
    const { username, password } = this.data

    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    // 简单验证
    setTimeout(() => {
      if (username === 'admin' && password === '123456') {
        wx.setStorageSync('admin_token', 'token_' + Date.now())
        this.setData({ isLoggedIn: true, loading: false })
        this.loadData()
        wx.showToast({ title: '登录成功', icon: 'success' })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '账号或密码错误', icon: 'none' })
      }
    }, 500)
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('admin_token')
          this.setData({ isLoggedIn: false, leads: [] })
        }
      }
    })
  },

  // 加载数据
  loadData() {
    wx.showLoading({ title: '加载中...' })

    const { activeFilter, currentPage, pageSize } = this.data

    // 构建查询
    let query = db.collection('customers')
    if (activeFilter !== 'all') {
      query = query.where({ status: activeFilter })
    }

    // 获取总数
    query.count().then(countRes => {
      const totalCount = countRes.total
      const totalPages = Math.ceil(totalCount / pageSize) || 1

      // 获取数据
      const skip = (currentPage - 1) * pageSize
      db.collection('customers')
        .where(activeFilter === 'all' ? {} : { status: activeFilter })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()
        .then(dataRes => {
          // 处理数据
          const statusLabels = {
            'pending': '新线索',
            'contacted': '已联系',
            'closed': '已关闭'
          }

          const leads = dataRes.data.map((item, index) => ({
            ...item,
            index: totalCount - skip - index,
            timeStr: this.formatTime(item.createdAt),
            statusLabel: statusLabels[item.status] || item.status,
            statusIndex: this.data.statusOptions.findIndex(s => s.value === item.status),
            selected: false
          }))

          this.setData({
            leads,
            totalCount,
            totalPages,
            allSelected: false
          })

          // 加载统计
          this.loadStats()
          wx.hideLoading()
        })
        .catch(err => {
          console.error('获取数据失败:', err)
          wx.hideLoading()
          wx.showToast({ title: '加载失败', icon: 'none' })
        })
    }).catch(err => {
      console.error('获取总数失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 加载统计数据
  loadStats() {
    Promise.all([
      db.collection('customers').count(),
      db.collection('customers').where({ status: 'pending' }).count(),
      db.collection('customers').where({ status: 'contacted' }).count(),
      db.collection('customers').where({ status: 'closed' }).count()
    ]).then(([total, pending, contacted, closed]) => {
      this.setData({
        stats: {
          total: total.total,
          pending: pending.total,
          contacted: contacted.total,
          closed: closed.total
        }
      })
    }).catch(err => {
      console.error('加载统计失败:', err)
    })
  },

  // 刷新数据
  refreshData() {
    this.loadData()
  },

  // 筛选状态
  filterByStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ activeFilter: status, currentPage: 1 })
    this.loadData()
  },

  // 上一页
  prevPage() {
    if (this.data.currentPage > 1) {
      this.setData({ currentPage: this.data.currentPage - 1 })
      this.loadData()
    }
  },

  // 下一页
  nextPage() {
    if (this.data.currentPage < this.data.totalPages) {
      this.setData({ currentPage: this.data.currentPage + 1 })
      this.loadData()
    }
  },

  // 全选
  toggleSelectAll() {
    const allSelected = !this.data.allSelected
    const leads = this.data.leads.map(item => ({ ...item, selected: allSelected }))
    this.setData({ leads, allSelected })
  },

  // 单选
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id
    const leads = this.data.leads.map(item => {
      if (item._id === id) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    const allSelected = leads.every(item => item.selected)
    this.setData({ leads, allSelected })
  },

  // 修改状态
  changeStatus(e) {
    const id = e.currentTarget.dataset.id
    const index = parseInt(e.detail.value)
    const newStatus = this.data.statusOptions[index].value

    db.collection('customers').doc(id).update({
      data: { status: newStatus }
    }).then(() => {
      wx.showToast({ title: '状态已更新', icon: 'success' })
      this.loadData()
    }).catch(err => {
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  // 删除线索
  deleteLead(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          db.collection('customers').doc(id).remove().then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadData()
          }).catch(err => {
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 格式化时间
  formatTime(date) {
    if (!date) return '—'
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${min}`
  }
})
