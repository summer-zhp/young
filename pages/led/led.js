// pages/led/led.js - LED 手持弹幕
Page({
  data: {
    // 输入文字
    inputText: '欢迎回家',

    // 文字颜色
    textColor: '#FF0000',
    textColors: [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
      '#FF00FF', '#00FFFF', '#FFA500', '#FFFFFF',
      '#FF69B4', '#7FFF00', '#FF4500', '#00CED1'
    ],

    // 背景颜色
    backgroundColor: '#000000',
    bgColors: [
      '#000000', '#1a1a2e', '#2d1b4e', '#1a3c34',
      '#2c1810', '#0f0f23', '#1a1a1a', '#ffffff'
    ],

    // 滚动速度（像素/秒）
    scrollSpeed: 'medium',
    scrollPixelsPerSecond: 60,

    // 全屏显示
    isDisplaying: false,

    // 字体大小
    fontSize: 200,
    fontSizeOptions: [120, 160, 200, 260, 340],

    // 动画时长（动态计算）
    scrollDuration: 6000,
  },

  onLoad() {
    // 获取屏幕宽度用于调整字体大小
    const { windowWidth, windowHeight } = wx.getSystemInfoSync()
    this.setData({
      fontSize: windowWidth > 400 ? 260 : 200,
      screenWidth: windowHeight, // 旋转后，高度变成宽度
      screenHeight: windowWidth
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  // 输入文字
  onInputText(e) {
    this.setData({ inputText: e.detail.value })
  },

  // 选择文字颜色
  onSelectTextColor(e) {
    this.setData({ textColor: e.currentTarget.dataset.color })
  },

  // 自定义文字颜色
  onCustomTextColor(e) {
    let color = e.detail.value.trim()
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      this.setData({ textColor: color }, () => {
        if (this.data.isDisplaying) {
          this.calculateScrollDuration()
        }
      })
    }
  },

  // 选择背景颜色
  onSelectBgColor(e) {
    this.setData({ backgroundColor: e.currentTarget.dataset.color })
  },

  // 自定义背景颜色
  onCustomBgColor(e) {
    let color = e.detail.value.trim()
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      this.setData({ backgroundColor: color })
    }
  },

  // 选择滚动速度
  onSelectSpeed(e) {
    const speed = e.currentTarget.dataset.speed
    const pixelsPerSecondMap = {
      slow: 40,
      medium: 80,
      fast: 150
    }
    this.setData({
      scrollSpeed: speed,
      scrollPixelsPerSecond: pixelsPerSecondMap[speed]
    }, () => {
      // 重新计算动画时长
      this.calculateScrollDuration()
    })
  },

  // 计算滚动时长（根据文字宽度和速度）
  calculateScrollDuration() {
    const query = wx.createSelectorQuery()
    query.select('#marqueeText').fields({
      size: true
    }).exec((res) => {
      if (res[0]) {
        const textWidth = res[0].width || 0
        const { screenWidth } = this.data
        // 滚动距离 = 屏幕宽度 + 文字宽度（从右侧完全进入到左侧完全离开）
        const scrollDistance = screenWidth + textWidth
        const duration = (scrollDistance / this.data.scrollPixelsPerSecond) * 1000
        this.setData({
          scrollDuration: duration
        })
      }
    })
  },

  // 选择字体大小
  onSelectFontSize(e) {
    this.setData({ fontSize: e.currentTarget.dataset.size }, () => {
      if (this.data.isDisplaying) {
        this.calculateScrollDuration()
      }
    })
  },

  // 重置设置
  onReset() {
    this.setData({
      inputText: '欢迎回家',
      textColor: '#FFFFFF',
      backgroundColor: '#000000',
      scrollSpeed: 'medium',
      scrollPixelsPerSecond: 100,
      scrollDuration: 6000,
      fontSize: 200
    })

    wx.showToast({ title: '已重置', icon: 'success' })
  },

  // 开始显示
  onStartDisplay() {
    const { inputText } = this.data

    if (!inputText || inputText.trim() === '') {
      wx.showToast({ title: '请输入文字', icon: 'none' })
      return
    }

    // 保持屏幕常亮
    wx.setKeepScreenOn({ keepScreenOn: true })

    // 进入全屏
    this.setData({ isDisplaying: true }, () => {
      // 延迟计算文字宽度（确保 DOM 已渲染）
      setTimeout(() => {
        this.calculateScrollDuration()
      }, 100)
    })
  },

  // 退出显示
  onExitDisplay() {
    wx.setKeepScreenOn({ keepScreenOn: false })
    this.setData({ isDisplaying: false })
  }
})
