// pages/toolkit/image-compressor/image-compressor.js
Page({
  data: {
    originalImage: null,
    originalSize: '0 KB',
    originalSizeBytes: 0,
    imageDimensions: '0 x 0',
    quality: 75,
    sizeOption: 'original',
    isCompressing: false,
    canCompress: false,
    compressedImage: null,
    compressedSize: '0 KB',
    compressedSizeBytes: 0,
    saveRate: 0
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        const size = res.tempFiles[0].size

        // 获取图片尺寸
        wx.getImageInfo({
          src: tempFilePath,
          success: (infoRes) => {
            this.setData({
              originalImage: tempFilePath,
              originalSize: this.formatFileSize(size),
              originalSizeBytes: size,
              imageDimensions: `${infoRes.width} x ${infoRes.height}`,
              canCompress: true,
              compressedImage: null
            })
          }
        })
      }
    })
  },

  // 修改压缩质量
  onQualityChange(e) {
    this.setData({
      quality: e.detail.value
    })
  },

  // 修改尺寸选项
  onSizeOptionChange(e) {
    const { option } = e.currentTarget.dataset
    this.setData({
      sizeOption: option
    })
  },

  // 压缩图片
  async compressImage() {
    const { originalImage, quality, sizeOption, isCompressing } = this.data

    if (!originalImage || isCompressing) return

    this.setData({ isCompressing: true })

    try {
      // 获取图片信息
      const imageInfo = await this.getImageInfo(originalImage)
      const originalSizeBytes = this.data.originalSizeBytes

      // 计算压缩后的尺寸
      let width = imageInfo.width
      let height = imageInfo.height

      if (sizeOption === '750' && width > 750) {
        const ratio = 750 / width
        width = 750
        height = Math.floor(imageInfo.height * ratio)
      } else if (sizeOption === '500' && width > 500) {
        const ratio = 500 / width
        width = 500
        height = Math.floor(imageInfo.height * ratio)
      }

      // 根据原图大小动态调整压缩质量
      let targetQuality = quality
      if (originalSizeBytes < 100 * 1024) {
        // 小图片（<100KB）使用更低的质量
        targetQuality = Math.min(quality, 60)
      }

      // 使用 canvas 压缩（更可靠）
      let compressedPath
      let compressedSize
      let currentQuality = targetQuality

      // 最多尝试 3 次，每次降低质量
      for (let attempt = 0; attempt < 3; attempt++) {
        compressedPath = await this.compressWithCanvas(originalImage, width, height, currentQuality)
        const fileInfo = await this.getFileInfo(compressedPath)
        compressedSize = fileInfo.size

        // 如果压缩成功（变小了），退出循环
        if (compressedSize < originalSizeBytes) {
          break
        }

        // 否则降低质量继续尝试
        console.log(`第${attempt + 1}次压缩后变大 (${compressedSize} >= ${originalSizeBytes})，降低质量`)
        currentQuality = Math.max(20, currentQuality - 20)
      }

      // 如果最后还是变大，直接使用原图（但显示提示）
      if (compressedSize >= originalSizeBytes) {
        console.log('无法压缩，图片已经是最优状态')
        this.setData({
          compressedImage: originalImage,
          compressedSize: this.formatFileSize(originalSizeBytes),
          compressedSizeBytes: originalSizeBytes,
          saveRate: 0,
          isCompressing: false
        })
        wx.showToast({
          title: '图片已是最小',
          icon: 'none'
        })
        return
      }

      const saveRate = Math.round((1 - compressedSize / originalSizeBytes) * 100)

      this.setData({
        compressedImage: compressedPath,
        compressedSize: this.formatFileSize(compressedSize),
        compressedSizeBytes: compressedSize,
        saveRate: saveRate,
        isCompressing: false
      })

      wx.showToast({
        title: '压缩成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('压缩失败:', error)
      this.setData({ isCompressing: false })

      wx.showToast({
        title: '压缩失败，请重试',
        icon: 'error'
      })
    }
  },

  // 使用 Canvas 压缩图片
  compressWithCanvas(src, width, height, quality) {
    return new Promise((resolve, reject) => {
      // 创建隐藏的 canvas
      const query = wx.createSelectorQuery()
      query.select('#compressCanvas')
        .fields({ node: true })
        .exec((res) => {
          if (!res[0]) {
            reject(new Error('Canvas not found'))
            return
          }

          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          // 直接使用物理像素尺寸
          canvas.width = width
          canvas.height = height

          // 使用 canvas.createImage() 创建图片对象
          const img = canvas.createImage()
          img.src = src
          img.onload = () => {
            // 绘制白色背景（防止透明 PNG 转 JPG 出现黑边）
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, width, height)

            // 绘制图片
            ctx.drawImage(img, 0, 0, width, height)

            // 导出为 JPG，quality 范围 0-1
            setTimeout(() => {
              wx.canvasToTempFilePath({
                canvas: canvas,
                fileType: 'jpg',
                quality: Math.max(0.1, Math.min(1, quality / 100)),
                success: (tempRes) => {
                  resolve(tempRes.tempFilePath)
                },
                fail: reject
              })
            }, 50)
          }
          img.onerror = reject
        })
    })
  },

  // 获取图片信息
  getImageInfo(src) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: src,
        success: resolve,
        fail: reject
      })
    })
  },

  // 获取文件信息
  getFileInfo(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().getFileInfo({
        filePath: filePath,
        success: resolve,
        fail: reject
      })
    })
  },

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    } else {
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`
    }
  },

  // 重新压缩
  reCompress() {
    this.setData({
      compressedImage: null
    })
  },

  // 预览图片
  previewImage() {
    const { compressedImage } = this.data
    if (!compressedImage) return

    wx.previewImage({
      urls: [compressedImage],
      current: compressedImage
    })
  },

  // 保存图片
  saveImage() {
    const { compressedImage } = this.data
    if (!compressedImage) return

    wx.showLoading({ title: '保存中...' })

    wx.saveImageToPhotosAlbum({
      filePath: compressedImage,
      success: () => {
        wx.hideLoading()
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('保存失败:', err)

        if (err.errMsg && err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '您已拒绝保存到相册权限，请在设置中开启',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'error'
          })
        }
      }
    })
  }
})
