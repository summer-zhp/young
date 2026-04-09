// pages/game2048/index.js
const app = getApp()

const TILE_COLORS = {
  2: { bg: '#E8F5F3', text: '#2D6A5E' },
  4: { bg: '#D0EBE5', text: '#2D6A5E' },
  8: { bg: '#A8D8CC', text: '#FFFFFF' },
  16: { bg: '#8EC5B9', text: '#FFFFFF' },
  32: { bg: '#6FA99A', text: '#FFFFFF' },
  64: { bg: '#5A9284', text: '#FFFFFF' },
  128: { bg: '#FFB5A9', text: '#FFFFFF' },
  256: { bg: '#FF9A8B', text: '#FFFFFF' },
  512: { bg: '#FF8370', text: '#FFFFFF' },
  1024: { bg: '#FF6B5A', text: '#FFFFFF' },
  2048: { bg: '#FFD700', text: '#FFFFFF' }
}

function getTileColor(value) {
  if (TILE_COLORS[value]) return TILE_COLORS[value]
  return { bg: '#8B5CF6', text: '#FFFFFF' }
}

function getFontSize(value, cellSize) {
  var len = String(value).length
  if (len <= 1) return Math.floor(cellSize * 0.45)
  if (len <= 2) return Math.floor(cellSize * 0.38)
  if (len <= 3) return Math.floor(cellSize * 0.30)
  return Math.floor(cellSize * 0.24)
}

Page({
  data: {
    phase: 'select',
    difficulties: [
      { id: 'easy', name: '简单', desc: '3x3 网格', size: 3, icon: 'app' },
      { id: 'medium', name: '中等', desc: '4x4 网格', size: 4, icon: 'system-3' },
      { id: 'hard', name: '困难', desc: '5x5 网格', size: 5, icon: 'menu-application' }
    ],
    gridSize: 4,
    grid: [],
    cellInfo: [],
    cellSize: 0,
    score: 0,
    bestScore: 0,
    gameOver: false,
    gameWon: false,
    touchStartX: 0,
    touchStartY: 0
  },

  onLoad: function () {
    var bestScore = wx.getStorageSync('game2048_bestScore') || 0
    this.setData({ bestScore: bestScore })
  },

  // ===== Difficulty Selection =====

  selectDifficulty: function (e) {
    var size = e.currentTarget.dataset.size
    this.initGame(size)
  },

  // ===== Game Init =====

  initGame: function (size) {
    var grid = []
    for (var r = 0; r < size; r++) {
      grid[r] = []
      for (var c = 0; c < size; c++) {
        grid[r][c] = 0
      }
    }

    var sysInfo = wx.getSystemInfoSync()
    var screenWidth = sysInfo.windowWidth
    var padding = 24
    var gap = 8
    var cellSize = Math.floor((screenWidth - padding * 2 - gap * (size + 1)) / size)

    this.setData({
      phase: 'playing',
      gridSize: size,
      grid: grid,
      score: 0,
      gameOver: false,
      gameWon: false,
      cellSize: cellSize
    })

    this.addRandomTile()
    this.addRandomTile()
    this.buildCellInfo()
  },

  addRandomTile: function () {
    var grid = this.data.grid
    var size = this.data.gridSize
    var emptyCells = []

    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (grid[r][c] === 0) {
          emptyCells.push({ r: r, c: c })
        }
      }
    }

    if (emptyCells.length === 0) return

    var rand = Math.floor(Math.random() * emptyCells.length)
    var cell = emptyCells[rand]
    var value = Math.random() < 0.9 ? 2 : 4
    grid[cell.r][cell.c] = value
    this.setData({ grid: grid })
  },

  buildCellInfo: function () {
    var grid = this.data.grid
    var size = this.data.gridSize
    var cellSize = this.data.cellSize
    var cellInfo = []

    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var value = grid[r][c]
        var color = getTileColor(value)
        var fontSize = getFontSize(value, cellSize)
        cellInfo.push({
          row: r,
          col: c,
          value: value,
          bg: value === 0 ? '#EFEFEF' : color.bg,
          textColor: value === 0 ? 'transparent' : color.text,
          fontSize: fontSize,
          isTile: value > 0
        })
      }
    }

    this.setData({ cellInfo: cellInfo })
  },

  // ===== Touch Handling =====

  onTouchStart: function (e) {
    if (this.data.gameOver || this.data.gameWon) return
    var touch = e.touches[0]
    this.setData({ touchStartX: touch.clientX, touchStartY: touch.clientY })
  },

  onTouchEnd: function (e) {
    if (this.data.gameOver || this.data.gameWon) return
    var touch = e.changedTouches[0]
    var dx = touch.clientX - this.data.touchStartX
    var dy = touch.clientY - this.data.touchStartY

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return

    var direction = ''
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left'
    } else {
      direction = dy > 0 ? 'down' : 'up'
    }

    this.move(direction)
  },

  // ===== Game Logic =====

  move: function (direction) {
    var grid = this.data.grid
    var size = this.data.gridSize
    var score = this.data.score
    var moved = false

    var lines = []
    if (direction === 'left') {
      for (var r = 0; r < size; r++) {
        var line = []
        for (var c = 0; c < size; c++) line.push(grid[r][c])
        lines.push({ line: line, row: r, col: 0, dir: 'h' })
      }
    } else if (direction === 'right') {
      for (var r = 0; r < size; r++) {
        var line = []
        for (var c = size - 1; c >= 0; c--) line.push(grid[r][c])
        lines.push({ line: line, row: r, col: 0, dir: 'rh' })
      }
    } else if (direction === 'up') {
      for (var c = 0; c < size; c++) {
        var line = []
        for (var r = 0; r < size; r++) line.push(grid[r][c])
        lines.push({ line: line, row: 0, col: c, dir: 'v' })
      }
    } else if (direction === 'down') {
      for (var c = 0; c < size; c++) {
        var line = []
        for (var r = size - 1; r >= 0; r--) line.push(grid[r][c])
        lines.push({ line: line, row: 0, col: c, dir: 'rv' })
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var slideResult = this.slideLine(lines[i].line)
      var newLine = slideResult.line
      score += slideResult.score

      var original = lines[i].line
      for (var j = 0; j < newLine.length; j++) {
        if (original[j] !== newLine[j]) { moved = true; break }
      }

      var info = lines[i]
      if (info.dir === 'h') {
        for (var c = 0; c < size; c++) grid[info.row][c] = newLine[c]
      } else if (info.dir === 'rh') {
        for (var c = 0; c < size; c++) grid[info.row][size - 1 - c] = newLine[c]
      } else if (info.dir === 'v') {
        for (var r = 0; r < size; r++) grid[r][info.col] = newLine[r]
      } else if (info.dir === 'rv') {
        for (var r = 0; r < size; r++) grid[size - 1 - r][info.col] = newLine[r]
      }
    }

    if (moved) {
      this.setData({ grid: grid, score: score })
      this.addRandomTile()
      this.buildCellInfo()

      var bestScore = this.data.bestScore
      if (score > bestScore) {
        bestScore = score
        this.setData({ bestScore: bestScore })
        wx.setStorageSync('game2048_bestScore', bestScore)
      }

      this.checkWin()
      this.checkGameOver()
    }
  },

  slideLine: function (line) {
    var score = 0
    var len = line.length

    var compacted = []
    for (var i = 0; i < len; i++) {
      if (line[i] !== 0) compacted.push(line[i])
    }

    var merged = []
    var i = 0
    while (i < compacted.length) {
      if (i + 1 < compacted.length && compacted[i] === compacted[i + 1]) {
        var newVal = compacted[i] * 2
        merged.push(newVal)
        score += newVal
        i += 2
      } else {
        merged.push(compacted[i])
        i += 1
      }
    }

    while (merged.length < len) {
      merged.push(0)
    }

    return { line: merged, score: score }
  },

  canMove: function () {
    var grid = this.data.grid
    var size = this.data.gridSize
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (grid[r][c] === 0) return true
        if (c + 1 < size && grid[r][c] === grid[r][c + 1]) return true
        if (r + 1 < size && grid[r][c] === grid[r + 1][c]) return true
      }
    }
    return false
  },

  checkGameOver: function () {
    if (!this.canMove()) {
      this.setData({ gameOver: true })
    }
  },

  checkWin: function () {
    var grid = this.data.grid
    var size = this.data.gridSize
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (grid[r][c] >= 2048) {
          this.setData({ gameWon: true })
          return
        }
      }
    }
  },

  // ===== Controls =====

  restartGame: function () {
    this.initGame(this.data.gridSize)
  },

  backToSelect: function () {
    this.setData({
      phase: 'select',
      grid: [],
      score: 0,
      gameOver: false,
      gameWon: false
    })
  },

  continuePlay: function () {
    this.setData({ gameWon: false })
  }
})
