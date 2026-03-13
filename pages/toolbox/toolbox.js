// pages/toolbox/toolbox.js
Page({
  data: {
    tools: [
      {
        id: 1,
        name: '专注时钟',
        icon: 'time',
        description: '专注工作学习',
        url: '/pages/focus/focus'
      },
      {
        id: 2,
        name: '戳泡泡',
        icon: 'chat-bubble',
        description: '解压小游戏',
        url: '/pages/bubble/index'
      }
    ]
  },

  goToTool(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({ url })
    } else {
      wx.showToast({ title: '敬请期待', icon: 'none' })
    }
  }
})
