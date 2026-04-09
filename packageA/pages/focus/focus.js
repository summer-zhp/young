// pages/focus/focus.js
Page({
  data: {
    durations: [
      { label: '15 分', value: 15 },
      { label: '25 分', value: 25 },
      { label: '45 分', value: 45 }
    ],
    selectedDuration: 25,
    totalTime: 25 * 60,
    remainingTime: 25 * 60,
    formattedTime: '25:00',
    isRunning: false,
    isPaused: false,
    timer: null,
    quote: '专注当下，成就未来',
    quotes: [
      '专注当下，成就未来',
      '25 分钟后，你会感谢现在开始的自己',
      '一步一步，慢慢来，比较快',
      '专注是一种能力，也是一种修行',
      '今天的专注，是明天的底气',
      '每一分努力，都不会被辜负'
    ],
    totalFocusTime: 0,
    focusCount: 0,
    showCustomModal: false,
    customMinutes: ''
  },

  onLoad() {
    this.selectRandomQuote()
    this.loadStats()
  },

  onShow() {
    // 每次页面显示时重新加载统计数据
    this.loadStats()
  },

  selectRandomQuote() {
    const randomIndex = Math.floor(Math.random() * this.data.quotes.length)
    this.setData({
      quote: this.data.quotes[randomIndex]
    })
  },

  selectDuration(e) {
    const { value } = e.currentTarget.dataset
    if (this.data.isRunning) return

    this.setData({
      selectedDuration: value,
      totalTime: value * 60,
      remainingTime: value * 60,
      formattedTime: this.formatTime(value * 60)
    })
  },

  startFocus() {
    if (this.data.isRunning && !this.data.isPaused) return

    this.setData({
      isRunning: true,
      isPaused: false
    })

    this.startTimer()
  },

  startTimer() {
    const timer = setInterval(() => {
      if (this.data.remainingTime > 0) {
        this.setData({
          remainingTime: this.data.remainingTime - 1,
          formattedTime: this.formatTime(this.data.remainingTime - 1)
        })
      } else {
        this.completeFocus()
      }
    }, 1000)

    this.setData({ timer })
  },

  pauseFocus() {
    if (!this.data.isRunning) return

    clearInterval(this.data.timer)
    this.setData({
      isPaused: true,
      timer: null
    })
  },

  resumeFocus() {
    this.setData({
      isPaused: false
    })
    this.startTimer()
  },

  stopFocus() {
    clearInterval(this.data.timer)
    this.setData({
      isRunning: false,
      isPaused: false,
      timer: null,
      remainingTime: this.data.totalTime
    })
  },

  completeFocus() {
    clearInterval(this.data.timer)

    // 震动反馈
    wx.vibrateShort({ type: 'long' })

    // 先记录专注，再显示完成提示
    this.recordFocus().then(() => {
      wx.showModal({
        title: '专注完成',
        content: `太棒了！你完成了 ${this.data.selectedDuration} 分钟的专注时光`,
        showCancel: false,
        confirmText: '继续加油',
        success: () => {
          // 更新本地统计
          this.setData({
            totalFocusTime: this.data.totalFocusTime + this.data.selectedDuration,
            focusCount: this.data.focusCount + 1
          })
          // 重新从云端加载统计数据，确保一致性
          this.loadStats()
          this.stopFocus()
          this.selectRandomQuote()
        }
      })
    })
  },

  async recordFocus() {
    // 检查是否已登录
    const app = getApp()
    if (!app.isLogged()) {
      // 未登录时不记录，但不影响用户体验
      console.log('未登录，跳过专注记录')
      wx.showToast({
        title: '未登录，不计入统计',
        icon: 'none'
      })
      return Promise.resolve()
    }

    console.log('开始记录专注，duration:', this.data.selectedDuration)

    try {
      const res = await wx.cloud.callFunction({
        name: 'recordFocus',
        data: {
          duration: this.data.selectedDuration,
          quote: this.data.quote
        }
      })
      console.log('云函数返回结果:', res.result)
      if (res.result && res.result.success) {
        console.log('专注记录成功')
        wx.showToast({
          title: '已记录专注时长',
          icon: 'success'
        })
      } else {
        console.error('云函数返回失败:', res.result)
        wx.showToast({
          title: '记录失败：' + (res.result?.message || '未知错误'),
          icon: 'none'
        })
      }
      return res.result
    } catch (err) {
      console.error('记录专注失败:', err)
      wx.showToast({
        title: '调用云函数失败',
        icon: 'none'
      })
      return Promise.reject(err)
    }
  },

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  },

  async loadStats() {
    // 检查是否已登录
    const app = getApp()
    if (!app.isLogged()) {
      // 未登录时不加载统计
      return
    }

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

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  // 显示自定义时长弹窗
  showCustomDuration() {
    if (this.data.isRunning) return
    this.setData({
      showCustomModal: true,
      customMinutes: ''
    })
  },

  // 隐藏自定义时长弹窗
  hideCustomDuration() {
    this.setData({
      showCustomModal: false
    })
  },

  // 保存自定义时长
  saveCustomDuration(e) {
    const { minutes } = e.detail.value
    const mins = parseInt(minutes) || 0

    if (mins < 1 || mins > 180) {
      wx.showToast({
        title: '请输入 1-180 之间的数字',
        icon: 'none'
      })
      return
    }

    this.setData({
      selectedDuration: mins,
      totalTime: mins * 60,
      remainingTime: mins * 60,
      formattedTime: this.formatTime(mins * 60),
      showCustomModal: false
    })

    wx.showToast({
      title: `已设置为${mins}分钟`,
      icon: 'success'
    })
  }
})
