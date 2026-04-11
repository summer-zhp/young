// packageB/pages/memory-wall/index.js
const { cloud } = require('../../../utils/cloud')

const app = getApp()

Page({
  data: {
    memories: [],
    loading: true,
    hasMore: true,
    page: 1,
    // 详情弹窗
    showDetail: false,
    currentMemory: null,
    // 图片预览
    previewUrls: []
  },

  onLoad() {
    this.loadMemories()
  },

  onShow() {
    if (this._needRefresh) {
      this.setData({ page: 1, memories: [], hasMore: true })
      this.loadMemories()
      this._needRefresh = false
    }
  },

  onUnload() {
    this._needRefresh = false
  },

  async loadMemories() {
    if (this._loading) return
    this._loading = true

    try {
      const res = await cloud.callFunction('getMemories', {
        page: this.data.page,
        pageSize: 10
      })

      if (res.success) {
        const list = res.data.list.map(item => ({
          ...item,
          displayTime: this.formatTime(item.createdAt)
        }))

        this.setData({
          memories: this.data.page === 1 ? list : [...this.data.memories, ...list],
          hasMore: res.data.hasMore,
          loading: false
        })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载纪念列表失败:', err)
      this.setData({ loading: false })
    }

    this._loading = false
  },

  loadMore() {
    if (!this.data.hasMore || this._loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadMemories()
  },

  showDetail(e) {
    const { index } = e.currentTarget.dataset
    const memory = this.data.memories[index]
    const previewUrls = memory.images || []

    this.setData({
      showDetail: true,
      currentMemory: memory,
      previewUrls
    })
  },

  hideDetail() {
    this.setData({ showDetail: false, currentMemory: null })
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset
    const urls = this.data.currentMemory ? (this.data.currentMemory.images || []) : []
    wx.previewImage({
      current: url,
      urls
    })
  },

  previewImageFromCard(e) {
    const { url, index } = e.currentTarget.dataset
    const memory = this.data.memories[index]
    wx.previewImage({
      current: url,
      urls: memory.images || []
    })
  },

  confirmDelete() {
    wx.showModal({
      title: '删除纪念',
      content: '确定要删除这条纪念吗？删除后不可恢复',
      confirmColor: '#F44336',
      success: async (res) => {
        if (res.confirm) {
          await this.deleteMemory()
        }
      }
    })
  },

  async deleteMemory() {
    if (!this.data.currentMemory) return

    wx.showLoading({ title: '删除中...' })

    try {
      const res = await cloud.callFunction('deleteMemory', {
        memoryId: this.data.currentMemory._id
      })

      wx.hideLoading()

      if (res.success) {
        wx.showToast({ title: '已删除', icon: 'success' })
        this.setData({ showDetail: false, currentMemory: null })
        // 刷新列表
        this.setData({ page: 1, memories: [], hasMore: true })
        this.loadMemories()
      } else {
        wx.showToast({ title: res.error || '删除失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  goToAdd() {
    this._needRefresh = true
    wx.navigateTo({ url: './add' })
  },

  /**
   * 格式化时间为友好文本
   */
  formatTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now - d

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) return '刚刚'
    if (diff < hour) return Math.floor(diff / minute) + '分钟前'
    if (diff < day) return Math.floor(diff / hour) + '小时前'
    if (diff < 2 * day) return '昨天'
    if (diff < 30 * day) return Math.floor(diff / day) + '天前'

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dayStr = String(d.getDate()).padStart(2, '0')

    if (year === now.getFullYear()) {
      return `${month}月${dayStr}日`
    }
    return `${year}年${month}月${dayStr}日`
  },

  onShareAppMessage() {
    return {
      title: '时光纪念墙 - 记录每一个值得珍藏的时刻',
      path: '/pages/toolbox/toolbox'
    }
  }
})
