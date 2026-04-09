// pages/coloring/index.js - 涂色画板
Page({
  data: {
    // 模板
    templates: [
      { id: 'free', name: '自由画', icon: 'icon-palette' },
      { id: 'butterfly', name: '蝴蝶', icon: 'icon-butterfly' },
      { id: 'heart', name: '爱心', icon: 'icon-heart-copy' },
      { id: 'flower', name: '花朵', icon: 'icon-huaduo1' },
      { id: 'cat', name: '猫咪', icon: 'icon-maomi' },
      { id: 'star', name: '星星', icon: 'icon-star' },
      { id: 'house', name: '小屋', icon: 'icon-xiaowu' }
    ],
    selectedTemplate: '',
    selectedName: '',
    selectedIcon: '',
    hasCanvas: false,

    // 画布
    canvasStyleWidth: 100,
    canvasStyleHeight: 100,

    // 画笔
    colors: [
      '#1A1A1A', '#FF6B81', '#FF9F8F', '#FFB5A9', '#FFD700',
      '#FFA500', '#8EC5B9', '#6FA99A', '#4A90D9', '#5B8DEF',
      '#9B59B6', '#E91E63', '#4CAF50', '#8BC34A', '#00BCD4',
      '#795548', '#607D8B', '#FFFFFF'
    ],
    currentColor: '#1A1A1A',
    brushSizes: [3, 6, 10, 16, 24],
    currentSize: 6,
    eraserMode: false
  },

  canvas: null,
  ctx: null,
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  dpr: 1,
  canvasWidth: 0,
  canvasHeight: 0,
  strokes: [],
  snapshotList: [],
  templateSnapshot: null,

  selectTemplate(e) {
    const id = e.currentTarget.dataset.id
    const t = this.data.templates.find(t => t.id === id)
    this.setData({
      selectedTemplate: id,
      selectedName: t ? t.name : '',
      selectedIcon: t ? t.icon : ''
    })
  },

  startDrawing() {
    this.setData({ hasCanvas: true })
    setTimeout(() => this.setupCanvas(), 100)
  },

  setupCanvas() {
    const sysInfo = wx.getSystemInfoSync()
    this.dpr = sysInfo.pixelRatio

    const query = wx.createSelectorQuery()
    query.select('.canvas-wrapper').boundingClientRect()
    query.exec((res) => {
      if (!res[0]) return

      const wrapper = res[0]
      const rpxToPx = sysInfo.windowWidth / 750
      const pad = 8 * rpxToPx

      const cw = wrapper.width - pad * 2
      const ch = wrapper.height - pad * 2

      this.setData({
        canvasStyleWidth: Math.round(cw),
        canvasStyleHeight: Math.round(ch)
      }, () => {
        setTimeout(() => this.initCanvas(), 50)
      })
    })
  },

  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#colorCanvas').fields({ node: true })
    query.select('#colorCanvas').boundingClientRect()
    query.exec((res) => {
      if (!res[0]) return

      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const rect = res[1]

      this.canvas = canvas
      this.ctx = ctx
      this.canvasWidth = rect.width
      this.canvasHeight = rect.height

      canvas.width = rect.width * this.dpr
      canvas.height = rect.height * this.dpr
      ctx.scale(this.dpr, this.dpr)

      // 白色背景
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

      // 绘制模板线稿
      this.drawTemplate(this.data.selectedTemplate)

      // 保存初始快照
      this.saveSnapshot()
    })
  },

  // 绘制模板线稿
  drawTemplate(templateId) {
    if (templateId === 'free') return

    const ctx = this.ctx
    const cx = this.canvasWidth / 2
    const cy = this.canvasHeight / 2
    const r = Math.min(cx, cy) * 0.85

    ctx.strokeStyle = '#D0D0D0'
    ctx.lineWidth = 2
    ctx.setLineDash([])

    switch (templateId) {
      case 'flower':
        this.drawFlower(ctx, cx, cy, r)
        break
      case 'heart':
        this.drawHeart(ctx, cx, cy, r)
        break
      case 'star':
        this.drawStar(ctx, cx, cy, r)
        break
      case 'house':
        this.drawHouse(ctx, cx, cy, r)
        break
      case 'cat':
        this.drawCat(ctx, cx, cy, r)
        break
      case 'butterfly':
        this.drawButterfly(ctx, cx, cy, r)
        break
    }
  },

  drawFlower(ctx, cx, cy, r) {
    // 花瓣
    const petalCount = 6
    for (let i = 0; i < petalCount; i++) {
      const angle = (Math.PI * 2 / petalCount) * i
      ctx.beginPath()
      ctx.ellipse(
        cx + Math.cos(angle) * r * 0.45,
        cy - r * 0.05 + Math.sin(angle) * r * 0.45,
        r * 0.38, r * 0.22,
        angle, 0, Math.PI * 2
      )
      ctx.stroke()
    }
    // 花心
    ctx.beginPath()
    ctx.arc(cx, cy - r * 0.05, r * 0.22, 0, Math.PI * 2)
    ctx.stroke()
    // 茎
    ctx.beginPath()
    ctx.moveTo(cx, cy + r * 0.15)
    ctx.quadraticCurveTo(cx + r * 0.08, cy + r * 0.55, cx, cy + r * 0.92)
    ctx.stroke()
    // 叶子
    ctx.beginPath()
    ctx.ellipse(cx + r * 0.18, cy + r * 0.55, r * 0.18, r * 0.09, Math.PI * 0.3, 0, Math.PI * 2)
    ctx.stroke()
  },

  drawHeart(ctx, cx, cy, r) {
    const s = r * 0.88
    ctx.beginPath()
    ctx.moveTo(cx, cy + s * 0.3)
    ctx.bezierCurveTo(cx, cy - s * 0.2, cx - s, cy - s * 0.6, cx - s, cy + s * 0.05)
    ctx.bezierCurveTo(cx - s, cy + s * 0.5, cx, cy + s * 0.7, cx, cy + s)
    ctx.bezierCurveTo(cx, cy + s * 0.7, cx + s, cy + s * 0.5, cx + s, cy + s * 0.05)
    ctx.bezierCurveTo(cx + s, cy - s * 0.6, cx, cy - s * 0.2, cx, cy + s * 0.3)
    ctx.stroke()
  },

  drawStar(ctx, cx, cy, r) {
    const points = 5
    const outerR = r * 0.88
    const innerR = r * 0.38
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerR : innerR
      const angle = (Math.PI * 2 / (points * 2)) * i - Math.PI / 2
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
    // 内部装饰小星
    const outerR2 = r * 0.32
    const innerR2 = r * 0.14
    ctx.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerR2 : innerR2
      const angle = (Math.PI * 2 / (points * 2)) * i - Math.PI / 2
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  },

  drawHouse(ctx, cx, cy, r) {
    const w = r * 1.6
    const h = r * 1.1
    const top = cy - h * 0.15
    // 墙壁
    ctx.strokeRect(cx - w / 2, top, w, h)
    // 屋顶
    ctx.beginPath()
    ctx.moveTo(cx - w / 2 - r * 0.1, top)
    ctx.lineTo(cx, top - r * 0.5)
    ctx.lineTo(cx + w / 2 + r * 0.1, top)
    ctx.closePath()
    ctx.stroke()
    // 门
    ctx.strokeRect(cx - w * 0.12, top + h * 0.45, w * 0.24, h * 0.55)
    // 窗户
    ctx.strokeRect(cx - w * 0.4, top + h * 0.15, w * 0.22, w * 0.22)
    ctx.strokeRect(cx + w * 0.18, top + h * 0.15, w * 0.22, w * 0.22)
    // 窗户十字
    ctx.beginPath()
    ctx.moveTo(cx - w * 0.29, top + h * 0.15)
    ctx.lineTo(cx - w * 0.29, top + h * 0.15 + w * 0.22)
    ctx.moveTo(cx - w * 0.4, top + h * 0.15 + w * 0.11)
    ctx.lineTo(cx - w * 0.18, top + h * 0.15 + w * 0.11)
    ctx.moveTo(cx + w * 0.29, top + h * 0.15)
    ctx.lineTo(cx + w * 0.29, top + h * 0.15 + w * 0.22)
    ctx.moveTo(cx + w * 0.18, top + h * 0.15 + w * 0.11)
    ctx.lineTo(cx + w * 0.4, top + h * 0.15 + w * 0.11)
    ctx.stroke()
    // 烟囱
    ctx.strokeRect(cx + w * 0.2, top - r * 0.4, w * 0.1, r * 0.25)
  },

  drawCat(ctx, cx, cy, r) {
    const s = r * 0.82
    // 头
    ctx.beginPath()
    ctx.arc(cx, cy - s * 0.3, s * 0.5, 0, Math.PI * 2)
    ctx.stroke()
    // 左耳
    ctx.beginPath()
    ctx.moveTo(cx - s * 0.45, cy - s * 0.55)
    ctx.lineTo(cx - s * 0.3, cy - s * 1.05)
    ctx.lineTo(cx - s * 0.05, cy - s * 0.6)
    ctx.stroke()
    // 右耳
    ctx.beginPath()
    ctx.moveTo(cx + s * 0.45, cy - s * 0.55)
    ctx.lineTo(cx + s * 0.3, cy - s * 1.05)
    ctx.lineTo(cx + s * 0.05, cy - s * 0.6)
    ctx.stroke()
    // 眼睛
    ctx.beginPath()
    ctx.arc(cx - s * 0.18, cy - s * 0.35, s * 0.08, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx + s * 0.18, cy - s * 0.35, s * 0.08, 0, Math.PI * 2)
    ctx.stroke()
    // 鼻子
    ctx.beginPath()
    ctx.moveTo(cx, cy - s * 0.18)
    ctx.lineTo(cx - s * 0.06, cy - s * 0.12)
    ctx.lineTo(cx + s * 0.06, cy - s * 0.12)
    ctx.closePath()
    ctx.stroke()
    // 嘴
    ctx.beginPath()
    ctx.moveTo(cx, cy - s * 0.12)
    ctx.quadraticCurveTo(cx - s * 0.1, cy - s * 0.02, cx - s * 0.15, cy - s * 0.08)
    ctx.moveTo(cx, cy - s * 0.12)
    ctx.quadraticCurveTo(cx + s * 0.1, cy - s * 0.02, cx + s * 0.15, cy - s * 0.08)
    ctx.stroke()
    // 胡须
    ctx.beginPath()
    ctx.moveTo(cx - s * 0.2, cy - s * 0.18)
    ctx.lineTo(cx - s * 0.55, cy - s * 0.25)
    ctx.moveTo(cx - s * 0.2, cy - s * 0.12)
    ctx.lineTo(cx - s * 0.55, cy - s * 0.1)
    ctx.moveTo(cx + s * 0.2, cy - s * 0.18)
    ctx.lineTo(cx + s * 0.55, cy - s * 0.25)
    ctx.moveTo(cx + s * 0.2, cy - s * 0.12)
    ctx.lineTo(cx + s * 0.55, cy - s * 0.1)
    ctx.stroke()
    // 身体
    ctx.beginPath()
    ctx.ellipse(cx, cy + s * 0.5, s * 0.4, s * 0.45, 0, 0, Math.PI * 2)
    ctx.stroke()
    // 尾巴
    ctx.beginPath()
    ctx.moveTo(cx + s * 0.35, cy + s * 0.7)
    ctx.quadraticCurveTo(cx + s * 0.7, cy + s * 0.4, cx + s * 0.6, cy + s * 0.15)
    ctx.stroke()
  },

  drawButterfly(ctx, cx, cy, r) {
    const s = r * 0.85
    // 左上翅
    ctx.beginPath()
    ctx.ellipse(cx - s * 0.5, cy - s * 0.3, s * 0.45, s * 0.35, -Math.PI * 0.2, 0, Math.PI * 2)
    ctx.stroke()
    // 右上翅
    ctx.beginPath()
    ctx.ellipse(cx + s * 0.5, cy - s * 0.3, s * 0.45, s * 0.35, Math.PI * 0.2, 0, Math.PI * 2)
    ctx.stroke()
    // 左下翅
    ctx.beginPath()
    ctx.ellipse(cx - s * 0.35, cy + s * 0.3, s * 0.3, s * 0.25, -Math.PI * 0.1, 0, Math.PI * 2)
    ctx.stroke()
    // 右下翅
    ctx.beginPath()
    ctx.ellipse(cx + s * 0.35, cy + s * 0.3, s * 0.3, s * 0.25, Math.PI * 0.1, 0, Math.PI * 2)
    ctx.stroke()
    // 身体
    ctx.beginPath()
    ctx.ellipse(cx, cy, s * 0.06, s * 0.55, 0, 0, Math.PI * 2)
    ctx.stroke()
    // 触角
    ctx.beginPath()
    ctx.moveTo(cx - s * 0.03, cy - s * 0.5)
    ctx.quadraticCurveTo(cx - s * 0.3, cy - s * 0.9, cx - s * 0.35, cy - s * 0.85)
    ctx.moveTo(cx + s * 0.03, cy - s * 0.5)
    ctx.quadraticCurveTo(cx + s * 0.3, cy - s * 0.9, cx + s * 0.35, cy - s * 0.85)
    ctx.stroke()
    // 翅膀装饰圆点
    ctx.beginPath()
    ctx.arc(cx - s * 0.5, cy - s * 0.3, s * 0.12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx + s * 0.5, cy - s * 0.3, s * 0.12, 0, Math.PI * 2)
    ctx.stroke()
  },

  // 保存画布快照
  saveSnapshot() {
    if (!this.canvas) return
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.snapshotList.push(imageData)
    // 最多保留30步
    if (this.snapshotList.length > 30) {
      this.snapshotList.shift()
    }
  },

  // 触摸事件
  onTouchStart(e) {
    if (!this.canvas) return
    this.isDrawing = true
    const touch = e.touches[0]
    this.lastX = touch.x
    this.lastY = touch.y

    // 画一个点
    const ctx = this.ctx
    ctx.beginPath()
    if (this.data.eraserMode) {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalCompositeOperation = 'source-over'
    }
    ctx.fillStyle = this.data.currentColor
    ctx.arc(touch.x, touch.y, this.data.currentSize / 2, 0, Math.PI * 2)
    ctx.fill()
  },

  onTouchMove(e) {
    if (!this.isDrawing || !this.canvas) return
    const touch = e.touches[0]
    const ctx = this.ctx

    if (this.data.eraserMode) {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalCompositeOperation = 'source-over'
    }

    ctx.beginPath()
    ctx.strokeStyle = this.data.currentColor
    ctx.lineWidth = this.data.currentSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(this.lastX, this.lastY)
    ctx.lineTo(touch.x, touch.y)
    ctx.stroke()

    this.lastX = touch.x
    this.lastY = touch.y
  },

  onTouchEnd() {
    if (this.isDrawing) {
      this.isDrawing = false
      this.saveSnapshot()
    }
  },

  // 撤销
  undo() {
    if (this.snapshotList.length <= 1) {
      wx.showToast({ title: '没有更多了', icon: 'none' })
      return
    }
    this.snapshotList.pop()
    const last = this.snapshotList[this.snapshotList.length - 1]
    this.ctx.putImageData(last, 0, 0)
  },

  // 清空
  clearCanvas() {
    wx.showModal({
      title: '确认清空',
      content: '清空后不可恢复，确定吗？',
      confirmColor: '#8EC5B9',
      success: (res) => {
        if (res.confirm) {
          const ctx = this.ctx
          ctx.globalCompositeOperation = 'source-over'
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
          this.drawTemplate(this.data.selectedTemplate)
          this.snapshotList = []
          this.saveSnapshot()
        }
      }
    })
  },

  // 橡皮擦切换
  toggleEraser() {
    this.setData({ eraserMode: !this.data.eraserMode })
  },

  // 换模板
  changeTemplate() {
    this.setData({ hasCanvas: false, selectedTemplate: '', selectedName: '', selectedIcon: '' })
    this.snapshotList = []
  },

  // 设置颜色
  setColor(e) {
    this.setData({
      currentColor: e.currentTarget.dataset.color,
      eraserMode: false
    })
  },

  // 设置画笔粗细
  setBrushSize(e) {
    this.setData({ currentSize: e.currentTarget.dataset.size })
  },

  // 保存画布
  saveCanvas() {
    wx.showLoading({ title: '保存中...' })
    const tempFilePath = `${wx.env.USER_DATA_PATH}/coloring_${Date.now()}.png`
    const fs = wx.getFileSystemManager()

    // 从canvas获取图片数据
    const imageData = this.canvas.toDataURL('image/png')
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')
    fs.writeFile({
      filePath: tempFilePath,
      data: base64,
      encoding: 'base64',
      success: () => {
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => {
            wx.hideLoading()
            wx.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail: (err) => {
            wx.hideLoading()
            if (err.errMsg.includes('deny') || err.errMsg.includes('auth')) {
              wx.showModal({
                title: '需要授权',
                content: '请允许访问相册以保存图片',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) wx.openSetting()
                }
              })
            }
          }
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    })
  }
})
