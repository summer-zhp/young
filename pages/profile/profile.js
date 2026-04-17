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
    showJobInput: false, // 是否显示职位输入弹窗
    wxNickname: '', // 微信昵称
    showNicknameInput: false // 是否显示昵称输入弹窗
  },

  onLoad() {
    // 检查本地是否有用户信息
    this.checkLocalUserInfo()
  },

  onShow() {
    // 刷新加入天数
    if (this.data.hasUserInfo && this.data.userInfo) {
      this.refreshDays()
    }
    // 刷新收藏列表
    if (this.data.hasUserInfo) {
      this.loadFavorites()
    }
  },

  // 根据注册时间实时计算加入天数
  refreshDays() {
    var userInfo = this.data.userInfo
    var createdTime = new Date(userInfo.created_at || userInfo.createTime)
    if (createdTime) {
      var now = new Date()
      var days = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)) + 1
      if (userInfo.days !== days) {
        this.setData({ 'userInfo.days': days })
      }
    }
  },

  // 检查本地用户信息
  checkLocalUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      const userJob = wx.getStorageSync('userJob') || ''
      const wxNickname = (userInfo && userInfo.wxNickname) || ''
      if (userInfo) {
        this.setData({
          userInfo,
          userJob,
          wxNickname,
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

        // 同步到全局状态
        getApp().globalData.userInfo = userInfo

        // 从云端恢复工作日程设置
        if (userInfo.workSchedule) {
          wx.setStorageSync('workSchedule', userInfo.workSchedule)
        }

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

        // 登录成功后重新加载首页
        wx.reLaunch({ url: '/pages/index/index' })
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

        // 从云端恢复工作日程设置
        if (userInfo.workSchedule) {
          wx.setStorageSync('workSchedule', userInfo.workSchedule)
        }

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

  // 显示昵称输入弹窗
  showNicknameInput() {
    this.setData({ showNicknameInput: true })
  },

  // 隐藏昵称输入弹窗
  hideNicknameInput() {
    this.setData({ showNicknameInput: false })
  },

  // 保存昵称
  async saveNickname(e) {
    const { nickname } = e.detail.value
    const trimmed = (nickname || '').trim()

    if (!trimmed) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'updateUserNickname',
        data: { wxNickname: trimmed }
      })

      wx.hideLoading()

      if (res.result && res.result.success) {
        const userInfo = { ...this.data.userInfo, wxNickname: trimmed }
        wx.setStorageSync('userInfo', userInfo)
        getApp().globalData.userInfo = userInfo

        this.setData({
          userInfo,
          wxNickname: trimmed,
          showNicknameInput: false
        })

        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        throw new Error('保存失败')
      }
    } catch (err) {
      wx.hideLoading()
      console.error('保存昵称失败:', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'error' })
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

  // 点击头像上传头像
  async onAvatarClick() {
    // 检查是否已登录
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    // 选择图片
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      camera: 'back',
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        console.log('选择的图片路径:', tempFilePath)

        // 显示上传提示
        wx.showLoading({
          title: '上传中...',
          mask: true
        })

        try {
          // 上传到云存储
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: `avatar/${this.data.userInfo.user_no}_${Date.now()}.png`,
            filePath: tempFilePath
          })

          console.log('上传成功，fileID:', uploadResult.fileID)

          // 获取临时访问链接
          const urlResult = await wx.cloud.getTempFileURL({
            fileList: [uploadResult.fileID]
          })

          const avatarUrl = urlResult.fileList[0].tempFileURL
          console.log('头像 URL:', avatarUrl)

          // 更新本地缓存
          const userInfo = { ...this.data.userInfo, avatarUrl }
          wx.setStorageSync('userInfo', userInfo)

          // 更新页面显示
          this.setData({
            userInfo
          })

          // 同步到云数据库
          const updateResult = await wx.cloud.callFunction({
            name: 'updateUserAvatar',
            data: {
              avatarUrl
            }
          })

          wx.hideLoading()

          if (updateResult.result && updateResult.result.success) {
            wx.showToast({
              title: '头像更新成功',
              icon: 'success'
            })
          } else {
            throw new Error('同步到云端失败')
          }
        } catch (err) {
          wx.hideLoading()
          console.error('上传头像失败:', err)
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        if (err.errMsg !== 'chooseMedia:fail cancel') {
          console.error('选择图片失败:', err)
          wx.showToast({
            title: '选择失败，请重试',
            icon: 'error'
          })
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
