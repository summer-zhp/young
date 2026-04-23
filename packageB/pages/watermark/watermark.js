// packageB/pages/watermark/watermark.js
var watermark = require('../../../utils/watermark.js')

Page({
  data: {
    imageSrc: '',
    imageWidth: 0,
    imageHeight: 0,
    hasImage: false,
    mode: 'visible',
    watermarkText: '',
    opacity: 15,
    fontSize: 24
  },

  _canvas: null,
  _ctx: null,

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
              hasImage: true
            })
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

  // Switch watermark mode
  switchMode: function (e) {
    var mode = e.currentTarget.dataset.mode
    this.setData({ mode: mode })
  },

  // Watermark text input
  onTextChange: function (e) {
    this.setData({
      watermarkText: e.detail.value
    })
  },

  // Opacity slider
  onOpacityChange: function (e) {
    this.setData({
      opacity: e.detail.value
    })
  },

  // Font size slider
  onFontSizeChange: function (e) {
    this.setData({
      fontSize: e.detail.value
    })
  },

  // Initialize canvas and load image
  initCanvas: function (callback) {
    var self = this

    var query = wx.createSelectorQuery()
    query.select('#watermarkCanvas').fields({ node: true })
    query.exec(function (res) {
      if (!res || !res[0]) {
        wx.showToast({ title: 'Canvas 初始化失败', icon: 'none' })
        return
      }

      var canvas = res[0].node
      var ctx = canvas.getContext('2d')

      // Set canvas to original image size (no DPR scaling for export)
      var imgW = self.data.imageWidth
      var imgH = self.data.imageHeight
      canvas.width = imgW
      canvas.height = imgH

      self._canvas = canvas
      self._ctx = ctx

      var img = canvas.createImage()
      img.src = self.data.imageSrc
      img.onload = function () {
        if (callback) {
          callback(canvas, ctx, img)
        }
      }
      img.onerror = function () {
        wx.showToast({ title: '图片加载失败', icon: 'none' })
      }
    })
  },

  // Save image with watermark
  saveImage: function () {
    var self = this

    // Validate watermark text
    if (!self.data.watermarkText || self.data.watermarkText.trim() === '') {
      wx.showToast({ title: '请输入水印文字', icon: 'none' })
      return
    }

    wx.showLoading({ title: '处理中...' })

    self.initCanvas(function (canvas, ctx, img) {
      // Draw original image
      ctx.drawImage(img, 0, 0, self.data.imageWidth, self.data.imageHeight)

      if (self.data.mode === 'visible') {
        // Visible watermark
        watermark.drawVisibleWatermark(
          ctx,
          self.data.imageWidth,
          self.data.imageHeight,
          self.data.watermarkText,
          self.data.fontSize,
          self.data.opacity / 100
        )

        // Export as JPG
        self._exportImage(canvas, 'jpg', false)
      } else {
        // Invisible watermark - use LSB steganography
        var imageData = ctx.getImageData(0, 0, self.data.imageWidth, self.data.imageHeight)
        var success = watermark.encodeLSB(imageData.data, self.data.watermarkText)

        if (!success) {
          wx.hideLoading()
          wx.showToast({ title: '图片太小，无法添加水印', icon: 'none' })
          return
        }

        ctx.putImageData(imageData, 0, 0)

        // Export as PNG to preserve LSB data
        self._exportImage(canvas, 'png', true)
      }
    })
  },

  // Export canvas to temp file and save to album
  _exportImage: function (canvas, fileType, isInvisible) {
    var self = this

    wx.canvasToTempFilePath({
      canvas: canvas,
      fileType: fileType,
      quality: 1,
      success: function (tempRes) {
        wx.saveImageToPhotosAlbum({
          filePath: tempRes.tempFilePath,
          success: function () {
            wx.hideLoading()

            if (isInvisible) {
              // Show success modal with PNG warning
              wx.showModal({
                title: '保存成功',
                content: '不可见水印已添加到图片中。请务必保存为 PNG 格式并分享原图，避免社交媒体压缩导致水印丢失。',
                showCancel: false,
                confirmText: '我知道了',
                confirmColor: '#8EC5B9'
              })
            } else {
              wx.showToast({ title: '保存成功', icon: 'success' })
            }
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
        wx.showToast({ title: '导出失败', icon: 'none' })
      }
    })
  }
})
