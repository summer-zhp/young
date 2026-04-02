// pages/toolkit/grid-cutter/grid-cutter.js - 九宫格切图
Page({
  data: {
    imageUrl: '',
    imageWidth: 0,
    imageHeight: 0,
    cropInfo: '',
    cutting: false,
    resultImages: [],
    saving: false
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        wx.getImageInfo({
          src: tempFilePath,
          success: (info) => {
            const { width, height } = info
            let cropInfo = ''
            if (width !== height) {
              const side = Math.min(width, height)
              cropInfo = `图片 ${width}×${height}，将居中裁剪为 ${side}×${side} 正方形`
            } else {
              cropInfo = `图片 ${width}×${height}，正方形无需裁剪`
            }
            this.setData({
              imageUrl: tempFilePath,
              imageWidth: width,
              imageHeight: height,
              cropInfo,
              resultImages: []
            })
          }
        })
      }
    })
  },

  // 开始切图
  startCut() {
    const { imageUrl, imageWidth, imageHeight } = this.data
    if (!imageUrl) return

    this.setData({ cutting: true })
    wx.showLoading({ title: '切图中...' })

    // 计算中心正方形裁剪区域
    const side = Math.min(imageWidth, imageHeight)
    const offsetX = (imageWidth - side) / 2
    const offsetY = (imageHeight - side) / 2
    const cellSize = side / 3

    const query = wx.createSelectorQuery()
    query.select('#cutCanvas').fields({ node: true })
    query.exec((res) => {
      if (!res[0]) {
        wx.hideLoading()
        this.setData({ cutting: false })
        wx.showToast({ title: 'Canvas 初始化失败', icon: 'none' })
        return
      }

      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getWindowInfo().pixelRatio

      // 设置 canvas 尺寸（单格大小）
      const canvasPixelSize = Math.round(cellSize * dpr)
      canvas.width = canvasPixelSize
      canvas.height = canvasPixelSize

      const img = canvas.createImage()
      img.src = imageUrl

      img.onload = () => {
        const resultImages = []

        // 逐格切图
        const cutNext = (index) => {
          if (index >= 9) {
            wx.hideLoading()
            this.setData({
              cutting: false,
              resultImages
            })
            wx.showToast({ title: '切图完成', icon: 'success' })
            return
          }

          const row = Math.floor(index / 3)
          const col = index % 3

          // 源图裁剪坐标
          const sx = offsetX + col * cellSize
          const sy = offsetY + row * cellSize

          // 清空画布并绘制当前格
          ctx.clearRect(0, 0, canvasPixelSize, canvasPixelSize)
          ctx.drawImage(
            img,
            sx, sy, cellSize, cellSize,
            0, 0, canvasPixelSize, canvasPixelSize
          )

          // 导出
          wx.canvasToTempFilePath({
            canvas: canvas,
            fileType: 'jpg',
            quality: 1,
            success: (tempRes) => {
              resultImages.push(tempRes.tempFilePath)
              cutNext(index + 1)
            },
            fail: () => {
              wx.hideLoading()
              this.setData({ cutting: false })
              wx.showToast({ title: '切图失败', icon: 'none' })
            }
          })
        }

        cutNext(0)
      }

      img.onerror = () => {
        wx.hideLoading()
        this.setData({ cutting: false })
        wx.showToast({ title: '图片加载失败', icon: 'none' })
      }
    })
  },

  // 一键保存全部
  saveAll() {
    const { resultImages } = this.data
    if (!resultImages.length) return

    this.setData({ saving: true })

    // 先检查相册权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册权限以保存图片',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
              this.setData({ saving: false })
            }
          })
          return
        }
        this.doSaveAll(resultImages, 0)
      }
    })
  },

  // 递归保存
  doSaveAll(images, index) {
    if (index >= images.length) {
      this.setData({ saving: false })
      wx.showToast({ title: '已全部保存到相册', icon: 'success' })
      return
    }

    wx.showLoading({ title: `保存中 ${index + 1}/${images.length}` })

    wx.saveImageToPhotosAlbum({
      filePath: images[index],
      success: () => {
        this.doSaveAll(images, index + 1)
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ saving: false })
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    })
  },

  // 重置
  resetAll() {
    this.setData({
      imageUrl: '',
      imageWidth: 0,
      imageHeight: 0,
      cropInfo: '',
      cutting: false,
      resultImages: [],
      saving: false
    })
  }
})
