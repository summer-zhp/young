// packageA/pages/werun/werun.js - 微信运动步数可视化
const { cloud } = require('../../utils/cloud')

const systemInfo = wx.getWindowInfo()
const CHART_HEIGHT_PX = 200

Page({
  data: {
    // 授权状态
    isAuthorized: false,
    authDenied: false,

    // 数据状态
    isLoading: false,
    stepInfoList: [],
    errorMsg: '',

    // 统计数据
    totalSteps: '0',
    avgSteps: '0',
    maxSteps: '0',

    // 图表
    chartType: 'bar',
    chartWidth: 0,
    chartHeight: 0,

    // Tooltip
    tooltipVisible: false,
    tooltipX: 0,
    tooltipY: 0,
    tooltipDate: '',
    tooltipStep: ''
  },

  // Canvas 相关
  canvas: null,
  ctx: null,
  chartData: [],

  onLoad() {
    this.checkAuth()
  },

  // ===== 授权流程 =====

  checkAuth() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.werun']) {
          this.setData({ isAuthorized: true })
          this.loadWeRunData()
        } else {
          this.setData({ isAuthorized: false })
        }
      }
    })
  },

  requestAuth() {
    wx.authorize({
      scope: 'scope.werun',
      success: () => {
        this.setData({ isAuthorized: true, authDenied: false })
        this.loadWeRunData()
      },
      fail: () => {
        this.setData({ authDenied: true })
        wx.showToast({ title: '需要授权才能查看运动数据', icon: 'none' })
      }
    })
  },

  onSettingCallback(res) {
    if (res.detail.authSetting['scope.werun']) {
      this.setData({ isAuthorized: true, authDenied: false })
      this.loadWeRunData()
    }
  },

  // ===== 数据获取 =====

  async loadWeRunData() {
    this.setData({ isLoading: true, errorMsg: '' })

    try {
      // 1. 先登录
      await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })

      // 2. 调用 wx.getWeRunData 获取 cloudID
      const werunRes = await new Promise((resolve, reject) => {
        wx.getWeRunData({
          success: resolve,
          fail: reject
        })
      })

      // 3. 通过云函数解密数据
      const result = await cloud.callFunction('getWeRunData', {
        cloudID: werunRes.cloudID
      }).catch(() => {
        throw { errMsg: 'cloudFunctionError' }
      })

      if (!result.success) {
        throw { errMsg: 'cloudFunctionError' }
      }

      const stepInfoList = result.stepInfoList || []

      // 4. 处理数据
      this.processStepData(stepInfoList)

    } catch (err) {
      console.error('获取微信运动数据失败:', err)
      let msg = '获取运动数据失败，请确保已开启微信运动'
      if (err.errMsg && err.errMsg.indexOf('auth deny') > -1) {
        msg = '请授权后查看运动数据'
      } else if (err.errMsg && err.errMsg.indexOf('not support') > -1) {
        msg = '当前设备不支持微信运动'
      } else if (err.errMsg === 'cloudFunctionError') {
        msg = '网络异常，请稍后重试'
      }
      this.setData({ isLoading: false, errorMsg: msg })
    }
  },

  processStepData(rawList) {
    if (!rawList.length) {
      this.setData({ isLoading: false })
      return
    }

    // 按时间升序排列
    rawList.sort((a, b) => a.timestamp - b.timestamp)

    const maxStep = Math.max(...rawList.map(item => item.step), 1)
    const totalStep = rawList.reduce((sum, item) => sum + item.step, 0)
    const avgStep = Math.round(totalStep / rawList.length)

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    const stepInfoList = rawList.map(item => {
      const date = new Date(item.timestamp * 1000)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekDay = weekDays[date.getDay()]
      const barPercent = Math.round((item.step / maxStep) * 100)

      return {
        timestamp: item.timestamp,
        step: item.step,
        dateStr: `${month}/${day}`,
        weekStr: weekDay,
        fullDate: `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        stepStr: item.step.toLocaleString(),
        barPercent
      }
    })

    this.chartData = stepInfoList

    this.setData({
      isLoading: false,
      stepInfoList,
      totalSteps: totalStep.toLocaleString(),
      avgSteps: avgStep.toLocaleString(),
      maxSteps: maxStep.toLocaleString()
    })

    // 初始化 Canvas 并绘制图表
    this.initCanvas()
  },

  // ===== Canvas 图表 =====

  initCanvas() {
    const query = this.createSelectorQuery()
    query.select('#stepChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        const dataCount = this.chartData.length
        // 每个数据点至少 24px 宽度，保证可读性
        const minWidthPx = Math.max(dataCount * 24, systemInfo.windowWidth - 64)
        const widthPx = minWidthPx

        const dpr = wx.getWindowInfo().pixelRatio
        canvas.width = widthPx * dpr
        canvas.height = CHART_HEIGHT_PX * dpr
        ctx.scale(dpr, dpr)

        this.canvas = canvas
        this.ctx = ctx

        this.setData({
          chartWidth: widthPx,
          chartHeight: CHART_HEIGHT_PX
        })

        this.drawChart()
      })
  },

  drawChart() {
    const ctx = this.ctx
    if (!ctx || !this.chartData.length) return

    const data = this.chartData
    const width = this.data.chartWidth
    const height = CHART_HEIGHT_PX

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    if (this.data.chartType === 'bar') {
      this.drawBarChart(ctx, data, width, height)
    } else {
      this.drawLineChart(ctx, data, width, height)
    }
  },

  drawBarChart(ctx, data, width, height) {
    const padding = { top: 20, right: 16, bottom: 36, left: 16 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const barWidth = Math.min(chartW / data.length * 0.6, 20)
    const gap = chartW / data.length
    const maxVal = Math.max(...data.map(d => d.step), 1)

    // 绘制 Y 轴参考线
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // 绘制柱子
    data.forEach((item, index) => {
      const x = padding.left + gap * index + (gap - barWidth) / 2
      const barH = (item.step / maxVal) * chartH
      const y = padding.top + chartH - barH

      // 渐变填充
      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartH)
      gradient.addColorStop(0, '#8EC5B9')
      gradient.addColorStop(1, 'rgba(142, 197, 185, 0.3)')

      ctx.fillStyle = gradient
      // 圆角柱子
      const radius = Math.min(barWidth / 2, 4)
      this.roundRect(ctx, x, y, barWidth, barH, radius)
      ctx.fill()

      // X 轴日期（隔几个显示）
      if (index % Math.ceil(data.length / 8) === 0 || index === data.length - 1) {
        ctx.fillStyle = '#999'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(item.dateStr, x + barWidth / 2, height - 8)
      }
    })
  },

  drawLineChart(ctx, data, width, height) {
    const padding = { top: 20, right: 16, bottom: 36, left: 16 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const gap = data.length > 1 ? chartW / (data.length - 1) : 0
    const maxVal = Math.max(...data.map(d => d.step), 1)

    const points = data.map((item, index) => ({
      x: padding.left + gap * index,
      x: padding.left + gap * index,
      y: padding.top + chartH - (item.step / maxVal) * chartH
    }))

    // 绘制 Y 轴参考线
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // 填充区域渐变
    ctx.beginPath()
    ctx.moveTo(points[0].x, padding.top + chartH)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
    gradient.addColorStop(0, 'rgba(142, 197, 185, 0.3)')
    gradient.addColorStop(1, 'rgba(142, 197, 185, 0.02)')
    ctx.fillStyle = gradient
    ctx.fill()

    // 绘制折线
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.strokeStyle = '#8EC5B9'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 绘制数据点
    points.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#8EC5B9'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })

    // X 轴日期
    data.forEach((item, index) => {
      if (index % Math.ceil(data.length / 8) === 0 || index === data.length - 1) {
        ctx.fillStyle = '#999'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        const x = padding.left + gap * index
        ctx.fillText(item.dateStr, x, height - 8)
      }
    })
  },

  roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2)
    if (h < 1) { h = 1; y = y + h - 1; }
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  },

  // ===== 交互 =====

  switchChart(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.chartType) return

    this.setData({ chartType: type })
    this.drawChart()
  },

  onCanvasTouch(e) {
    if (!this.chartData.length || !e.touches.length) return

    const touch = e.touches[0]
    const data = this.chartData
    const width = this.data.chartWidth
    const height = CHART_HEIGHT_PX
    const padding = { top: 20, right: 16, bottom: 36, left: 16 }
    const chartW = width - padding.left - padding.right

    const gap = this.data.chartType === 'bar'
      ? chartW / data.length
      : chartW / (data.length - 1 || 1)

    const offsetX = touch.x
    let index

    if (this.data.chartType === 'bar') {
      index = Math.floor((offsetX - padding.left) / gap)
    } else {
      index = Math.round((offsetX - padding.left) / gap)
    }

    if (index < 0 || index >= data.length) {
      this.setData({ tooltipVisible: false })
      return
    }

    const item = data[index]
    // 将 px 坐标转为 rpx 用于 tooltip 定位，并限制在屏幕范围内
    const rpxRatio = 750 / systemInfo.windowWidth
    const rawX = Math.round(touch.clientX * rpxRatio - 80)
    const rawY = Math.round(touch.clientY * rpxRatio - 120)
    const tooltipX = Math.max(20, Math.min(rawX, 590))
    const tooltipY = Math.max(40, Math.min(rawY, 1200))

    this.setData({
      tooltipVisible: true,
      tooltipX,
      tooltipY,
      tooltipDate: item.fullDate,
      tooltipStep: item.step.toLocaleString()
    })
  },

  onTouchEnd() {
    this.setData({ tooltipVisible: false })
  }
})
