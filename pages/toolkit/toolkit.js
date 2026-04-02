// pages/toolkit/toolkit.js
const app = getApp()

Page({
  data: {
    showCaptionImage: false
  },

  onLoad() {
    this.checkCaptionImageVisible()
  },

  // 检查朋友圈配图功能是否显示（只在正式版显示）
  checkCaptionImageVisible() {
    const isReleaseVersion = app.globalData.isReleaseVersion
    console.log(isReleaseVersion);

    // 只在正式版显示朋友圈配图功能
    this.setData({
      showCaptionImage: isReleaseVersion
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
  },

  // 跳转到图片压缩页面
  goToImageCompressor() {
    wx.navigateTo({
      url: '/pages/toolkit/image-compressor/image-compressor'
    })
  },

  // 跳转到 LED 手持弹幕页面
  goToLedDisplay() {
    wx.navigateTo({
      url: '/pages/led/led'
    })
  },

  // 跳转到决策转盘页面
  goToDecision() {
    wx.navigateTo({
      url: '/pages/decision/decision'
    })
  },

  // 跳转到电子签名页面
  goToSignature() {
    wx.navigateTo({
      url: '/pages/toolkit/signature/signature'
    })
  },

  // 跳转到绝密保险箱页面
  goToVault() {
    wx.navigateTo({
      url: '/pages/toolkit/vault/vault'
    })
  },

  // 跳转到九宫格切图页面
  goToGridCutter() {
    wx.navigateTo({
      url: '/pages/toolkit/grid-cutter/grid-cutter'
    })
  }
})
