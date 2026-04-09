// pages/emotion-trash/index.js - 情绪垃圾桶
Page({
  data: {
    emotionText: '',
    selectedEmotion: '',
    isAnimating: false,
    isDone: false,
    animPhase: 0,
    shreds: [],
    healingQuote: '',
    quickEmotions: [
      '工作压力大',
      '被领导骂了',
      '加班太累',
      '工资太低',
      '同事好烦',
      '想辞职',
      '通勤太久',
      '睡眠不足'
    ],
    quotes: [
      '你已经很努力了，给自己一个拥抱吧',
      '烦恼就像云朵，终会被风吹散',
      '每一天都是新的开始，昨天的不开心就让它过去吧',
      '比起抱怨，不如好好犒劳一下自己',
      '世界那么大，没什么过不去的坎',
      '累了就休息一下吧，没什么大不了的',
      '打工人不哭，明天会更好',
      '你值得被温柔以待',
      '深呼吸，一切都会好起来的',
      '生活不止眼前的苟且，还有诗和远方',
      '今天的烦恼就到此为止吧',
      '你比你想象的更加强大',
      '没有什么是一顿美食解决不了的',
      '放轻松，你已经做得很好了'
    ]
  },

  onInput(e) {
    this.setData({ emotionText: e.detail.value })
  },

  selectEmotion(e) {
    const text = e.currentTarget.dataset.text
    const { emotionText, selectedEmotion } = this.data

    if (selectedEmotion === text) {
      this.setData({ selectedEmotion: '' })
      return
    }

    this.setData({
      selectedEmotion: text,
      emotionText: emotionText + (emotionText ? '，' : '') + text
    })
  },

  throwAway() {
    if (!this.data.emotionText) return

    // 生成碎纸片数据
    const shreds = []
    const colors = ['#FFB5A9', '#FF9F8F', '#8EC5B9', '#A8D5CC', '#FFD700', '#FFE4E1', '#E8F5F3']
    for (let i = 0; i < 20; i++) {
      shreds.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.floor(Math.random() * 360),
        top: Math.floor(Math.random() * 300),
        delay: Math.floor(Math.random() * 400),
        tx: (Math.random() - 0.5) * 400 + 'rpx',
        ty: (Math.random() - 0.5) * 400 + 'rpx',
        rot: Math.floor(Math.random() * 720) + 'deg'
      })
    }

    // 设置CSS变量到碎纸片
    shreds.forEach(s => {
      s.style = `background:${s.color};left:${s.left}rpx;top:${s.top}rpx;animation-delay:${s.delay}ms;--tx:${s.tx};--ty:${s.ty};--rot:${s.rot}`
    })

    this.setData({
      isAnimating: true,
      animPhase: 1,
      shreds
    })

    // 阶段2：掉落
    setTimeout(() => {
      this.setData({ animPhase: 2 })
    }, 600)

    // 阶段3：碎裂
    setTimeout(() => {
      this.setData({ animPhase: 3 })
    }, 1400)

    // 完成
    setTimeout(() => {
      const quote = this.data.quotes[Math.floor(Math.random() * this.data.quotes.length)]
      this.setData({
        isAnimating: false,
        isDone: true,
        healingQuote: quote
      })
    }, 2800)
  },

  restart() {
    this.setData({
      emotionText: '',
      selectedEmotion: '',
      isAnimating: false,
      isDone: false,
      animPhase: 0,
      shreds: [],
      healingQuote: ''
    })
  }
})
