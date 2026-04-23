// packageB/pages/watermark-remove/watermark-remove.js
var watermark = require('../../../utils/watermark.js')

Page({
  data: {
    hasImage: false,
    imageSrc: '',
    imageWidth: 0,
    imageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    imgDisplayX: 0,
    imgDisplayY: 0,
    imgDisplayW: 0,
    imgDisplayH: 0,
    displayScale: 1,
    brushSize: 20,
    canUndo: false,
    hasMask: false,
    isProcessing: false,
    resultSrc: '',
    showResult: false
  },

  _canvas: null,
  _ctx: null,
  _strokes: [],
  _maskData: null,
  _currentStroke: null,
  _isDrawing: false,
  _lastImgX: 0,
  _lastImgY: 0,
  _img: null,
  _canvasLeft: 0,
  _canvasTop: 0,

  // Choose image from album or camera
  chooseImage: function () {
    var self = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePath = res.tempFiles[0].tempFilePath
        wx.getImageInfo({
          src: tempFilePath,
          success: function (info) {
            self.setData({
              imageSrc: tempFilePath,
              imageWidth: info.width,
              imageHeight: info.height,
              hasImage: true,
              showResult: false,
              resultSrc: ''
            })
            setTimeout(function () {
              self.initCanvas()
            }, 300)
          },
          fail: function () {
            wx.showToast({ title: '图片加载失败', icon: 'none' })
          }
        })
      },
      fail: function () {
        // User cancelled
      }
    })
  },

  // Initialize canvas and load image
  initCanvas: function () {
    var self = this

    // First get container dimensions
    var containerQuery = wx.createSelectorQuery()
    containerQuery.select('.canvas-container').boundingClientRect()
    containerQuery.exec(function (cRes) {
      if (!cRes || !cRes[0]) {
        wx.showToast({ title: 'Canvas 初始化失败', icon: 'none' })
        return
      }

      var containerWidth = cRes[0].width
      var containerHeight = cRes[0].height

      if (containerWidth <= 0 || containerHeight <= 0) {
        // Container not ready, retry
        setTimeout(function () { self.initCanvas() }, 200)
        return
      }

      // Set canvas display size first
      self.setData({
        canvasWidth: containerWidth,
        canvasHeight: containerHeight
      })

      // Then query the canvas node
      setTimeout(function () {
        var query = wx.createSelectorQuery()
        query.select('#displayCanvas').fields({ node: true })
        query.select('#displayCanvas').boundingClientRect()
        query.exec(function (res) {
          if (!res || !res[0] || !res[1]) {
            wx.showToast({ title: 'Canvas 初始化失败', icon: 'none' })
            return
          }

          var canvas = res[0].node
          var ctx = canvas.getContext('2d')
          var rect = res[1]
          var dpr = wx.getWindowInfo().pixelRatio

          var imgW = self.data.imageWidth
          var imgH = self.data.imageHeight

          var scale = Math.min(containerWidth / imgW, containerHeight / imgH)
          var displayW = Math.floor(imgW * scale)
          var displayH = Math.floor(imgH * scale)
          var offsetX = Math.floor((containerWidth - displayW) / 2)
          var offsetY = Math.floor((containerHeight - displayH) / 2)

          canvas.width = containerWidth * dpr
          canvas.height = containerHeight * dpr
          ctx.scale(dpr, dpr)

          self._canvas = canvas
          self._ctx = ctx
          self._canvasLeft = rect.left
          self._canvasTop = rect.top

          // Initialize mask data (image pixel coordinates)
          self._maskData = new Uint8Array(imgW * imgH)
          self._strokes = []

          var img = canvas.createImage()
          img.src = self.data.imageSrc
          img.onload = function () {
            self._img = img
            self.setData({
              imgDisplayX: offsetX,
              imgDisplayY: offsetY,
              imgDisplayW: displayW,
              imgDisplayH: displayH,
              displayScale: scale,
              canUndo: false,
              hasMask: false
            })
            self.renderCanvas()
          }
          img.onerror = function () {
            wx.showToast({ title: '图片加载失败', icon: 'none' })
          }
        })
      }, 100)
    })
  },

  // Render canvas with image and mask overlay
  renderCanvas: function () {
    if (!this._ctx || !this._img) return

    var ctx = this._ctx
    var canvas = this._canvas
    var dpr = wx.getWindowInfo().pixelRatio
    var cw = this.data.canvasWidth
    var ch = this.data.canvasHeight

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Draw dark background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, cw, ch)

    // Draw image
    ctx.drawImage(
      this._img,
      0, 0, this.data.imageWidth, this.data.imageHeight,
      this.data.imgDisplayX, this.data.imgDisplayY,
      this.data.imgDisplayW, this.data.imgDisplayH
    )

    // Draw mask overlay (red semi-transparent)
    if (this._maskData) {
      var imgW = this.data.imageWidth
      var imgH = this.data.imageHeight
      var scale = this.data.displayScale
      var offsetX = this.data.imgDisplayX
      var offsetY = this.data.imgDisplayY

      ctx.save()
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'

      for (var y = 0; y < imgH; y++) {
        for (var x = 0; x < imgW; x++) {
          var idx = y * imgW + x
          if (this._maskData[idx] === 1) {
            var displayX = Math.floor(x * scale + offsetX)
            var displayY = Math.floor(y * scale + offsetY)
            var size = Math.max(1, Math.ceil(scale))
            ctx.fillRect(displayX, displayY, size, size)
          }
        }
      }

      ctx.restore()
    }
  },

  // Touch start - begin drawing mask
  onTouchStart: function (e) {
    if (!this._ctx || e.touches.length !== 1) return

    var touch = e.touches[0]
    var localX = touch.clientX - this._canvasLeft
    var localY = touch.clientY - this._canvasTop

    var imgCoords = this._displayToImageCoords(localX, localY)
    if (!imgCoords) return

    this._isDrawing = true
    this._lastImgX = imgCoords.imgX
    this._lastImgY = imgCoords.imgY

    // Start new stroke
    this._currentStroke = {
      points: [{ x: imgCoords.imgX, y: imgCoords.imgY }],
      brushSize: this.data.brushSize
    }

    // Paint circle on mask
    this._addCircleToMask(imgCoords.imgX, imgCoords.imgY, Math.ceil(this.data.brushSize / 2 / this.data.displayScale))
    this.renderCanvas()
  },

  // Touch move - continue drawing mask with interpolation
  onTouchMove: function (e) {
    if (!this._isDrawing || e.touches.length !== 1) return

    var touch = e.touches[0]
    var localX = touch.clientX - this._canvasLeft
    var localY = touch.clientY - this._canvasTop

    var imgCoords = this._displayToImageCoords(localX, localY)
    if (!imgCoords) return

    // Interpolate between last point and current point
    var lastX = this._lastImgX
    var lastY = this._lastImgY
    var currX = imgCoords.imgX
    var currY = imgCoords.imgY

    var distance = Math.sqrt(Math.pow(currX - lastX, 2) + Math.pow(currY - lastY, 2))
    var step = Math.max(1, Math.floor(this.data.brushSize / 4 / this.data.displayScale))

    if (distance > step) {
      var steps = Math.floor(distance / step)
      for (var i = 0; i <= steps; i++) {
        var t = i / steps
        var interpX = Math.round(lastX + (currX - lastX) * t)
        var interpY = Math.round(lastY + (currY - lastY) * t)
        this._addCircleToMask(interpX, interpY, Math.ceil(this.data.brushSize / 2 / this.data.displayScale))
      }
    } else {
      this._addCircleToMask(currX, currY, Math.ceil(this.data.brushSize / 2 / this.data.displayScale))
    }

    // Add point to current stroke
    if (this._currentStroke) {
      this._currentStroke.points.push({ x: currX, y: currY })
    }

    this._lastImgX = currX
    this._lastImgY = currY
    this.renderCanvas()
  },

  // Touch end - finish stroke
  onTouchEnd: function (e) {
    if (!this._isDrawing) return

    this._isDrawing = false

    if (this._currentStroke && this._currentStroke.points.length > 0) {
      this._strokes.push(this._currentStroke)
      this.setData({
        canUndo: true,
        hasMask: true
      })
    }

    this._currentStroke = null
  },

  // Convert display canvas coordinates to image pixel coordinates
  _displayToImageCoords: function (localX, localY) {
    var imgLocalX = localX - this.data.imgDisplayX
    var imgLocalY = localY - this.data.imgDisplayY

    if (imgLocalX < 0 || imgLocalX > this.data.imgDisplayW ||
        imgLocalY < 0 || imgLocalY > this.data.imgDisplayH) {
      return null
    }

    var imgX = Math.round(imgLocalX / this.data.displayScale)
    var imgY = Math.round(imgLocalY / this.data.displayScale)

    // Clamp to image bounds
    imgX = Math.max(0, Math.min(imgX, this.data.imageWidth - 1))
    imgY = Math.max(0, Math.min(imgY, this.data.imageHeight - 1))

    return { imgX: imgX, imgY: imgY }
  },

  // Add a circle to the mask
  _addCircleToMask: function (centerX, centerY, radius) {
    var imgW = this.data.imageWidth
    var imgH = this.data.imageHeight
    var rSquared = radius * radius

    for (var dy = -radius; dy <= radius; dy++) {
      for (var dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= rSquared) {
          var x = centerX + dx
          var y = centerY + dy

          if (x >= 0 && x < imgW && y >= 0 && y < imgH) {
            var idx = y * imgW + x
            this._maskData[idx] = 1
          }
        }
      }
    }
  },

  // Rebuild mask from strokes
  _rebuildMaskFromStrokes: function () {
    var imgW = this.data.imageWidth
    var imgH = this.data.imageHeight

    // Clear mask
    this._maskData = new Uint8Array(imgW * imgH)

    // Rebuild from strokes
    for (var i = 0; i < this._strokes.length; i++) {
      var stroke = this._strokes[i]
      var radius = Math.ceil(stroke.brushSize / 2 / this.data.displayScale)

      for (var j = 0; j < stroke.points.length; j++) {
        var point = stroke.points[j]
        this._addCircleToMask(point.x, point.y, radius)
      }
    }
  },

  // Undo last stroke
  undoStroke: function () {
    if (this._strokes.length === 0) return

    this._strokes.pop()
    this._rebuildMaskFromStrokes()
    this.renderCanvas()

    this.setData({
      canUndo: this._strokes.length > 0,
      hasMask: this._strokes.length > 0
    })
  },

  // Clear all mask
  clearMask: function () {
    if (!this.data.hasMask) return

    this._strokes = []
    this._maskData = new Uint8Array(this.data.imageWidth * this.data.imageHeight)
    this.renderCanvas()

    this.setData({
      canUndo: false,
      hasMask: false
    })
  },

  // Brush size slider
  onBrushSizeChange: function (e) {
    this.setData({
      brushSize: parseInt(e.detail.value)
    })
  },

  // Start inpainting process
  startInpainting: function () {
    if (!this.data.hasMask) {
      wx.showToast({ title: '请先涂抹水印区域', icon: 'none' })
      return
    }

    var self = this
    self.setData({ isProcessing: true })
    wx.showLoading({ title: '处理中...' })

    // Initialize hidden process canvas at full resolution
    var query = wx.createSelectorQuery()
    query.select('#processCanvas').fields({ node: true })
    query.exec(function (res) {
      if (!res || !res[0]) {
        wx.hideLoading()
        self.setData({ isProcessing: false })
        wx.showToast({ title: '处理失败', icon: 'none' })
        return
      }

      var canvas = res[0].node
      var ctx = canvas.getContext('2d')

      var imgW = self.data.imageWidth
      var imgH = self.data.imageHeight

      // Set canvas to original image dimensions (no DPR scaling)
      canvas.width = imgW
      canvas.height = imgH

      var img = canvas.createImage()
      img.src = self.data.imageSrc
      img.onload = function () {
        // Draw image
        ctx.drawImage(img, 0, 0, imgW, imgH)

        // Get image data
        var imageData = ctx.getImageData(0, 0, imgW, imgH)

        // Call inpainting function
        watermark.inpaintRegion(imageData.data, self._maskData, imgW, imgH)

        // Put modified image data back
        ctx.putImageData(imageData, 0, 0)

        // Export to temp file
        wx.canvasToTempFilePath({
          canvas: canvas,
          fileType: 'jpg',
          quality: 0.95,
          success: function (tempRes) {
            wx.hideLoading()
            self.setData({
              resultSrc: tempRes.tempFilePath,
              showResult: true,
              isProcessing: false
            })
          },
          fail: function () {
            wx.hideLoading()
            self.setData({ isProcessing: false })
            wx.showToast({ title: '处理失败', icon: 'none' })
          }
        })
      }
      img.onerror = function () {
        wx.hideLoading()
        self.setData({ isProcessing: false })
        wx.showToast({ title: '图片加载失败', icon: 'none' })
      }
    })
  },

  // Save result image to album
  saveImage: function () {
    var self = this

    if (!self.data.resultSrc) {
      wx.showToast({ title: '没有可保存的图片', icon: 'none' })
      return
    }

    wx.saveImageToPhotosAlbum({
      filePath: self.data.resultSrc,
      success: function () {
        wx.showToast({ title: '保存成功', icon: 'success' })
      },
      fail: function (err) {
        if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要相册权限才能保存图片，请在设置中开启',
            confirmText: '去设置',
            confirmColor: '#8EC5B9',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  },

  // Retry editing
  retryEditing: function () {
    this.setData({
      showResult: false,
      resultSrc: ''
    })
  }
})
