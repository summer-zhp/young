// pages/toolkit/signature/signature.js - 电子签名
Page({
  data: {
    penColor: '#1A1A1A',
    lineWidth: 4,
    isEmpty: true,
    canvasStyleWidth: 100,
    canvasStyleHeight: 100
  },

  canvas: null,
  ctx: null,
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  dpr: 1,
  canvasWidth: 0,
  canvasHeight: 0,
  canvasLeft: 0,
  canvasTop: 0,
  strokes: [],
  currentPoints: [],

  onReady() {
    this.setupCanvas()
  },

  // 第一步：获取容器尺寸，设置 canvas 显示大小
  setupCanvas() {
    const sysInfo = wx.getSystemInfoSync()
    this.dpr = sysInfo.pixelRatio

    const query = wx.createSelectorQuery()
    query.select('.canvas-wrapper').boundingClientRect()
    query.exec((res) => {
      if (!res[0]) return

      const wrapper = res[0]
      // 减去 padding (8rpx * 2 上下, 12rpx * 2 左右)
      const rpxToPx = sysInfo.windowWidth / 750
      const padV = 8 * rpxToPx
      const padH = 12 * rpxToPx

      const cw = wrapper.width - padH * 2
      const ch = wrapper.height - padV * 2

      this.setData({
        canvasStyleWidth: Math.round(cw),
        canvasStyleHeight: Math.round(ch)
      }, () => {
        // 等 canvas style 生效后再初始化
        setTimeout(() => this.initCanvas(), 50)
      })
    })
  },

  // 第二步：获取 canvas 节点，设置内部像素尺寸
  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#signatureCanvas').fields({ node: true })
    query.select('#signatureCanvas').boundingClientRect()
    query.exec((res) => {
      if (!res[0]) return

      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const rect = res[1]

      this.canvas = canvas
      this.ctx = ctx
      this.canvasWidth = rect.width
      this.canvasHeight = rect.height
      this.canvasLeft = rect.left
      this.canvasTop = rect.top

      // 内部像素 = CSS 尺寸 × DPR
      canvas.width = this.canvasWidth * this.dpr
      canvas.height = this.canvasHeight * this.dpr
      ctx.scale(this.dpr, this.dpr)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    })
  },

  onTouchStart(e) {
    if (!this.ctx || e.touches.length !== 1) return
    const touch = e.touches[0]
    const x = touch.clientX - this.canvasLeft
    const y = touch.clientY - this.canvasTop

    this.isDrawing = true
    this.lastX = x
    this.lastY = y
    this.currentPoints = [{ x, y }]

    this.ctx.beginPath()
    this.ctx.arc(x, y, this.data.lineWidth / 2, 0, 2 * Math.PI)
    this.ctx.fillStyle = this.data.penColor
    this.ctx.fill()
  },

  onTouchMove(e) {
    if (!this.isDrawing || e.touches.length !== 1) return
    const touch = e.touches[0]
    const x = touch.clientX - this.canvasLeft
    const y = touch.clientY - this.canvasTop

    this.currentPoints.push({ x, y })

    this.ctx.beginPath()
    this.ctx.moveTo(this.lastX, this.lastY)
    this.ctx.lineTo(x, y)
    this.ctx.strokeStyle = this.data.penColor
    this.ctx.lineWidth = this.data.lineWidth
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.stroke()

    this.lastX = x
    this.lastY = y

    if (this.data.isEmpty) {
      this.setData({ isEmpty: false })
    }
  },

  onTouchEnd() {
    if (!this.isDrawing) return
    this.isDrawing = false

    if (this.currentPoints.length > 0) {
      this.strokes.push({
        color: this.data.penColor,
        width: this.data.lineWidth,
        points: [...this.currentPoints]
      })
      this.currentPoints = []
    }
  },

  redrawAll() {
    const ctx = this.ctx
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

    this.strokes.forEach(stroke => {
      if (stroke.points.length === 0) return

      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.points.length === 1) {
        ctx.beginPath()
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, 2 * Math.PI)
        ctx.fillStyle = stroke.color
        ctx.fill()
        return
      }

      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    })

    this.setData({ isEmpty: this.strokes.length === 0 })
  },

  undo() {
    if (this.strokes.length === 0) {
      wx.showToast({ title: '没有可撤销的操作', icon: 'none' })
      return
    }
    this.strokes.pop()
    this.redrawAll()
  },

  clearCanvas() {
    if (this.data.isEmpty) return
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有签名内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.strokes = []
          this.ctx.fillStyle = '#ffffff'
          this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
          this.setData({ isEmpty: true })
        }
      }
    })
  },

  setColor(e) {
    this.setData({ penColor: e.currentTarget.dataset.color })
  },

  setWidth(e) {
    this.setData({ lineWidth: Number(e.currentTarget.dataset.width) })
  },

  saveSignature() {
    if (this.data.isEmpty) {
      wx.showToast({ title: '请先签名', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    setTimeout(() => {
      wx.canvasToTempFilePath({
        canvas: this.canvas,
        success: (res) => {
          this.saveToAlbum(res.tempFilePath)
        },
        fail: (err) => {
          console.error('canvasToTempFilePath failed:', err)
          wx.hideLoading()
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      })
    }, 100)
  },

  saveToAlbum(filePath) {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          wx.hideLoading()
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册权限以保存签名',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
          return
        }

        wx.saveImageToPhotosAlbum({
          filePath: filePath,
          success: () => {
            wx.hideLoading()
            wx.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            console.error('saveImageToPhotosAlbum failed:', err)
            wx.hideLoading()
            wx.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      },
      fail: () => {
        wx.hideLoading()
      }
    })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  }
})
