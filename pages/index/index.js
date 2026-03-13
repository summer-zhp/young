// pages/index/index.js
const { cloud } = require('../../utils/cloud')

// 分类名称映射
const CATEGORY_NAMES = {
  work: '工作',
  life: '生活',
  love: '情感',
  friendship: '友谊'
}

// 默认治愈内容（云函数失败时显示）
const DEFAULT_CONTENTS = [
  { content: '今天辛苦了，但请记住，你比想象中更强大。', category: 'work' },
  { content: '每一步努力都不会白费，即使现在看不到回报。', category: 'growth' },
  { content: '工作再忙，也要记得照顾好自己的心情。', category: 'life' },
  { content: '成为更好的自己，从现在开始。', category: 'growth' },
  { content: '你不需要和别人比较，只要今天的你比昨天更好。', category: 'growth' },
  { content: '世界很大，有人懂你的辛苦，也有人为你加油。', category: 'warmth' },
  { content: '累了就休息一下吧，明天再继续。', category: 'warmth' },
  { content: '你值得被温柔对待，包括被自己。', category: 'warmth' }
]

Page({
  data: {
    // 页面状态
    loading: true,
    error: false,

    // 治愈内容
    dailyContent: null,
    contentHistory: [],

    // 收藏状态
    isFavorited: false,

    // 日期
    todayDate: ''
  },

  /**
   * 页面加载
   */
  onLoad() {
    this.formatDate()
    this.loadDailyContent()
  },

  /**
   * 页面显示
   */
  onShow() {
    // 检查收藏状态
    if (this.data.dailyContent && this.data.dailyContent._id) {
      this.checkFavoriteStatus(this.data.dailyContent._id)
    }
  },

  /**
   * 格式化日期
   */
  formatDate() {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekday = weekdays[now.getDay()]

    this.setData({
      todayDate: `${month}月${day}日 周${weekday}`
    })
  },

  /**
   * 获取分类名称
   */
  getCategoryName(category) {
    if (!category) return '治愈'
    return CATEGORY_NAMES[category] || category
  },

  /**
   * 加载今日治愈内容
   */
  async loadDailyContent() {
    try {
      this.setData({ loading: true, error: false })

      const result = await cloud.callFunction('getDailyContent')

      if (result.success && result.data) {
        this.setData({
          dailyContent: result.data,
          loading: false
        })

        // 检查收藏状态
        if (result.data._id) {
          this.checkFavoriteStatus(result.data._id)
        }
      } else {
        throw new Error('获取数据失败')
      }
    } catch (error) {
      console.error('加载治愈内容失败:', error)
      // 云函数失败时，显示默认内容
      const randomContent = DEFAULT_CONTENTS[Math.floor(Math.random() * DEFAULT_CONTENTS.length)]
      this.setData({
        dailyContent: randomContent,
        loading: false,
        error: false // 不显示错误，使用默认内容
      })
    }
  },

  /**
   * 加载下一条内容
   */
  async loadNextContent() {
    try {
      wx.showLoading({ title: '加载中...', mask: true })

      const result = await cloud.callFunction('getContentList', {
        page: 1,
        pageSize: 20
      })

      if (result.success && result.data?.list?.length > 0) {
        const { list } = result.data
        const availableContents = list.filter(
          item => item._id !== this.data.dailyContent?._id
        )

        if (availableContents.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableContents.length)
          const newContent = availableContents[randomIndex]

          this.setData({
            dailyContent: newContent,
            contentHistory: [...this.data.contentHistory, this.data.dailyContent]
          })

          if (newContent._id) {
            this.checkFavoriteStatus(newContent._id)
          }
        } else {
          // 没有更多内容，使用默认内容
          this.loadRandomDefaultContent()
        }
      } else {
        // 云函数失败，使用默认内容
        this.loadRandomDefaultContent()
      }
    } catch (error) {
      console.error('加载下一条内容失败:', error)
      this.loadRandomDefaultContent()
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 加载随机默认内容
   */
  loadRandomDefaultContent() {
    const availableContents = DEFAULT_CONTENTS.filter(
      item => item.content !== this.data.dailyContent?.content
    )
    const randomContent = availableContents[Math.floor(Math.random() * availableContents.length)] || DEFAULT_CONTENTS[0]
    this.setData({
      dailyContent: randomContent
    })
    wx.showToast({
      title: '已换一条',
      icon: 'none'
    })
  },

  /**
   * 检查收藏状态
   */
  async checkFavoriteStatus(contentId) {
    if (!contentId) return

    try {
      const result = await cloud.callFunction('getUserFavorites', {
        page: 1,
        pageSize: 100
      })

      if (result && result.success) {
        const isFavorited = (result.data.favorites || []).some(
          fav => fav.content_id === contentId
        )
        this.setData({ isFavorited })
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error)
    }
  },

  /**
   * 切换收藏状态
   */
  async toggleFavorite() {
    // 检查是否已登录
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showModal({
        title: '提示',
        content: '收藏功能需要登录，请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/profile/profile'
            })
          }
        }
      })
      return
    }

    const { dailyContent, isFavorited } = this.data

    if (!dailyContent || (!dailyContent._id && !dailyContent.content)) {
      wx.showToast({
        title: '内容不能为空',
        icon: 'none'
      })
      return
    }

    try {
      const functionName = isFavorited ? 'removeFromFavorites' : 'addToFavorites'
      const result = await cloud.callFunction(functionName, {
        content_id: dailyContent._id || Date.now().toString(),
        content_snapshot: {
          content: dailyContent.content,
          background_image: dailyContent.background_image || '',
          category: dailyContent.category || 'default'
        }
      })

      if (result && result.success) {
        this.setData({ isFavorited: !isFavorited })
        wx.showToast({
          title: isFavorited ? '已取消收藏' : '收藏成功',
          icon: 'success'
        })
      } else if (result && result.message === '已收藏') {
        this.setData({ isFavorited: true })
        wx.showToast({
          title: '已收藏',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      // 云函数失败时，本地切换状态
      this.setData({ isFavorited: !isFavorited })
      wx.showToast({
        title: isFavorited ? '已取消收藏' : '收藏成功',
        icon: 'success'
      })
    }
  },

  /**
   * 分享内容
   */
  shareContent() {
    const { dailyContent } = this.data

    if (!dailyContent?.content) {
      wx.showToast({
        title: '暂无内容',
        icon: 'none'
      })
      return
    }

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })

    wx.showToast({
      title: '点击右上角分享',
      icon: 'none',
      duration: 2000
    })
  },

  /**
   * 分享好友
   */
  onShareAppMessage() {
    const { dailyContent, todayDate } = this.data

    return {
      title: `【${todayDate}】${dailyContent?.content || '打工人治愈所 - 今日治愈'}`,
      path: '/pages/index/index',
      imageUrl: ''
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const { dailyContent } = this.data

    return {
      title: '打工人治愈所 - 给忙碌的你一份小确幸',
      query: '',
      imageUrl: ''
    }
  }
})
