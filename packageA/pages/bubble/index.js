// packageA/pages/bubble/index.js
Page({
  data: {
    bubbles: [],
    score: 0,
    isPlaying: false,
    showModal: false,
    selDiff: 'normal',
    targetScore: 80,
    comboCount: 0,
    comboShow: false,
    comboText: '',
    difficulties: [
      { label: '轻松', v: 'easy', max: 6, total: 40, lifespan: 7000, spawnRate: 900 },
      { label: '普通', v: 'normal', max: 10, total: 80, lifespan: 5500, spawnRate: 600 },
      { label: '疯狂', v: 'hard', max: 15, total: 120, lifespan: 4000, spawnRate: 400 }
    ],
    palettes: [
      { grad: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), #FFB5A9 72%)', solid: '#FFB5A9' },
      { grad: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), #A8D5CC 72%)', solid: '#A8D5CC' },
      { grad: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), #FFE4A0 72%)', solid: '#FFE4A0' },
      { grad: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), #C4B5FD 72%)', solid: '#C4B5FD' },
      { grad: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), #93C5FD 72%)', solid: '#93C5FD' },
      { grad: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), #FCA5A5 72%)', solid: '#FCA5A5' },
      { grad: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), #86EFAC 72%)', solid: '#86EFAC' },
      { grad: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92), #FDE68A 72%)', solid: '#FDE68A' }
    ]
  },

  _timers: [],

  onUnload() { this._clearAll() },

  _clearAll() {
    this._timers.forEach(t => clearInterval(t))
    this._timers = []
    if (this._comboT) clearTimeout(this._comboT)
  },

  startGame() { this.setData({ showModal: true }) },

  pickDiff(e) {
    const diff = this.data.difficulties.find(d => d.v === e.currentTarget.dataset.v)
    if (!diff) return
    this.setData({ showModal: false, selDiff: diff.v })
    this._start(diff)
  },

  closeModal() { this.setData({ showModal: false }) },
  noop() {},

  _start(cfg) {
    this._clearAll()
    this.setData({
      bubbles: [], score: 0, isPlaying: true,
      targetScore: cfg.total, comboCount: 0, comboShow: false
    })

    // 持续生成泡泡
    const spawnT = setInterval(() => this._spawn(cfg), cfg.spawnRate)
    // 检查超时
    const checkT = setInterval(() => this._checkLife(), 200)
    this._timers = [spawnT, checkT]

    // 立刻生成几个
    for (let i = 0; i < Math.min(cfg.max, 4); i++) {
      setTimeout(() => this._spawn(cfg), i * 120)
    }
  },

  stopGame() {
    this._clearAll()
    this.setData({ isPlaying: false, bubbles: [], score: 0, comboShow: false })
  },

  _spawn(cfg) {
    const { bubbles, palettes } = this.data
    const alive = bubbles.filter(b => !b.popping && !b.fading).length

    if (alive >= cfg.max) return
    if (bubbles.length >= cfg.total + 20) {
      // 全部生成完了，检查存活
      if (alive === 0) this._end()
      return
    }

    const p = palettes[Math.floor(Math.random() * palettes.length)]
    const size = Math.floor(Math.random() * 40) + 90 // 90-130rpx
    const x = Math.floor(Math.random() * 78) + 8 // 8-86%
    const y = Math.floor(Math.random() * 78) + 8 // 8-86%
    const lifespan = cfg.lifespan + Math.floor(Math.random() * 2000) - 1000
    const driftX = (Math.random() - 0.5) * 40 // 漂移方向
    const driftY = (Math.random() - 0.5) * 30

    this.setData({
      bubbles: [...bubbles, {
        id: Date.now() + Math.random(),
        x, y, size,
        color: p.grad,
        solidColor: p.solid,
        delay: Math.floor(Math.random() * 60),
        lifespan: Math.max(lifespan, 3000),
        driftX, driftY,
        popping: false,
        fading: false,
        showRing: true,
        born: Date.now()
      }]
    })
  },

  _checkLife() {
    const now = Date.now()
    const bubbles = this.data.bubbles
    let changed = false
    const updated = bubbles.map(b => {
      if (!b.popping && !b.fading && now - b.born > b.lifespan) {
        changed = true
        return { ...b, fading: true }
      }
      return b
    })

    if (changed) {
      // 清理已完成的
      const cleaned = updated.filter(b => {
        if (b.popping && now - b.popAt > 500) return false
        if (b.fading && now - b.born > b.lifespan + 600) return false
        return true
      })
      this.setData({ bubbles: cleaned })

      const alive = cleaned.filter(b => !b.popping && !b.fading).length
      if (this.data.score + alive < this.data.targetScore && cleaned.length >= this.data.targetScore) {
        // 没希望了
        const remaining = cleaned.filter(b => !b.popping && !b.fading)
        if (remaining.length === 0) this._end()
      }
    }
  },

  popBubble(e) {
    const idx = e.currentTarget.dataset.idx
    const b = this.data.bubbles[idx]
    if (!b || b.popping || b.fading) return

    const updated = [...this.data.bubbles]
    updated[idx] = { ...b, popping: true, popAt: Date.now(), showRing: false }

    const newScore = this.data.score + 1
    const combo = this.data.comboCount + 1
    let comboText = '', comboShow = false
    if (combo >= 15) { comboText = '无敌 x' + combo; comboShow = true }
    else if (combo >= 10) { comboText = '超神 x' + combo; comboShow = true }
    else if (combo >= 5) { comboText = '连击 x' + combo; comboShow = true }
    else if (combo >= 3) { comboText = '不错 x' + combo; comboShow = true }

    this.setData({ bubbles: updated, score: newScore, comboCount: combo, comboText, comboShow })

    if (this._comboT) clearTimeout(this._comboT)
    this._comboT = setTimeout(() => this.setData({ comboCount: 0, comboShow: false }), 1200)

    wx.vibrateShort({ type: 'light' })

    if (newScore >= this.data.targetScore) {
      setTimeout(() => this._end(), 300)
    }
  },

  _end() {
    this._clearAll()
    const s = this.data.score
    const t = this.data.targetScore
    let msg = '继续加油！'
    if (s >= t) msg = '完美通关！太厉害了！'
    else if (s >= t * 0.8) msg = '差一点就全中！很棒！'
    else if (s >= t * 0.5) msg = '还不错，再试试手速！'

    this.setData({ isPlaying: false, comboShow: false })

    wx.showModal({
      title: '游戏结束',
      content: `戳破 ${s}/${t} 个泡泡\n${msg}`,
      showCancel: true,
      cancelText: '返回',
      confirmText: '再来一次',
      confirmColor: '#8EC5B9',
      success: res => { if (res.confirm) this.startGame() }
    })
  }
})
