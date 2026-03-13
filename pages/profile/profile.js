// pages/profile/profile.js
Page({
  data: {
    hasUserInfo: false,
    userInfo: null,
    totalFocusTime: 0,
    focusCount: 0,
    favoritesCount: 0,
    favorites: [],
    isLoading: false,
    isNewUser: false,
    userJob: '', // 用户职位
    showJobInput: false // 是否显示职位输入弹窗
  },

  onLoad() {
    // 检查本地是否有用户信息
    this.checkLocalUserInfo()
  },

  onShow() {
    // 刷新收藏列表
    if (this.data.hasUserInfo) {
      this.loadFavorites()
    }
  },

  // 检查本地用户信息
  checkLocalUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      const userJob = wx.getStorageSync('userJob') || ''
      if (userInfo) {
        this.setData({
          userInfo,
          userJob,
          hasUserInfo: true
        })
        // 加载统计数据
        this.loadStats()
        this.loadFavorites()
      }
    } catch (err) {
      console.error('读取本地缓存失败:', err)
    }
  },

  // 处理登录
  async handleLogin() {
    wx.showLoading({ title: '登录中...', mask: true })

    try {
      // 调用云函数获取用户信息（包含自动注册和编号生成）
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })

      if (res.result && res.result.success) {
        const userInfo = res.result.data
        const isNewUser = res.result.isNew

        // 保存到本地缓存
        wx.setStorageSync('userInfo', userInfo)
        wx.setStorageSync('userJob', this.data.userJob || '')

        this.setData({
          userInfo,
          userJob: this.data.userJob || '',
          hasUserInfo: true,
          isNewUser
        })

        wx.hideLoading()

        // 显示欢迎提示
        if (isNewUser) {
          wx.showToast({
            title: `欢迎加入！你是${userInfo.nickname}`,
            icon: 'success',
            duration: 2500
          })
        } else {
          wx.showToast({
            title: `欢迎回来！${userInfo.nickname}`,
            icon: 'success'
          })
        }

        // 加载统计数据
        this.loadStats()
        this.loadFavorites()
      } else {
        console.error('云函数返回失败:', res.result)
        wx.hideLoading()
        wx.showModal({
          title: '登录失败',
          content: res.result?.message || res.result?.error || '请稍后重试',
          showCancel: false
        })
      }
    } catch (err) {
      console.error('登录失败:', err)
      wx.hideLoading()
      wx.showModal({
        title: '登录失败',
        content: err.message || '请稍后重试',
        showCancel: false
      })
    }
  },

  // 处理退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录才能使用收藏等功能',
      success: (res) => {
        if (res.confirm) {
          // 清除本地缓存
          wx.removeStorageSync('userInfo')

          // 重置页面状态
          this.setData({
            hasUserInfo: false,
            userInfo: null,
            totalFocusTime: 0,
            focusCount: 0,
            favoritesCount: 0,
            favorites: [],
            isNewUser: false
          })

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  async loadUserInfo() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: {}
      })

      if (res.result && res.result.success) {
        const userInfo = res.result.data

        // 保存到本地缓存
        wx.setStorageSync('userInfo', userInfo)

        this.setData({
          userInfo,
          hasUserInfo: true,
          isNewUser: res.result.isNew
        })
      }
    } catch (err) {
      console.error('加载用户信息失败:', err)
    } finally {
      this.setData({ isLoading: false })
    }
  },

  async loadStats() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserStats',
        data: {}
      })

      if (res.result && res.result.success) {
        this.setData({
          totalFocusTime: res.result.totalFocusTime || 0,
          focusCount: res.result.focusCount || 0
        })
      }
    } catch (err) {
      console.error('加载统计失败:', err)
    }
  },

  async loadFavorites() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserFavorites',
        data: {
          page: 1,
          pageSize: 3
        }
      })

      if (res.result && res.result.success) {
        this.setData({
          favorites: res.result.data.favorites || [],
          favoritesCount: res.result.data.total || 0
        })
      }
    } catch (err) {
      console.error('加载收藏失败:', err)
    }
  },

  refreshUserInfo() {
    wx.showLoading({ title: '刷新中...' })

    Promise.all([
      this.loadUserInfo(),
      this.loadStats(),
      this.loadFavorites()
    ]).finally(() => {
      wx.hideLoading()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    })
  },

  goToFavorites() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/favorite/index'
    })
  },

  // 显示职位输入弹窗
  showJobInput() {
    this.setData({
      showJobInput: true
    })
  },

  // 隐藏职位输入弹窗
  hideJobInput() {
    this.setData({
      showJobInput: false
    })
  },

  // 保存职位
  async saveJob(e) {
    const { job } = e.detail.value
    const trimmedJob = (job || '').trim()

    if (!trimmedJob) {
      wx.showToast({
        title: '请输入职位',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      // 保存到本地
      wx.setStorageSync('userJob', trimmedJob)

      // 同步到本地用户信息
      const { userInfo } = this.data
      if (userInfo) {
        userInfo.job = trimmedJob
        wx.setStorageSync('userInfo', userInfo)
      }

      // 保存到云数据库
      const userInDb = await wx.cloud.callFunction({
        name: 'updateUserJob',
        data: {
          job: trimmedJob
        }
      })

      wx.hideLoading()

      if (userInDb.result && userInDb.result.success) {
        this.setData({
          userJob: trimmedJob,
          showJobInput: false
        })

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      } else {
        throw new Error('保存失败')
      }
    } catch (err) {
      wx.hideLoading()
      console.error('保存职位失败:', err)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'error'
      })
    }
  },

  // 清空职位
  async clearJob() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空职位信息吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '清空中...' })

            // 清除本地缓存
            wx.removeStorageSync('userJob')

            // 清除本地用户信息中的职位
            const { userInfo } = this.data
            if (userInfo) {
              delete userInfo.job
              wx.setStorageSync('userInfo', userInfo)
            }

            // 清除云数据库中的职位
            await wx.cloud.callFunction({
              name: 'updateUserJob',
              data: {
                job: ''
              }
            })

            wx.hideLoading()

            this.setData({
              userJob: ''
            })

            wx.showToast({
              title: '已清空',
              icon: 'success'
            })
          } catch (err) {
            wx.hideLoading()
            console.error('清空职位失败:', err)
            wx.showToast({
              title: '清空失败，请重试',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  onShareAppMessage() {
    const { userInfo } = this.data
    return {
      title: `我是${userInfo?.nickname || '打工人'}，邀请你一起加入治愈所`,
      path: '/pages/index/index'
    }
  }
})
