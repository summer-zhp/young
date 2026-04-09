// pages/toolkit/qrcode-generator/qrcode-generator.js
import { drawQRCode } from './qrcode-lib'

Page({
  data: {
    inputText: '',
    charCount: 0,
    hasText: false,
    selectedColor: 'primary',
    isGenerating: false,
    qrCodeImage: null
  },

  // 颜色配置
  colorConfig: {
    dark: { foreground: '#1a1a1a', background: '#ffffff' },
    primary: { foreground: '#6f9a8e', background: '#ffffff' },
    blue: { foreground: '#2c5f8a', background: '#ffffff' },
    pink: { foreground: '#e0657a', background: '#ffffff' }
  },

  onLoad() {
  },

  // 输入监听
  onInput(e) {
    const value = e.detail.value
    this.setData({
      inputText: value,
      charCount: value.length,
      hasText: value.trim().length > 0
    })
  },

  // 选择颜色
  selectColor(e) {
    const { color } = e.currentTarget.dataset
    this.setData({ selectedColor: color })
  },

  // 生成二维码
  async generateQRCode() {
    const { inputText, selectedColor, isGenerating } = this.data

    if (!inputText.trim() || isGenerating) return

    this.setData({ isGenerating: true })

    try {
      // 获取颜色配置
      const colors = this.colorConfig[selectedColor]

      // 生成二维码
      const qrCodeImage = await drawQRCode({
        text: inputText,
        size: 560,
        foreground: colors.foreground,
        background: colors.background
      })

      this.setData({
        qrCodeImage,
        isGenerating: false
      })

      wx.showToast({
        title: '生成成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('生成二维码失败:', error)
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'error'
      })
      this.setData({ isGenerating: false })
    }
  },

  // 预览图片
  previewImage() {
    const { qrCodeImage } = this.data
    if (!qrCodeImage) return

    wx.previewImage({
      urls: [qrCodeImage],
      current: qrCodeImage
    })
  },

  // 保存图片
  saveImage() {
    const { qrCodeImage } = this.data
    if (!qrCodeImage) return

    wx.showLoading({ title: '保存中...' })

    // 直接使用 canvasToTempFilePath 生成的临时文件路径
    wx.saveImageToPhotosAlbum({
      filePath: qrCodeImage,
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
        // 请求权限
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
