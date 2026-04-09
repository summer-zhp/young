// pages/minesweeper/index.js
const app = getApp()

Page({
  data: {
    phase: 'select',
    difficulties: [
      { id: 'easy', name: '简单', desc: '9x9 \u00b7 10\u4e2a\u96f7', rows: 9, cols: 9, mines: 10 },
      { id: 'medium', name: '\u4e2d\u7b49', desc: '16x16 \u00b7 40\u4e2a\u96f7', rows: 16, cols: 16, mines: 40 },
      { id: 'hard', name: '\u56f0\u96be', desc: '16x30 \u00b7 99\u4e2a\u96f7', rows: 16, cols: 30, mines: 99 }
    ],
    currentDifficulty: null,
    board: [],
    rows: 0,
    cols: 0,
    totalMines: 0,
    minesLeft: 0,
    timeElapsed: 0,
    gameOver: false,
    gameWon: false,
    firstClick: true,
    cellSize: 0,
    timer: null
  },

  onLoad: function () {
    var sysInfo = wx.getSystemInfoSync()
    this.windowWidth = sysInfo.windowWidth
  },

  onUnload: function () {
    this.stopTimer()
  },

  onHide: function () {
    this.stopTimer()
  },

  // ===== Difficulty Selection =====

  selectDifficulty: function (e) {
    var id = e.currentTarget.dataset.id
    var difficulties = this.data.difficulties
    var diff = null
    for (var i = 0; i < difficulties.length; i++) {
      if (difficulties[i].id === id) {
        diff = difficulties[i]
        break
      }
    }
    if (!diff) return

    this.setData({
      currentDifficulty: diff,
      rows: diff.rows,
      cols: diff.cols,
      totalMines: diff.mines,
      minesLeft: diff.mines,
      timeElapsed: 0,
      gameOver: false,
      gameWon: false,
      firstClick: true,
      phase: 'playing'
    })

    this.initBoard(diff.rows, diff.cols, diff.mines)
    this.calculateCellSize(diff.cols)
  },

  // ===== Board Initialization =====

  initBoard: function (rows, cols, mines) {
    var board = []
    for (var r = 0; r < rows; r++) {
      var row = []
      for (var c = 0; c < cols; c++) {
        row.push({
          mine: false,
          revealed: false,
          flagged: false,
          adjacentMines: 0
        })
      }
      board.push(row)
    }
    this.setData({ board: board })
  },

  calculateCellSize: function (cols) {
    var padding = 16
    var totalPadding = padding * 2
    var cellSize = Math.floor((this.windowWidth - totalPadding) / cols)
    if (cellSize > 48) cellSize = 48
    if (cellSize < 20) cellSize = 20
    this.setData({ cellSize: cellSize })
  },

  // ===== Mine Placement =====

  placeMines: function (safeRow, safeCol) {
    var board = this.data.board
    var rows = this.data.rows
    var cols = this.data.cols
    var mines = this.data.totalMines
    var placed = 0

    while (placed < mines) {
      var r = Math.floor(Math.random() * rows)
      var c = Math.floor(Math.random() * cols)

      // Skip if within 3x3 safe zone around first click
      if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue
      // Skip if already a mine
      if (board[r][c].mine) continue

      board[r][c].mine = true
      placed++
    }

    this.calculateAdjacent()
  },

  // ===== Adjacent Mines Calculation =====

  calculateAdjacent: function () {
    var board = this.data.board
    var rows = this.data.rows
    var cols = this.data.cols

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (board[r][c].mine) continue
        var count = 0
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue
            var nr = r + dr
            var nc = c + dc
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (board[nr][nc].mine) count++
            }
          }
        }
        board[r][c].adjacentMines = count
      }
    }

    this.setData({ board: board })
  },

  // ===== Cell Interaction =====

  onCellTap: function (e) {
    if (this.data.gameOver) return

    var row = e.currentTarget.dataset.row
    var col = e.currentTarget.dataset.col
    var board = this.data.board
    var cell = board[row][col]

    if (cell.revealed || cell.flagged) return

    // First click: place mines
    if (this.data.firstClick) {
      this.placeMines(row, col)
      this.setData({ firstClick: false })
      this.startTimer()
    }

    board = this.data.board

    // Hit a mine
    if (board[row][col].mine) {
      board[row][col].revealed = true
      this.setData({ board: board })
      this.gameOverHandler(false)
      return
    }

    // Reveal the cell
    this.revealCell(row, col)
    this.checkWin()
  },

  onCellLongPress: function (e) {
    if (this.data.gameOver) return
    if (this.data.firstClick) return

    var row = e.currentTarget.dataset.row
    var col = e.currentTarget.dataset.col
    var board = this.data.board
    var cell = board[row][col]

    if (cell.revealed) return

    var minesLeft = this.data.minesLeft
    if (cell.flagged) {
      cell.flagged = false
      minesLeft++
    } else {
      cell.flagged = true
      minesLeft--
    }

    this.setData({
      board: board,
      minesLeft: minesLeft
    })
  },

  // ===== Reveal Logic (Flood Fill) =====

  revealCell: function (row, col) {
    var board = this.data.board
    var rows = this.data.rows
    var cols = this.data.cols

    if (row < 0 || row >= rows || col < 0 || col >= cols) return

    var cell = board[row][col]
    if (cell.revealed || cell.flagged || cell.mine) return

    cell.revealed = true

    if (cell.adjacentMines === 0) {
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          this.revealCell(row + dr, col + dc)
        }
      }
    }

    this.setData({ board: board })
  },

  // ===== Win Check =====

  checkWin: function () {
    var board = this.data.board
    var rows = this.data.rows
    var cols = this.data.cols

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (!board[r][c].mine && !board[r][c].revealed) return
      }
    }

    this.gameOverHandler(true)
  },

  // ===== Game Over =====

  gameOverHandler: function (won) {
    this.stopTimer()

    var board = this.data.board
    var rows = this.data.rows
    var cols = this.data.cols

    // Reveal all mines on loss
    if (!won) {
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (board[r][c].mine) {
            board[r][c].revealed = true
          }
        }
      }
    }

    this.setData({
      board: board,
      gameOver: true,
      gameWon: won
    })
  },

  // ===== Restart / Navigation =====

  restartGame: function () {
    var diff = this.data.currentDifficulty
    if (!diff) return

    this.stopTimer()
    this.setData({
      rows: diff.rows,
      cols: diff.cols,
      totalMines: diff.mines,
      minesLeft: diff.mines,
      timeElapsed: 0,
      gameOver: false,
      gameWon: false,
      firstClick: true
    })

    this.initBoard(diff.rows, diff.cols, diff.mines)
    this.calculateCellSize(diff.cols)
  },

  backToSelect: function () {
    this.stopTimer()
    this.setData({
      phase: 'select',
      board: [],
      currentDifficulty: null,
      gameOver: false,
      gameWon: false,
      timeElapsed: 0,
      firstClick: true
    })
  },

  // ===== Timer =====

  startTimer: function () {
    var that = this
    this.stopTimer()
    this.setData({ timeElapsed: 0 })

    this.data.timer = setInterval(function () {
      if (that.data.gameOver) {
        that.stopTimer()
        return
      }
      that.setData({ timeElapsed: that.data.timeElapsed + 1 })
    }, 1000)
  },

  stopTimer: function () {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({ timer: null })
    }
  },

  // ===== Utility =====

  formatTime: function (seconds) {
    var m = Math.floor(seconds / 60)
    var s = seconds % 60
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
  }
})