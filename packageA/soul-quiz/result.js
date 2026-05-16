// packageA/soul-quiz/result.js - 结果页

Page({
  data: {
    result: null,
    showPoster: false,
    posterImage: '',
    animalTempUrl: ''
  },

  onLoad: function (options) {
    if (options.data) {
      try {
        var result = JSON.parse(decodeURIComponent(options.data))
        this.setData({
          result: result,
          animalTempUrl: result.image || ''
        })
        this.drawRadar(result)
      } catch (e) {
        wx.showToast({ title: '数据加载失败', icon: 'none' })
      }
    }
  },

  // 绘制雷达图
  drawRadar: function (result) {
    var scores = result.scores
    var data = [
      { label: 'E', value: (scores.EI + 100) / 200 },
      { label: 'S', value: (scores.SN + 100) / 200 },
      { label: 'T', value: (scores.TF + 100) / 200 },
      { label: 'J', value: (scores.JP + 100) / 200 }
    ]

    var ctx = wx.createCanvasContext('radarCanvas', this)
    var centerX = 150
    var centerY = 150
    var maxR = 110

    // 背景网格（3层）
    for (var layer = 1; layer <= 3; layer++) {
      var r = maxR * layer / 3
      ctx.beginPath()
      for (var i = 0; i < 4; i++) {
        var angle = -Math.PI / 2 + (Math.PI * 2 * i / 4)
        var x = centerX + r * Math.cos(angle)
        var y = centerY + r * Math.sin(angle)
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.setStrokeStyle('#e8e8e8')
      ctx.setLineWidth(1)
      ctx.stroke()
    }

    // 轴线
    for (var i = 0; i < 4; i++) {
      var angle = -Math.PI / 2 + (Math.PI * 2 * i / 4)
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + maxR * Math.cos(angle), centerY + maxR * Math.sin(angle))
      ctx.setStrokeStyle('#e0e0e0')
      ctx.setLineWidth(1)
      ctx.stroke()
    }

    // 数据区域
    ctx.beginPath()
    for (var i = 0; i < 4; i++) {
      var angle = -Math.PI / 2 + (Math.PI * 2 * i / 4)
      var r = maxR * Math.max(0.05, data[i].value)
      var x = centerX + r * Math.cos(angle)
      var y = centerY + r * Math.sin(angle)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.setFillStyle('rgba(142, 197, 185, 0.25)')
    ctx.fill()
    ctx.setStrokeStyle('#8EC5B9')
    ctx.setLineWidth(2)
    ctx.stroke()

    // 数据点
    for (var i = 0; i < 4; i++) {
      var angle = -Math.PI / 2 + (Math.PI * 2 * i / 4)
      var r = maxR * Math.max(0.05, data[i].value)
      var x = centerX + r * Math.cos(angle)
      var y = centerY + r * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.setFillStyle('#8EC5B9')
      ctx.fill()
    }

    ctx.draw()
  },

  // 生成分享海报
  generatePoster: function () {
    var result = this.data.result
    if (!result) return

    wx.showLoading({ title: '生成中...' })

    var that = this
    var imageUrl = this.data.animalTempUrl

    // 先下载动物图片到本地
    if (imageUrl) {
      wx.downloadFile({
        url: imageUrl,
        success: function (dlRes) {
          that.doDrawPoster(dlRes.tempFilePath)
        },
        fail: function () {
          that.doDrawPoster('')
        }
      })
    } else {
      that.doDrawPoster('')
    }
  },

  doDrawPoster: function (localImagePath) {
    var result = this.data.result
    var that = this
    var ctx = wx.createCanvasContext('posterCanvas', this)
    var w = 600
    var h = 900

    // ===== 深色星空背景 =====
    var bgGrad = ctx.createLinearGradient(0, 0, 0, h)
    bgGrad.addColorStop(0, '#0a1628')
    bgGrad.addColorStop(0.4, '#152238')
    bgGrad.addColorStop(1, '#0a1628')
    ctx.setFillStyle(bgGrad)
    ctx.fillRect(0, 0, w, h)

    // 星星
    var stars = [
      [80, 50, 1.5], [200, 30, 1], [350, 70, 1.5], [500, 25, 1],
      [120, 160, 1], [450, 140, 1.5], [520, 80, 1], [60, 280, 1],
      [300, 100, 1], [180, 350, 1.5], [400, 300, 1], [540, 380, 1],
      [70, 500, 1.5], [250, 450, 1], [480, 470, 1.5], [160, 600, 1],
      [380, 550, 1], [100, 700, 1.5], [440, 650, 1], [520, 750, 1],
      [80, 800, 1], [300, 780, 1.5], [200, 850, 1], [500, 830, 1]
    ]
    ctx.setFillStyle('#ffffff')
    for (var s = 0; s < stars.length; s++) {
      ctx.setGlobalAlpha(0.2 + Math.random() * 0.4)
      ctx.beginPath()
      ctx.arc(stars[s][0], stars[s][1], stars[s][2], 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.setGlobalAlpha(1)

    // ===== 中心半透明卡片 =====
    var cardX = 40; var cardY = 48; var cardW = 520; var cardH = 780; var cardR = 24
    ctx.setFillStyle('rgba(255, 255, 255, 0.06)')
    ctx.beginPath()
    ctx.moveTo(cardX + cardR, cardY)
    ctx.lineTo(cardX + cardW - cardR, cardY)
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardR)
    ctx.lineTo(cardX + cardW, cardY + cardH - cardR)
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH)
    ctx.lineTo(cardX + cardR, cardY + cardH)
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR)
    ctx.lineTo(cardX, cardY + cardR)
    ctx.quadraticCurveTo(cardX, cardY, cardX + cardR, cardY)
    ctx.fill()
    ctx.setStrokeStyle('rgba(142, 197, 185, 0.2)')
    ctx.setLineWidth(1)
    ctx.stroke()

    // --- 绝对Y坐标布局（整体下移25px，底部收紧）---
    // 卡片范围: y=48 ~ y=828 (高780), 内容中心 ≈ y=470
    // 装饰线: y=105, 标题: y=137
    // 图片: top=180, size=130, bottom=310, circle r=80, center=245
    // MBTI: y=350, 动物名: y=390
    // 标签1: y=430, 标签2: y=458
    // 分隔线: y=490
    // 关键词: y=525
    // 摘要: y=563~739
    // 底部线: y=780, 品牌: y=804

    // ===== 顶部装饰线 y=105 =====
    var lineGrad = ctx.createLinearGradient(80, 0, w - 80, 0)
    lineGrad.addColorStop(0, 'rgba(142, 197, 185, 0)')
    lineGrad.addColorStop(0.5, 'rgba(142, 197, 185, 0.7)')
    lineGrad.addColorStop(1, 'rgba(142, 197, 185, 0)')
    ctx.setStrokeStyle(lineGrad)
    ctx.setLineWidth(1.5)
    ctx.beginPath()
    ctx.moveTo(80, 105)
    ctx.lineTo(w - 80, 105)
    ctx.stroke()

    // ===== 标题 y=137 =====
    ctx.setFillStyle('rgba(255, 255, 255, 0.5)')
    ctx.setFontSize(20)
    ctx.setTextAlign('center')
    ctx.fillText('- 我的灵魂画像 -', w / 2, 137)
    ctx.setFontSize(14)
    ctx.setFillStyle('rgba(142, 197, 185, 0.4)')
    ctx.fillText('✦', 150, 137)
    ctx.fillText('✦', 450, 137)

    // ===== 动物头像 top=180, size=130 =====
    var imgSize = 130
    var imgTop = 180
    if (localImagePath) {
      ctx.setFillStyle('#1a2d45')
      ctx.beginPath()
      ctx.arc(w / 2, imgTop + imgSize / 2, 80, 0, Math.PI * 2)
      ctx.fill()
      ctx.setStrokeStyle('rgba(142, 197, 185, 0.3)')
      ctx.setLineWidth(1.5)
      ctx.stroke()
      ctx.drawImage(localImagePath, w / 2 - imgSize / 2, imgTop, imgSize, imgSize)
    }

    // ===== MBTI 类型 y=380 =====
    ctx.setFillStyle('#ffffff')
    ctx.setFontSize(48)
    ctx.setTextAlign('center')
    ctx.fillText(result.mbti_type, w / 2, 380)

    // ===== 动物名 y=418 =====
    ctx.setFontSize(24)
    ctx.setFillStyle('rgba(142, 197, 185, 0.85)')
    ctx.fillText(result.animal, w / 2, 418)

    // ===== 职场/奇幻标签 y=456, y=484 =====
    ctx.setFontSize(16)
    ctx.setFillStyle('rgba(255, 255, 255, 0.45)')
    ctx.fillText('职场人设：' + result.workplace, w / 2, 456)
    ctx.fillText('奇幻角色：' + result.fantasy, w / 2, 484)

    // ===== 分隔线 y=516 =====
    var sepGrad = ctx.createLinearGradient(100, 0, w - 100, 0)
    sepGrad.addColorStop(0, 'rgba(142, 197, 185, 0)')
    sepGrad.addColorStop(0.5, 'rgba(142, 197, 185, 0.3)')
    sepGrad.addColorStop(1, 'rgba(142, 197, 185, 0)')
    ctx.setStrokeStyle(sepGrad)
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(100, 516)
    ctx.lineTo(w - 100, 516)
    ctx.stroke()

    // ===== 关键词标签 y=538 =====
    var keywords = result.keywords || []
    ctx.setTextAlign('center')
    var kwGap = 12
    var kwPads = []
    var totalKwWidth = 0
    for (var i = 0; i < keywords.length; i++) {
      ctx.setFontSize(15)
      var tw = ctx.measureText(keywords[i]).width
      kwPads.push(tw + 22)
      totalKwWidth += tw + 22 + (i < keywords.length - 1 ? kwGap : 0)
    }
    var kwX = (w - totalKwWidth) / 2
    for (var i = 0; i < keywords.length; i++) {
      var kwW = kwPads[i]
      ctx.setFillStyle('rgba(142, 197, 185, 0.12)')
      ctx.beginPath()
      var rr = 8; var bh = 28; var by = 550 - 14
      ctx.moveTo(kwX + rr, by)
      ctx.lineTo(kwX + kwW - rr, by)
      ctx.quadraticCurveTo(kwX + kwW, by, kwX + kwW, by + rr)
      ctx.lineTo(kwX + kwW, by + bh - rr)
      ctx.quadraticCurveTo(kwX + kwW, by + bh, kwX + kwW - rr, by + bh)
      ctx.lineTo(kwX + rr, by + bh)
      ctx.quadraticCurveTo(kwX, by + bh, kwX, by + bh - rr)
      ctx.lineTo(kwX, by + rr)
      ctx.quadraticCurveTo(kwX, by, kwX + rr, by)
      ctx.fill()
      ctx.setFontSize(15)
      ctx.setFillStyle('rgba(142, 197, 185, 0.85)')
      ctx.fillText(keywords[i], kwX + kwW / 2, 550 + 5)
      kwX += kwW + kwGap
    }

    // ===== 性格摘要 y=575 起 =====
    ctx.setTextAlign('center')
    ctx.setFontSize(17)
    ctx.setFillStyle('rgba(255, 255, 255, 0.5)')
    var analysis = result.analysis || ''
    var line = ''
    var summaryY = 588
    var maxWidth = w - 160
    var lineCount = 0
    for (var c = 0; c < analysis.length; c++) {
      line += analysis[c]
      if (ctx.measureText(line).width > maxWidth) {
        ctx.fillText(line, w / 2, summaryY)
        summaryY += 28
        line = ''
        lineCount++
        if (lineCount >= 7) break
      }
    }
    if (line && lineCount < 7) {
      ctx.fillText(line, w / 2, summaryY)
    }

    // ===== 底部装饰线 y=780 =====
    var btmGrad = ctx.createLinearGradient(80, 0, w - 80, 0)
    btmGrad.addColorStop(0, 'rgba(142, 197, 185, 0)')
    btmGrad.addColorStop(0.5, 'rgba(142, 197, 185, 0.3)')
    btmGrad.addColorStop(1, 'rgba(142, 197, 185, 0)')
    ctx.setStrokeStyle(btmGrad)
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(80, 780)
    ctx.lineTo(w - 80, 780)
    ctx.stroke()

    // ===== 底部品牌 y=804 =====
    ctx.setFillStyle('rgba(255, 255, 255, 0.2)')
    ctx.setFontSize(14)
    ctx.setTextAlign('center')
    ctx.fillText('源能量 · 灵魂画像', w / 2, 804)

    ctx.draw(false, function () {
      wx.canvasToTempFilePath({
        canvasId: 'posterCanvas',
        success: function (res) {
          wx.hideLoading()
          that.setData({ showPoster: true, posterImage: res.tempFilePath })
        },
        fail: function () {
          wx.hideLoading()
          wx.showToast({ title: '生成失败', icon: 'none' })
        }
      }, that)
    })
  },

  // 保存海报到相册
  savePoster: function () {
    var that = this
    wx.saveImageToPhotosAlbum({
      filePath: that.data.posterImage,
      success: function () {
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      },
      fail: function (err) {
        if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要授权保存图片到相册',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      }
    })
  },

  // 关闭海报预览
  closePoster: function () {
    this.setData({ showPoster: false })
  },

  // 查看历史
  goHistory: function () {
    wx.navigateTo({ url: '/packageA/soul-quiz/history' })
  },

  // 重新测试
  retryQuiz: function () {
    wx.redirectTo({ url: '/packageA/soul-quiz/quiz' })
  }
})
