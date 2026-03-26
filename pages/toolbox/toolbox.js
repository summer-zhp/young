// pages/toolbox/toolbox.js
const app = getApp()

Page({
  data: {
    tools: [
      {
        id: 1,
        name: '戳泡泡',
        icon: 'chat-bubble',
        description: '解压小游戏',
        url: '/pages/bubble/index'
      },
      {
        id: 2,
        name: '专注时钟',
        icon: 'time',
        description: '专注工作学习',
        url: '/pages/focus/focus'
      },
      {
        id: 3,
        name: '树洞',
        icon: 'heart',
        description: '心里的话，有人听',
        url: '/pages/treeHole/treeHole',
        highlight: true
      }
    ],
    filteredTools: []
  },

  onLoad() {
    this.filterTools()
  },

  // 根据版本过滤工具列表（只在正式版显示树洞）
  filterTools() {
    const isReleaseVersion = app.globalData.isReleaseVersion

    // 只在正式版显示树洞功能
    const filteredTools = this.data.tools.filter(tool => {
      if (tool.name === '树洞') {
        return false
      }
      return true
    })

    this.setData({ filteredTools })
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
