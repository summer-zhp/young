// pages/toolbox/toolbox.js
const app = getApp()

Page({
  data: {
    featuredTool: null,
    gridTools: []
  },

  onLoad() {
    this.prepareTools()
  },

  prepareTools() {
    const allTools = [
      {
        id: 1, name: '戳泡泡', icon: 'chat-bubble',
        description: '解压小游戏',
        url: '/packageA/pages/bubble/index',
        cardBg: '#FFE8DC', iconBg: '#E5A07B', nameColor: '#B87A5A'
      },
      {
        id: 2, name: '专注时钟', icon: 'time',
        description: '专注工作学习',
        url: '/packageA/pages/focus/focus',
        cardBg: '#DBEAE8', iconBg: '#6FA99E', nameColor: '#4A8E84'
      },
      {
        id: 3, name: '树洞', icon: 'heart',
        description: '心里的话，有人听',
        url: '/packageA/pages/treeHole/treeHole',
        hidden: true
      },
      {
        id: 4, name: '情绪垃圾桶', icon: 'delete',
        description: '丢掉烦恼，治愈自己',
        url: '/packageA/pages/emotion-trash/index',
        cardBg: '#F5DCE0', iconBg: '#D4899A', nameColor: '#A8697A'
      },
      {
        id: 5, name: '涂色画板', icon: 'palette',
        description: '选色涂鸦，放松心情',
        url: '/packageA/pages/coloring/index',
        cardBg: '#E6DCF0', iconBg: '#9B8EC5', nameColor: '#7568A5'
      },
      {
        id: 6, name: '时光纪念墙', icon: 'image',
        description: '记录每一个值得珍藏的时刻',
        url: '/packageB/pages/memory-wall/index',
        cardBg: '#F5E8D0', iconBg: '#E5B87A', nameColor: '#A8884A',
        wide: true, isNew: true
      },
      {
        id: 7, name: '运动足迹', icon: 'chart-bar',
        description: '查看31天运动步数',
        url: '/packageA/pages/werun/werun',
        featured: true, isNew: true
      }
    ]

    // 过滤隐藏的工具
    var filtered = allTools.filter(function (t) {
      if (t.name === '树洞') return false
      return true
    })

    // 分离推荐卡片和普通卡片
    var featuredTool = null
    var gridTools = []
    for (var i = 0; i < filtered.length; i++) {
      if (filtered[i].featured) {
        featuredTool = filtered[i]
      } else {
        filtered[i].delay = (gridTools.length * 0.08 + 0.15).toFixed(2) + 's'
        gridTools.push(filtered[i])
      }
    }

    this.setData({ featuredTool: featuredTool, gridTools: gridTools })
  },

  goToTool(e) {
    var url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({ url: url })
    } else {
      wx.showToast({ title: '敬请期待', icon: 'none' })
    }
  }
})
