// pages/toolkit/toolkit.js
Page({
  data: {
    tools: [
      {
        id: 1,
        name: '朋友圈配图',
        icon: 'image',
        description: 'AI 智能生成朋友圈文案场景图',
        url: '/pages/toolkit/caption-image/caption-image'
      },
      {
        id: 2,
        name: '图片转 PDF',
        icon: 'file-image',
        description: '将图片快速转换为 PDF 文档',
        url: '/pages/toolkit/image2pdf/image2pdf'
      }
    ]
  },

  onLoad() {
  },

  // 跳转到朋友圈配图页面
  goToCaptionImage() {
    wx.navigateTo({
      url: '/pages/toolkit/caption-image/caption-image'
    })
  },

  // 跳转到图片转 PDF 页面
  goToImage2Pdf() {
    wx.navigateTo({
      url: '/pages/toolkit/image2pdf/image2pdf'
    })
  }
})
