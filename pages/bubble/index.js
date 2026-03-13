// pages/bubble/index.js - 戳泡泡解压游戏
Page({
  data: {
    bubbles: [],
    score: 0,
    isPlaying: false,
    showDifficultyModal: false, // 是否显示难度选择
    selectedDifficulty: 'normal', // 当前选择的难度
    bubbleInterval: null,
    maxBubbleCount: 120, // 最多生成 120 个泡泡
    spawnedCount: 0, // 已生成的泡泡数量
    maxVisibleBubbles: 5, // 页面上最多同时显示 5 个泡泡
    bubbleSpawnInterval: 800, // 生成间隔（毫秒）
    // 难度配置
    difficulties: [
      { label: '简单', value: 'easy', maxBubbles: 3, spawnInterval: 1200, duration: [6, 9], totalBubbles: 60 },
      { label: '普通', value: 'normal', maxBubbles: 5, spawnInterval: 800, duration: [5, 8], totalBubbles: 100 },
      { label: '困难', value: 'hard', maxBubbles: 7, spawnInterval: 500, duration: [4, 6], totalBubbles: 150 }
    ]
  },

  onLoad() {
    // 初始化泡泡
  },

  onUnload() {
    this.clearBubbles()
  },

  // 显示难度选择
  showDifficultySelect() {
    this.setData({
      showDifficultyModal: true
    })
  },

  // 选择难度
  selectDifficulty(e) {
    const { value } = e.currentTarget.dataset
    const difficulty = this.data.difficulties.find(d => d.value === value)

    if (difficulty) {
      this.setData({
        selectedDifficulty: value,
        showDifficultyModal: false
      })
      this.startGameWithDifficulty(difficulty)
    }
  },

  // 关闭难度选择
  closeDifficultyModal() {
    this.setData({
      showDifficultyModal: false
    })
  },

  // 开始游戏
  startGame() {
    // 显示难度选择
    this.showDifficultySelect()
  },

  // 根据难度开始游戏
  startGameWithDifficulty(difficulty) {
    this.clearBubbles()
    this.setData({
      score: 0,
      isPlaying: true,
      spawnedCount: 0,
      maxVisibleBubbles: difficulty.maxBubbles,
      bubbleSpawnInterval: difficulty.spawnInterval,
      maxBubbleCount: difficulty.totalBubbles,
      bubbleDurationRange: difficulty.duration
    })

    // 每隔一段时间生成新泡泡
    const bubbleInterval = setInterval(() => {
      this.spawnBubble()
    }, this.data.bubbleSpawnInterval)

    // 定期清理已飘出屏幕的泡泡（每 500ms 检查一次）
    const cleanupInterval = setInterval(() => {
      this.cleanupOutOfScreenBubbles()
    }, 500)

    this.setData({
      bubbleInterval,
      cleanupInterval
    })
  },

  // 清理已飘出屏幕的泡泡
  cleanupOutOfScreenBubbles() {
    const { bubbles } = this.data
    const now = Date.now()
    // 保留未戳破且未飘出屏幕的泡泡
    const validBubbles = bubbles.filter(b => {
      // 已戳破的泡泡要移除
      if (b.popped) return false
      // 判断是否已飘出屏幕：当前时间 - 创建时间 > 动画时长（毫秒）
      const elapsed = now - b.createTime
      if (elapsed > b.duration * 1000) {
        return false // 已飘出屏幕，移除
      }
      return true
    })
    if (validBubbles.length !== bubbles.length) {
      this.setData({ bubbles: validBubbles })
    }
  },

  // 清理超时的泡泡
  cleanupBubbles() {
    const { bubbles } = this.data
    // 保留未戳破的泡泡
    const validBubbles = bubbles.filter(b => !b.popped)
    if (validBubbles.length !== bubbles.length) {
      this.setData({ bubbles: validBubbles })
    }
  },

  // 停止游戏
  stopGame() {
    this.clearBubbles()
    this.setData({
      isPlaying: false,
      bubbles: [],
      score: 0,
      spawnedCount: 0
    })
  },

  // 清除所有泡泡
  clearBubbles() {
    if (this.data.bubbleInterval) {
      clearInterval(this.data.bubbleInterval)
      this.setData({ bubbleInterval: null })
    }
    if (this.data.cleanupInterval) {
      clearInterval(this.data.cleanupInterval)
      this.setData({ cleanupInterval: null })
    }
    this.setData({ bubbles: [] })
  },

  // 生成新泡泡
  spawnBubble() {
    const { bubbles, spawnedCount, maxBubbleCount, maxVisibleBubbles } = this.data

    // 检查是否已达到最大泡泡数量
    if (spawnedCount >= maxBubbleCount) {
      this.endGame()
      return
    }

    // 检查当前页面上的泡泡数量（排除已戳破的）
    const visibleBubbles = bubbles.filter(b => !b.popped).length
    if (visibleBubbles >= maxVisibleBubbles) {
      // 页面上已经有 5 个泡泡，暂停生成
      return
    }

    // 生成随机位置（水平方向 5%-95%，从左到右随机）
    const left = Math.floor(Math.random() * 90) + 5
    // 随机大小（100-160rpx）- 更大一些
    const size = Math.floor(Math.random() * 60) + 100
    // 根据难度设置随机飘动速度
    const durationRange = this.data.bubbleDurationRange || [5, 8]
    const duration = Math.floor(Math.random() * (durationRange[1] - durationRange[0] + 1)) + durationRange[0]

    const newBubble = {
      id: Date.now(),
      left: left,
      size: size,
      duration: duration,
      popped: false,
      createTime: Date.now()
    }

    this.setData({
      bubbles: [...bubbles, newBubble],
      spawnedCount: spawnedCount + 1
    })
  },

  // 结束游戏
  endGame() {
    const { bubbleInterval } = this.data
    if (bubbleInterval) {
      clearInterval(bubbleInterval)
      this.setData({ bubbleInterval: null })
    }

    this.setData({
      isPlaying: false
    })

    // 重置生成计数器，以便下次游戏可以重新开始
    this.setData({
      spawnedCount: 0
    })

    wx.showModal({
      title: '游戏结束',
      content: `你戳破了 ${this.data.score} 个泡泡！`,
      showCancel: false,
      confirmText: '再玩一次',
      success: (res) => {
        if (res.confirm) {
          this.startGame()
        }
      }
    })
  },

  // 戳泡泡
  popBubble(e) {
    const { id } = e.currentTarget.dataset
    const { bubbles, score } = this.data

    const bubbleIndex = bubbles.findIndex(b => b.id === id)
    if (bubbleIndex !== -1 && !bubbles[bubbleIndex].popped) {
      // 直接移除泡泡，不先标记为 popped
      const newBubbles = bubbles.filter((b, index) => index !== bubbleIndex)

      // 更新分数和泡泡数组
      this.setData({
        bubbles: newBubbles,
        score: score + 1
      })
    }
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止弹窗点击关闭
  },

  onUnload() {
    this.clearBubbles()
  }
})
