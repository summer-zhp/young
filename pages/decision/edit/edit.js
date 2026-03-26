// pages/decision/edit/edit.js - 编辑转盘
const app = getApp()

// 颜色配置
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
]

Page({
  data: {
    // 转盘 ID
    turntableId: '',

    // 转盘名称
    turntableName: '',

    // 选项列表
    options: [],

    // 颜色配置
    colors: COLORS,

    // 是否编辑模式
    isEdit: false
  },

  onLoad(options) {
    // 检查登录状态
    if (!app.requireLogin()) {
      return
    }

    const { id } = options
    if (id) {
      // 编辑模式，加载转盘数据
      this.setData({ isEdit: true, turntableId: id })
      this.loadTurntable(id)
    } else {
      // 新建模式，初始化空选项
      this.setData({
        options: [
          { id: 1, content: '' },
          { id: 2, content: '' }
        ]
      })
    }
  },

  // 加载转盘数据
  loadTurntable(id) {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.openid) return

    wx.showLoading({ title: '加载中...' })

    wx.cloud.callFunction({
      name: 'getTurntables',
      data: {
        openid: userInfo.openid
      },
      success: (res) => {
        if (res.result && res.result.data) {
          const turntable = res.result.data.find(item => item._id === id)
          if (turntable) {
            const options = (turntable.options || []).map((opt, index) => ({
              id: index + 1,
              content: opt
            }))

            this.setData({
              turntableName: turntable.name,
              options: options.length > 0 ? options : [{ id: 1, content: '' }, { id: 2, content: '' }]
            })
          }
        }
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 名称输入
  onNameInput(e) {
    this.setData({
      turntableName: e.detail.value
    })
  },

  // 选项输入
  onOptionInput(e) {
    const { index } = e.currentTarget.dataset
    const options = [...this.data.options]
    options[index].content = e.detail.value
    options[index].isEmpty = !e.detail.value.trim()
    this.setData({ options })
  },

  // 添加选项
  addOption() {
    const options = [...this.data.options, { id: Date.now(), content: '' }]
    this.setData({ options })
  },

  // 删除选项
  deleteOption(e) {
    const { index } = e.currentTarget.dataset
    const options = this.data.options.filter((_, i) => i !== index)
    this.setData({
      options: options.length > 0 ? options : [{ id: 1, content: '' }]
    })
  },

  // 上移选项
  moveUp(e) {
    const { index } = e.currentTarget.dataset
    const options = [...this.data.options]
    const temp = options[index]
    options[index] = options[index - 1]
    options[index - 1] = temp
    this.setData({ options })
  },

  // 下移选项
  moveDown(e) {
    const { index } = e.currentTarget.dataset
    const options = [...this.data.options]
    const temp = options[index]
    options[index] = options[index + 1]
    options[index + 1] = temp
    this.setData({ options })
  },

  // 保存转盘
  saveTurntable() {
    const { turntableId, turntableName, options, isEdit } = this.data
    const userInfo = app.globalData.userInfo

    // 验证
    if (!turntableName.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }

    const validOptions = options.filter(opt => opt.content.trim())
    if (validOptions.length < 2) {
      wx.showToast({ title: '至少 2 个选项', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...', mask: true })

    const functionName = isEdit ? 'updateTurntable' : 'saveTurntable'
    const callData = {
      openid: userInfo.openid,
      name: turntableName.trim(),
      options: validOptions.map(opt => opt.content.trim())
    }

    if (isEdit) {
      callData.id = turntableId
    }

    wx.cloud.callFunction({
      name: functionName,
      data: callData,
      success: (res) => {
        if (res.result && res.result.success) {
          wx.showToast({
            title: isEdit ? '保存成功' : '创建成功',
            icon: 'success'
          })

          // 返回上一页
          setTimeout(() => {
            wx.navigateBack({ delta: 1 })
          }, 500)
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('保存失败:', err)
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  // 返回
  goBack() {
    wx.navigateBack({ delta: 1 })
  }
})
