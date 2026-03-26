// pages/favorite/index.js - 我的收藏页面
const app = getApp()

Page({
  data: {
    favorites: [],
    loading: true,
    page: 1,
    pageSize: 20,
    total: 0
  },

  onLoad() {
    // 检查登录状态
    const app = getApp()
    if (!app.requireLogin()) {
      return
    }
    this.loadFavorites()
  },

  onShow() {
    // 检查登录状态
    const app = getApp()
    if (!app.isLogged()) {
      return
    }
    this.loadFavorites()
  },

  async loadFavorites() {
    try {
      this.setData({ loading: true })

      const result = await wx.cloud.callFunction({
        name: 'getUserFavorites',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      })

      if (result.result && result.result.success) {
        const favorites = (result.result.data.favorites || []).map(item => ({
          ...item,
          formattedTime: this.formatTime(item.created_at)
        }))
        this.setData({
          favorites,
          total: result.result.data.total || 0,
          loading: false
        })
      }
    } catch (err) {
      console.error('加载收藏失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  loadMore() {
    if (this.data.loading) return

    this.setData({
      page: this.data.page + 1,
      loading: true
    })
    this.loadFavorites()
  },

  formatTime(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前'
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前'
    } else if (diff < 7 * day) {
      return Math.floor(diff / day) + '天前'
    } else {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  },

  async removeFavorite(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'removeFromFavorites',
              data: {
                content_id: id
              }
            })

            if (result.result && result.result.success) {
              wx.showToast({
                title: '已取消收藏',
                icon: 'success'
              })
              this.loadFavorites()
            }
          } catch (err) {
            console.error('取消收藏失败:', err)
            wx.showToast({
              title: '操作失败',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
