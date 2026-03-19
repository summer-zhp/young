// pages/toolkit/toolkit.js
const app = getApp()

Page({
  data: {
    showCaptionImage: true
  },

  onLoad() {
    this.checkCaptionImageVisible()
  },

  // 检查朋友圈配图功能是否显示
  checkCaptionImageVisible() {
    const appConfig = app.globalData.appConfig

    // 如果配置还未加载，等待一下
    if (!appConfig) {
      setTimeout(() => this.checkCaptionImageVisible(), 100)
      return
    }

    // 根据环境变量控制是否显示
    this.setData({
      showCaptionImage: appConfig.captionImageEnabled !== false
    })
  },

  // 跳转到朋友圈配图页面
  goToCaptionImage() {
    wx.navigateTo({
      url: '/pages/toolkit/caption-image/caption-image'
    })
  },

  // 跳转到二维码生成页面
  goToQRCode() {
    wx.navigateTo({
      url: '/pages/toolkit/qrcode-generator/qrcode-generator'
    })
  },

  // 跳转到图片转 PDF 页面
  goToImage2Pdf() {
    wx.navigateTo({
      url: '/pages/toolkit/image2pdf/image2pdf'
    })
  }
})
