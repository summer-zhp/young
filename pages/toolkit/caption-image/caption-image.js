// pages/toolkit/caption-image/caption-image.js
Page({
  data: {
    caption: '',
    captionLength: 0,
    isGenerating: false,
    generatedImage: null
  },

  // 输入监听
  onInput(e) {
    const value = e.detail.value
    this.setData({
      caption: value,
      captionLength: value.length
    })
  },

  // 生成图片
  generateImage() {
    const { caption, isGenerating } = this.data

    if (!caption || caption.trim().length === 0) {
      wx.showToast({
        title: '请输入文案',
        icon: 'none'
      })
      return
    }

    if (isGenerating) return

    this.setData({ isGenerating: true })

    // 调用云函数生成图片
    wx.cloud.callFunction({
      name: 'generateImage-a5aQFM',
      data: {
        prompt: `根据朋友圈文案${caption}创作一张高分辨率、真实感强的文艺风格配图。画面要自然真实，避免过度PS和虚假感，采用柔和的自然光线，色调温暖或清新。构图要有故事感和生活气息，细节丰富，质感真实。可以是静物、风景、人物背影或生活场景，但必须与文案主题呼应，能引发情感共鸣，适合社交媒体分享。`,
        size: '1024x1024'
      },
      success: (res) => {
        const result = res.result

        if (result && result.success) {
          const imageUrl = result.imageUrl

          // 保存生成的图片到云存储
          wx.downloadFile({
            url: imageUrl,
            success: (downloadRes) => {
              // 上传到云存储
              const cloudPath = `caption-image/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
              wx.cloud.uploadFile({
                cloudPath: cloudPath,
                filePath: downloadRes.tempFilePath,
                success: (uploadRes) => {
                  // 获取临时 URL
                  wx.cloud.getTempFileURL({
                    fileList: [uploadRes.fileID],
                    success: (tempUrlRes) => {
                      const tempUrl = tempUrlRes.fileList[0].tempFileURL

                      // 更新数据
                      this.setData({
                        generatedImage: tempUrl
                      })

                      wx.showToast({
                        title: '生成成功',
                        icon: 'success'
                      })
                    },
                    fail: (err) => {
                      console.error('获取链接失败:', err)
                      wx.showToast({
                        title: '获取链接失败',
                        icon: 'error'
                      })
                    }
                  })
                },
                fail: (err) => {
                  console.error('上传失败:', err)
                  wx.showToast({
                    title: '上传失败',
                    icon: 'error'
                  })
                }
              })
            },
            fail: (err) => {
              console.error('下载失败:', err)
              wx.showToast({
                title: '下载失败',
                icon: 'error'
              })
            }
          })
        } else {
          console.error('生成失败:', result?.code, result?.message)
          wx.showToast({
            title: result?.message || '生成失败',
            icon: 'error'
          })
        }

        this.setData({ isGenerating: false })
      },
      fail: (err) => {
        console.error('调用失败:', err)
        wx.showToast({
          title: '调用失败，请重试',
          icon: 'error'
        })
        this.setData({ isGenerating: false })
      }
    })
  },

  // 保存图片
  saveImage() {
    const { generatedImage } = this.data
    if (!generatedImage) return

    wx.showLoading({ title: '保存中...' })

    wx.downloadFile({
      url: generatedImage,
      success: (res) => {
        wx.saveFile({
          tempFilePath: res.tempFilePath,
          success: (saveRes) => {
            wx.hideLoading()
            wx.showModal({
              title: '保存成功',
              content: `图片已保存到相册：${saveRes.savedFilePath}`,
              showCancel: false,
              confirmText: '知道了'
            })
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({
              title: '保存失败',
              icon: 'error'
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
  },

  // 预览图片
  previewImage() {
    const { generatedImage } = this.data
    if (!generatedImage) return

    wx.previewImage({
      urls: [generatedImage],
      current: generatedImage
    })
  },

  onLoad() {
  }
})
