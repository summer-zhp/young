// pages/decision/decision.js - 决策转盘
const app = getApp()

// 转盘颜色配置
const SEGMENT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
]

Page({
  data: {
    // 当前转盘
    currentTurntable: {
      id: '',
      name: '未选择转盘',
      options: []
    },

    // 转盘列表
    turntableList: [],

    // 是否旋转中
    isSpinning: false,

    // 显示结果
    showResult: false,
    resultText: '',

    // 旋转角度（度）
    currentAngle: 0,

    // 旋转持续时间
    spinDuration: 4,

    // 扇形背景（conic-gradient）
    segmentBackground: '',

    // 是否可以旋转
    canSpin: false
  },

  onLoad() {
    // 检查登录状态
    if (!app.requireLogin()) {
      return
    }
    this.loadTurntableList()
  },

  onShow() {
    // 每次页面显示时重新加载转盘列表
    this.loadTurntableList()
  },

  // 生成扇形背景
  generateSegmentBackground(options) {
    if (!options || options.length === 0) return ''

    const anglePerOption = 360 / options.length
    const segments = []

    for (let i = 0; i < options.length; i++) {
      const startAngle = i * anglePerOption
      const endAngle = (i + 1) * anglePerOption
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length]
      segments.push(`${color} ${startAngle}deg ${endAngle}deg`)
    }

    return `conic-gradient(${segments.join(', ')})`
  },

  // 加载转盘列表
  loadTurntableList() {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.openid) return

    wx.cloud.callFunction({
      name: 'getTurntables',
      data: {
        openid: userInfo.openid
      },
      success: (res) => {
        if (res.result && res.result.data) {
          const turntableList = res.result.data.map(item => ({
            ...item,
            id: item._id,
            formattedTime: this.formatDate(item.updateTime || item.createTime)
          }))
          this.setData({ turntableList })

          // 如果当前选中的转盘在列表中，更新其数据
          if (this.data.currentTurntable.id) {
            const current = turntableList.find(item => item.id === this.data.currentTurntable.id)
            if (current) {
              this.setData({
                currentTurntable: current,
                segmentBackground: this.generateSegmentBackground(current.options)
              }, () => {
                this.updateCanSpin()
              })
            }
          } else if (turntableList.length > 0) {
            // 如果没有选中转盘，默认选中第一个
            const first = turntableList[0]
            this.setData({
              currentTurntable: first,
              segmentBackground: this.generateSegmentBackground(first.options)
            }, () => {
              this.updateCanSpin()
            })
          }
        }
      }
    })
  },

  // 选择转盘
  selectTurntable(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      currentTurntable: item,
      segmentBackground: this.generateSegmentBackground(item.options)
    }, () => {
      this.updateCanSpin()
    })
  },

  // 更新是否可以旋转
  updateCanSpin() {
    const { currentTurntable } = this.data
    this.setData({
      canSpin: !!(currentTurntable.id && currentTurntable.options && currentTurntable.options.length >= 2)
    })
  },

  // 跳转到新建页面
  goToCreate() {
    wx.navigateTo({
      url: '/pages/decision/edit/edit'
    })
  },

  // 跳转到编辑页面
  goToEdit(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/pages/decision/edit/edit?id=${item.id}`
    })
  },

  // 删除转盘
  deleteTurntable(e) {
    const id = e.currentTarget.dataset.id
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.openid) return

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个转盘吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })

          wx.cloud.callFunction({
            name: 'deleteTurntable',
            data: {
              openid: userInfo.openid,
              id: id
            },
            success: (res) => {
              if (res.result && res.result.success) {
                // 如果删除的是当前选中的转盘，清空选择
                if (this.data.currentTurntable.id === id) {
                  this.setData({
                    currentTurntable: { id: '', name: '未选择转盘', options: [] },
                    segmentBackground: ''
                  }, () => {
                    this.updateCanSpin()
                  })
                }
                this.loadTurntableList()
                wx.showToast({ title: '删除成功', icon: 'success' })
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' })
              }
            },
            fail: (err) => {
              console.error('删除转盘失败:', err)
              wx.showToast({ title: '删除失败', icon: 'none' })
            },
            complete: () => {
              wx.hideLoading()
            }
          })
        }
      }
    })
  },

  // 开始旋转
  startSpin() {
    const { currentTurntable, isSpinning, canSpin } = this.data
    if (isSpinning || !canSpin) return

    // 随机旋转圈数（3-6 圈）+ 随机角度
    const randomSpins = 3 + Math.random() * 3
    const randomDeg = Math.random() * 360
    const targetAngle = this.data.currentAngle + randomSpins * 360 + randomDeg
    const rotateDeg = targetAngle - this.data.currentAngle

    this.setData({
      isSpinning: true,
      spinDuration: 4
    })

    // 使用 CSS transition 动画
    setTimeout(() => {
      this.setData({
        currentAngle: targetAngle
      })
    }, 50)

    // 4 秒后显示结果
    setTimeout(() => {
      this.calculateResult(targetAngle)
    }, 4050)
  },

  // 计算结果
  calculateResult(finalAngle) {
    const { currentTurntable } = this.data
    const options = currentTurntable.options
    const anglePerOption = 360 / options.length

    // 规范化角度到 0-360
    let normalizedAngle = finalAngle % 360
    if (normalizedAngle < 0) normalizedAngle += 360

    // 指针在顶部（0 度位置是 12 点钟方向）
    // 转盘顺时针旋转，指针指向的原始位置为 (360 - normalizedAngle)
    const pointerAngle = (360 - normalizedAngle) % 360
    const selectedIndex = Math.floor(pointerAngle / anglePerOption) % options.length

    this.setData({
      isSpinning: false,
      resultText: options[selectedIndex],
      showResult: true
    })

    // 保存结果到云数据库
    this.saveSpinResult(options[selectedIndex])
  },

  // 保存旋转结果
  saveSpinResult(result) {
    const userInfo = app.globalData.userInfo
    if (!userInfo || !userInfo.openid) return

    wx.cloud.callFunction({
      name: 'saveSpinResult',
      data: {
        openid: userInfo.openid,
        turntableId: this.data.currentTurntable.id,
        turntableName: this.data.currentTurntable.name,
        result: result
      }
    }).catch(err => console.error('保存结果失败:', err))
  },

  // 隐藏结果
  hideResult() {
    this.setData({ showResult: false })
  },

  // 返回
  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date

    const day = 24 * 60 * 60 * 1000
    if (diff < day) {
      return '今天'
    } else if (diff < 2 * day) {
      return '昨天'
    } else if (diff < 7 * day) {
      return Math.floor(diff / day) + '天前'
    } else {
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}月${day}日`
    }
  }
})
