// 客户线索管理页面
const { LeadService } = require('../../services/supabase.js')

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
    ],

    // 新增线索弹窗
    showCreateModal: false,
    createForm: {
      name: '',
      phone: '',
      wechat: '',
      type: '',
      content: ''
    }
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
  async handleLogin() {
    const { username, password } = this.data

    if (!username || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    const { AdminService } = require('../../services/supabase.js')
    try {
      await AdminService.login(username, password)
      this.setData({ isLoggedIn: true, loading: false })
      this.loadData()
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: e.message || '账号或密码错误', icon: 'none' })
    }
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
  async loadData() {
    wx.showLoading({ title: '加载中...' })

    try {
      const { activeFilter, currentPage, pageSize } = this.data

      // 获取线索列表
      const leads = await LeadService.list(activeFilter, currentPage, pageSize)

      // 获取统计
      const stats = await LeadService.getStats()
      const totalCount = stats.total
      const totalPages = Math.ceil(totalCount / pageSize) || 1

      // 处理数据
      const statusLabels = {
        'pending': '新线索',
        'contacted': '已联系',
        'closed': '已关闭'
      }

      const processedLeads = leads.map((item, index) => ({
        ...item,
        id: item.id,
        _id: item.id,
        index: totalCount - (currentPage - 1) * pageSize - index,
        timeStr: this.formatTime(item.created_at),
        statusLabel: statusLabels[item.status] || item.status,
        statusIndex: this.data.statusOptions.findIndex(s => s.value === item.status),
        selected: false
      }))

      this.setData({
        leads: processedLeads,
        stats,
        totalCount,
        totalPages,
        allSelected: false
      })

    } catch (err) {
      console.error('加载数据失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
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
      if (item.id === id) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    const allSelected = leads.every(item => item.selected)
    this.setData({ leads, allSelected })
  },

  // 修改状态
  async changeStatus(e) {
    const id = e.currentTarget.dataset.id
    const index = parseInt(e.detail.value)
    const newStatus = this.data.statusOptions[index].value

    try {
      await LeadService.updateStatus(id, newStatus)
      wx.showToast({ title: '状态已更新', icon: 'success' })
      this.loadData()
    } catch (err) {
      console.error('更新状态失败:', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    }
  },

  // 删除线索
  deleteLead(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await LeadService.delete(id)
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadData()
          } catch (err) {
            console.error('删除失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  noop() {},

  // 格式化时间
  formatTime(isoString) {
    if (!isoString) return '—'
    const d = new Date(isoString)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${min}`
  },

  // 新增线索弹窗
  showCreate() {
    this.setData({
      showCreateModal: true,
      createForm: { name: '', phone: '', wechat: '', type: '', content: '' }
    })
  },

  hideCreate() {
    this.setData({ showCreateModal: false })
  },

  onCreateField(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`createForm.${field}`]: e.detail.value })
  },

  async submitCreate() {
    const { name, phone } = this.data.createForm
    if (!name || !phone) {
      wx.showToast({ title: '请填写姓名和电话', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    try {
      await LeadService.create(this.data.createForm)
      wx.showToast({ title: '添加成功', icon: 'success' })
      this.setData({ showCreateModal: false })
      this.loadData()
    } catch (err) {
      console.error('添加失败:', err)
      wx.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
