// packageB/pages/image-editor/image-editor.js
var FILTERS = [
  { name: '原图', css: '' },
  { name: '日系清新', css: 'brightness(1.1) saturate(0.8) sepia(0.1)' },
  { name: 'INS风', css: 'contrast(0.85) saturate(0.9) brightness(1.05)' },
  { name: '港风复古', css: 'sepia(0.25) saturate(1.3) contrast(1.1)' },
  { name: '电影感', css: 'saturate(0.7) contrast(1.2) hue-rotate(-10deg)' },
  { name: '鲜明', css: 'saturate(1.5) contrast(1.15) brightness(1.05)' },
  { name: '黑白经典', css: 'grayscale(1) contrast(1.15)' }
]

Page({
  data: {
    // Image
    imageSrc: '',
    imageWidth: 0,
    imageHeight: 0,
    hasImage: false,

    // Edit mode
    editMode: 'adjust',

    // Adjust params (percentage, 100 = no change)
    brightness: 100,
    contrast: 100,
    saturate: 100,

    // Filter
    filterIndex: 0,
    filters: FILTERS,
    filterIntensity: 100,

    // Crop
    cropRatio: 'free',
    cropBox: null,
    isCropping: false,

    // Undo
    prevParams: null,
    canUndo: false,

    // Canvas
    canvasWidth: 0,
    canvasHeight: 0,
    imgDisplayX: 0,
    imgDisplayY: 0,
    imgDisplayW: 0,
    imgDisplayH: 0,
    displayScale: 1
  },

  _canvas: null,
  _ctx: null,
  _img: null,

  _cropTouchCorner: '',
  _cropStartX: 0,
  _cropStartY: 0,
  _cropStartBox: null,

  // Choose image from album or camera
  chooseImage: function () {
    var self = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePath = res.tempFilePaths[0]
        wx.getImageInfo({
          src: tempFilePath,
          success: function (info) {
            self.setData({
              imageSrc: tempFilePath,
              imageWidth: info.width,
              imageHeight: info.height,
              hasImage: true
            })
            setTimeout(function () {
              self.initCanvas()
            }, 300)
          }
        })
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

      // Set canvas display size first so the node query can find it
      self.setData({
        canvasWidth: containerWidth,
        canvasHeight: containerHeight
      })

      // Then query the canvas node
      setTimeout(function () {
        var query = wx.createSelectorQuery()
        query.select('#editorCanvas').fields({ node: true })
        query.exec(function (res) {
          if (!res || !res[0]) {
            wx.showToast({ title: 'Canvas 初始化失败', icon: 'none' })
            return
          }

          var canvas = res[0].node
          var ctx = canvas.getContext('2d')
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

          var img = canvas.createImage()
          img.src = self.data.imageSrc
          img.onload = function () {
            self._img = img
            self.setData({
              imgDisplayX: offsetX,
              imgDisplayY: offsetY,
              imgDisplayW: displayW,
              imgDisplayH: displayH,
              displayScale: scale
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

  // Parse a CSS filter string into { func: value } map
  _parseFilterCSS: function (css) {
    var map = {}
    if (!css) return map
    var regex = /(\w[\w-]*)\(([^)]+)\)/g
    var match
    while ((match = regex.exec(css)) !== null) {
      var func = match[1]
      var val = parseFloat(match[2])
      map[func] = val
    }
    return map
  },

  // Identity values for each filter function (no-effect value)
  _filterIdentity: {
    'brightness': 1,
    'contrast': 1,
    'saturate': 1,
    'sepia': 0,
    'grayscale': 0,
    'hue-rotate': 0,
    'invert': 0,
    'blur': 0,
    'opacity': 1
  },

  // Build the combined CSS filter string with intensity
  getFilterString: function () {
    var parts = []
    var b = this.data.brightness / 100
    var c = this.data.contrast / 100
    var s = this.data.saturate / 100

    // If a filter preset is selected, merge its values with user adjustments
    var idx = this.data.filterIndex
    var intensity = this.data.filterIntensity / 100

    if (idx > 0 && intensity > 0) {
      var presetMap = this._parseFilterCSS(FILTERS[idx].css)
      // Interpolate each preset value towards identity
      var presetParts = []
      var funcs = Object.keys(presetMap)
      for (var i = 0; i < funcs.length; i++) {
        var func = funcs[i]
        var target = presetMap[func]
        var identity = this._filterIdentity[func] || 0
        var val = identity + (target - identity) * intensity

        // Merge user brightness/contrast/saturate with preset
        if (func === 'brightness') {
          val = val * b
        } else if (func === 'contrast') {
          val = val * c
        } else if (func === 'saturate') {
          val = val * s
        }
        presetParts.push(func + '(' + val + ')')
      }

      // Add user adjustments for params not covered by preset
      if (presetMap['brightness'] === undefined) presetParts.push('brightness(' + b + ')')
      if (presetMap['contrast'] === undefined) presetParts.push('contrast(' + c + ')')
      if (presetMap['saturate'] === undefined) presetParts.push('saturate(' + s + ')')

      return presetParts.join(' ')
    }

    // No filter preset — just user adjustments
    parts.push('brightness(' + b + ')')
    parts.push('contrast(' + c + ')')
    parts.push('saturate(' + s + ')')
    return parts.join(' ')
  },

  // Render image on canvas with current filters
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

    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, cw, ch)

    ctx.filter = this.getFilterString()

    ctx.drawImage(
      this._img,
      0, 0, this.data.imageWidth, this.data.imageHeight,
      this.data.imgDisplayX, this.data.imgDisplayY,
      this.data.imgDisplayW, this.data.imgDisplayH
    )

    ctx.filter = 'none'
  },

  // Switch edit tab
  switchTab: function (e) {
    var mode = e.currentTarget.dataset.mode
    if (mode === 'crop' && !this.data.cropBox) {
      this.initCropBox()
    }
    this.setData({ editMode: mode })
  },

  // Save current params for undo before any change
  savePrevParams: function () {
    this.setData({
      prevParams: {
        brightness: this.data.brightness,
        contrast: this.data.contrast,
        saturate: this.data.saturate,
        filterIndex: this.data.filterIndex,
        filterIntensity: this.data.filterIntensity
      },
      canUndo: true
    })
  },

  // Brightness slider
  onBrightnessChange: function (e) {
    this.savePrevParams()
    this.setData({ brightness: e.detail.value })
    this.renderCanvas()
  },

  // Contrast slider
  onContrastChange: function (e) {
    this.savePrevParams()
    this.setData({ contrast: e.detail.value })
    this.renderCanvas()
  },

  // Saturate slider
  onSaturateChange: function (e) {
    this.savePrevParams()
    this.setData({ saturate: e.detail.value })
    this.renderCanvas()
  },

  // Select filter preset
  onFilterSelect: function (e) {
    var index = parseInt(e.currentTarget.dataset.index)
    this.savePrevParams()
    this.setData({ filterIndex: index, filterIntensity: 100 })
    this.renderCanvas()
  },

  // Filter intensity slider
  onFilterIntensityChange: function (e) {
    this.savePrevParams()
    this.setData({ filterIntensity: e.detail.value })
    this.renderCanvas()
  },

  // Initialize crop box centered on the image
  initCropBox: function () {
    var imgW = this.data.imgDisplayW
    var imgH = this.data.imgDisplayH
    var imgX = this.data.imgDisplayX
    var imgY = this.data.imgDisplayY

    var cropW = Math.floor(imgW * 0.8)
    var cropH = Math.floor(imgH * 0.8)
    var cropX = imgX + Math.floor((imgW - cropW) / 2)
    var cropY = imgY + Math.floor((imgH - cropH) / 2)

    this.setData({
      cropBox: {
        left: cropX,
        top: cropY,
        width: cropW,
        height: cropH
      },
      cropRatio: 'free'
    })
  },

  // Select crop ratio
  onRatioSelect: function (e) {
    var ratio = e.currentTarget.dataset.ratio
    var imgW = this.data.imgDisplayW
    var imgH = this.data.imgDisplayH
    var imgX = this.data.imgDisplayX
    var imgY = this.data.imgDisplayY

    var cropW, cropH

    if (ratio === 'free') {
      cropW = Math.floor(imgW * 0.8)
      cropH = Math.floor(imgH * 0.8)
    } else {
      var parts = ratio.split(':')
      var ratioW = parseInt(parts[0])
      var ratioH = parseInt(parts[1])
      var maxW = imgW * 0.8
      var maxH = imgH * 0.8
      if (maxW / ratioW > maxH / ratioH) {
        cropH = maxH
        cropW = cropH * ratioW / ratioH
      } else {
        cropW = maxW
        cropH = cropW * ratioH / ratioW
      }
      cropW = Math.floor(cropW)
      cropH = Math.floor(cropH)
    }

    var cropX = imgX + Math.floor((imgW - cropW) / 2)
    var cropY = imgY + Math.floor((imgH - cropH) / 2)

    this.setData({
      cropRatio: ratio,
      cropBox: {
        left: cropX,
        top: cropY,
        width: cropW,
        height: cropH
      }
    })
  },

  onCropTouchStart: function (e) {
    var corner = e.currentTarget.dataset.corner
    var touch = e.touches[0]
    this._cropTouchCorner = corner
    this._cropStartX = touch.clientX
    this._cropStartY = touch.clientY
    this._cropStartBox = {
      left: this.data.cropBox.left,
      top: this.data.cropBox.top,
      width: this.data.cropBox.width,
      height: this.data.cropBox.height
    }
  },

  onCropTouchMove: function (e) {
    if (!this._cropStartBox) return

    var touch = e.touches[0]
    var dx = touch.clientX - this._cropStartX
    var dy = touch.clientY - this._cropStartY
    var box = this._cropStartBox
    var corner = this._cropTouchCorner

    var imgX = this.data.imgDisplayX
    var imgY = this.data.imgDisplayY
    var imgW = this.data.imgDisplayW
    var imgH = this.data.imgDisplayH
    var minSize = 60

    var newLeft = box.left
    var newTop = box.top
    var newWidth = box.width
    var newHeight = box.height

    if (corner === 'br') {
      newWidth = Math.max(minSize, Math.min(box.width + dx, imgX + imgW - box.left))
      newHeight = Math.max(minSize, Math.min(box.height + dy, imgY + imgH - box.top))
    } else if (corner === 'bl') {
      newLeft = Math.max(imgX, box.left + dx)
      newWidth = Math.max(minSize, box.left + box.width - newLeft)
      newHeight = Math.max(minSize, Math.min(box.height + dy, imgY + imgH - box.top))
    } else if (corner === 'tr') {
      newWidth = Math.max(minSize, Math.min(box.width + dx, imgX + imgW - box.left))
      newTop = Math.max(imgY, box.top + dy)
      newHeight = Math.max(minSize, box.top + box.height - newTop)
    } else if (corner === 'tl') {
      newLeft = Math.max(imgX, box.left + dx)
      newWidth = Math.max(minSize, box.left + box.width - newLeft)
      newTop = Math.max(imgY, box.top + dy)
      newHeight = Math.max(minSize, box.top + box.height - newTop)
    }

    // Apply ratio constraint
    if (this.data.cropRatio !== 'free') {
      var parts = this.data.cropRatio.split(':')
      var ratioW = parseInt(parts[0])
      var ratioH = parseInt(parts[1])
      var targetRatio = ratioW / ratioH
      newHeight = newWidth / targetRatio
      if (newTop + newHeight > imgY + imgH) {
        newHeight = imgY + imgH - newTop
        newWidth = newHeight * targetRatio
      }
      newWidth = Math.floor(newWidth)
      newHeight = Math.floor(newHeight)
    }

    this.setData({
      cropBox: {
        left: Math.floor(newLeft),
        top: Math.floor(newTop),
        width: Math.floor(newWidth),
        height: Math.floor(newHeight)
      }
    })
  },

  // Cancel crop
  cancelCrop: function () {
    this.setData({
      editMode: 'adjust',
      cropBox: null,
      cropRatio: 'free'
    })
  },

  // Confirm crop
  confirmCrop: function () {
    var self = this
    var box = this.data.cropBox
    if (!box) return

    var scale = this.data.displayScale
    var imgX = this.data.imgDisplayX
    var imgY = this.data.imgDisplayY

    var srcX = Math.floor((box.left - imgX) / scale)
    var srcY = Math.floor((box.top - imgY) / scale)
    var srcW = Math.floor(box.width / scale)
    var srcH = Math.floor(box.height / scale)

    srcX = Math.max(0, srcX)
    srcY = Math.max(0, srcY)
    srcW = Math.min(srcW, this.data.imageWidth - srcX)
    srcH = Math.min(srcH, this.data.imageHeight - srcY)

    this.savePrevParams()
    var prev = this.data.prevParams
    prev.croppedSrc = this.data.imageSrc
    prev.prevImageWidth = this.data.imageWidth
    prev.prevImageHeight = this.data.imageHeight
    prev.prevImgDisplayX = this.data.imgDisplayX
    prev.prevImgDisplayY = this.data.imgDisplayY
    prev.prevImgDisplayW = this.data.imgDisplayW
    prev.prevImgDisplayH = this.data.imgDisplayH
    prev.prevDisplayScale = this.data.displayScale

    var query = wx.createSelectorQuery()
    query.select('#editorCanvas').fields({ node: true })
    query.exec(function (res) {
      if (!res[0]) return

      var canvas = res[0].node
      var ctx = canvas.getContext('2d')
      var dpr = wx.getWindowInfo().pixelRatio

      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      var containerW = self.data.canvasWidth
      var containerH = self.data.canvasHeight
      var newScale = Math.min(containerW / srcW, containerH / srcH)
      var newDispW = Math.floor(srcW * newScale)
      var newDispH = Math.floor(srcH * newScale)
      var newOffX = Math.floor((containerW - newDispW) / 2)
      var newOffY = Math.floor((containerH - newDispH) / 2)

      ctx.filter = self.getFilterString()
      ctx.drawImage(
        self._img,
        srcX, srcY, srcW, srcH,
        newOffX, newOffY, newDispW, newDispH
      )
      ctx.filter = 'none'

      wx.canvasToTempFilePath({
        canvas: canvas,
        fileType: 'png',
        quality: 1,
        success: function (tempRes) {
          wx.getImageInfo({
            src: tempRes.tempFilePath,
            success: function (info) {
              var newImg = canvas.createImage()
              newImg.src = tempRes.tempFilePath
              newImg.onload = function () {
                self._img = newImg
                self.setData({
                  imageSrc: tempRes.tempFilePath,
                  imageWidth: info.width,
                  imageHeight: info.height,
                  imgDisplayX: newOffX,
                  imgDisplayY: newOffY,
                  imgDisplayW: newDispW,
                  imgDisplayH: newDispH,
                  displayScale: newScale,
                  editMode: 'adjust',
                  cropBox: null,
                  brightness: 100,
                  contrast: 100,
                  saturate: 100,
                  filterIndex: 0,
                  filterIntensity: 100
                })
              }
            }
          })
        },
        fail: function () {
          wx.showToast({ title: '裁剪失败', icon: 'none' })
        }
      })
    })
  },

  // Undo last action
  undoAction: function () {
    var prev = this.data.prevParams
    if (!prev) return

    if (prev.croppedSrc) {
      var self = this
      var canvas = this._canvas
      var oldImg = canvas.createImage()
      oldImg.src = prev.croppedSrc
      oldImg.onload = function () {
        self._img = oldImg
        self.setData({
          imageSrc: prev.croppedSrc,
          imageWidth: prev.prevImageWidth,
          imageHeight: prev.prevImageHeight,
          imgDisplayX: prev.prevImgDisplayX,
          imgDisplayY: prev.prevImgDisplayY,
          imgDisplayW: prev.prevImgDisplayW,
          imgDisplayH: prev.prevImgDisplayH,
          displayScale: prev.prevDisplayScale,
          brightness: prev.brightness,
          contrast: prev.contrast,
          saturate: prev.saturate,
          filterIndex: prev.filterIndex,
          filterIntensity: prev.filterIntensity !== undefined ? prev.filterIntensity : 100,
          canUndo: false,
          prevParams: null
        })
        self.renderCanvas()
      }
      return
    }

    this.setData({
      brightness: prev.brightness,
      contrast: prev.contrast,
      saturate: prev.saturate,
      filterIndex: prev.filterIndex,
      filterIntensity: prev.filterIntensity !== undefined ? prev.filterIntensity : 100,
      canUndo: false,
      prevParams: null
    })
    this.renderCanvas()
  },

  // Save image to album
  saveImage: function () {
    var self = this

    wx.showLoading({ title: '保存中...' })

    var canvas = this._canvas
    var ctx = this._ctx
    var dpr = wx.getWindowInfo().pixelRatio
    var imgW = this.data.imageWidth
    var imgH = this.data.imageHeight

    canvas.width = imgW
    canvas.height = imgH
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    ctx.filter = this.getFilterString()
    ctx.drawImage(this._img, 0, 0, imgW, imgH)
    ctx.filter = 'none'

    wx.canvasToTempFilePath({
      canvas: canvas,
      fileType: 'png',
      quality: 1,
      success: function (tempRes) {
        var containerW = self.data.canvasWidth
        var containerH = self.data.canvasHeight
        canvas.width = containerW * dpr
        canvas.height = containerH * dpr
        ctx.scale(dpr, dpr)
        self.renderCanvas()

        wx.saveImageToPhotosAlbum({
          filePath: tempRes.tempFilePath,
          success: function () {
            wx.hideLoading()
            wx.showToast({ title: '保存成功', icon: 'success' })
          },
          fail: function (err) {
            wx.hideLoading()
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
      fail: function () {
        wx.hideLoading()
        var containerW = self.data.canvasWidth
        var containerH = self.data.canvasHeight
        canvas.width = containerW * dpr
        canvas.height = containerH * dpr
        ctx.scale(dpr, dpr)
        self.renderCanvas()
        wx.showToast({ title: '导出失败', icon: 'none' })
      }
    })
  }
})
