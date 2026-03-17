// pages/toolkit/image2pdf/image2pdf.js
Page({
  data: {
    imageList: [],
    isConverting: false,
    pdfResult: null
  },

  // 选择图片
  chooseImages() {
    const { imageList } = this.data
    const remaining = 10 - imageList.length

    if (remaining <= 0) {
      wx.showToast({
        title: '最多选择 10 张图片',
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath)
        this.setData({
          imageList: [...imageList, ...newImages]
        })
      },
      fail: (err) => {
        if (err.errMsg !== 'chooseMedia:fail cancel') {
          wx.showToast({
            title: '选择失败',
            icon: 'error'
          })
        }
      }
    })
  },

  // 删除图片
  removeImage(e) {
    const { index } = e.currentTarget.dataset
    const { imageList } = this.data
    imageList.splice(index, 1)
    this.setData({ imageList })
  },

  // 转换为 PDF
  async convertToPdf() {
    const { imageList, isConverting } = this.data

    if (isConverting || imageList.length === 0) return

    this.setData({ isConverting: true })

    try {
      // 先上传图片到云存储
      const uploadPromises = imageList.map(async (filePath) => {
        const fileName = `image2pdf/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const result = await wx.cloud.uploadFile({
          cloudPath: fileName,
          filePath: filePath
        })
        return result.fileID
      })

      const fileIds = await Promise.all(uploadPromises)

      // 调用云函数转换
      const convertResult = await wx.cloud.callFunction({
        name: 'image2pdf',
        data: {
          fileList: fileIds
        }
      })

      if (convertResult.result && convertResult.result.success) {
        const { pdfFileId, pdfUrl } = convertResult.result.data

        this.setData({
          pdfResult: {
            pdfFileId,
            pdfUrl,
            imageCount: imageList.length
          },
          imageList: []
        })

        wx.showToast({
          title: '转换成功',
          icon: 'success'
        })
      } else {
        throw new Error(convertResult.result?.message || '转换失败')
      }
    } catch (err) {
      console.error('转换失败:', err)
      wx.showToast({
        title: err.message || '转换失败',
        icon: 'error'
      })
    } finally {
      this.setData({ isConverting: false })
    }
  },

  // 下载 PDF
  downloadPdf() {
    const { pdfResult } = this.data
    if (!pdfResult) return

    wx.showLoading({ title: '下载中...' })

    // 获取临时 URL
    wx.cloud.getTempFileURL({
      fileList: [pdfResult.pdfFileId]
    }).then(res => {
      const tempUrl = res.fileList[0].tempFileURL

      // 下载文件
      wx.downloadFile({
        url: tempUrl,
        fileType: 'pdf',
        success: (downloadRes) => {
          wx.hideLoading()

          // 保存文件
          wx.saveFile({
            tempFilePath: downloadRes.tempFilePath,
            success: (saveRes) => {
              // 显示保存路径
              wx.showModal({
                title: '保存成功',
                content: `文件已保存到：${saveRes.savedFilePath}\n\n长按路径即可复制`,
                showCancel: false,
                confirmText: '知道了',
                success: () => {
                  // 尝试复制到剪贴板
                  wx.setClipboardData({
                    data: saveRes.savedFilePath,
                    toast: true
                  })
                }
              })
            },
            fail: () => {
              // 如果保存失败，尝试用其他方式打开
              wx.openDocument({
                filePath: downloadRes.tempFilePath,
                showMenu: true
              })
            }
          })
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            title: '下载失败',
            icon: 'error'
          })
        }
      })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({
        title: '获取链接失败',
        icon: 'error'
      })
    })
  },

  // 复制链接
  copyLink() {
    const { pdfResult } = this.data
    if (!pdfResult) return

    wx.showLoading({ title: '加载中...' })

    // 获取临时 URL
    wx.cloud.getTempFileURL({
      fileList: [pdfResult.pdfFileId]
    }).then(res => {
      wx.hideLoading()
      const url = res.fileList[0].tempFileURL

      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({
            title: '链接已复制',
            icon: 'success'
          })
        }
      })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({
        title: '获取链接失败',
        icon: 'error'
      })
    })
  }
})
