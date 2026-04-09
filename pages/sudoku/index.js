// pages/sudoku/index.js - 数独游戏
Page({
  data: {
    phase: 'select',
    difficulties: [
      { id: 'easy', name: '简单', desc: '38个空格', blanks: 38, icon: 'view-list' },
      { id: 'medium', name: '中等', desc: '46个空格', blanks: 46, icon: 'edit' },
      { id: 'hard', name: '困难', desc: '54个空格', blanks: 54, icon: 'edit-1' }
    ],
    board: [],
    solution: [],
    initial: [],
    selectedCell: null,
    timeElapsed: 0,
    timeDisplay: '00:00',
    mistakes: 0,
    maxMistakes: 3,
    gameOver: false,
    gameWon: false,
    notes: [],
    cellSize: 0,
    currentDifficulty: null,
    numPad: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    cellMeta: []
  },

  timer: null,

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    const screenWidth = sysInfo.windowWidth
    const cellSizePx = Math.floor((screenWidth - 32) / 9)
    const cellSize = Math.floor(cellSizePx * (750 / screenWidth))

    const cellMeta = []
    for (let r = 0; r < 9; r++) {
      const row = []
      for (let c = 0; c < 9; c++) {
        row.push({ box: Math.floor(r / 3) * 3 + Math.floor(c / 3) })
      }
      cellMeta.push(row)
    }

    this.setData({ cellSize, cellMeta })
  },

  onUnload() {
    this.stopTimer()
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s)
  },

  updateTimeDisplay() {
    this.setData({ timeDisplay: this.formatTime(this.data.timeElapsed) })
  },

  // ===== Difficulty Selection =====

  selectDifficulty(e) {
    const diffId = e.currentTarget.dataset.id
    const diff = this.data.difficulties.find(d => d.id === diffId)
    if (!diff) return

    this.setData({ currentDifficulty: diff })
    this.generateSudoku(diff.blanks)
  },

  backToSelect() {
    this.stopTimer()
    this.setData({
      phase: 'select',
      board: [], solution: [], initial: [],
      selectedCell: null,
      timeElapsed: 0, timeDisplay: '00:00',
      mistakes: 0, gameOver: false, gameWon: false,
      currentDifficulty: null
    })
  },

  // ===== Sudoku Generation =====

  generateSudoku(blanks) {
    wx.showLoading({ title: '生成中...', mask: true })

    setTimeout(() => {
      const board = Array.from({ length: 9 }, () => Array(9).fill(0))
      this.fillBoard(board)

      const solution = board.map(row => [...row])
      const puzzle = this.createPuzzle(solution, blanks)

      const initial = Array.from({ length: 9 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => puzzle[r][c] !== 0)
      )

      const notes = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => [])
      )

      wx.hideLoading()

      this.setData({
        phase: 'playing',
        board: puzzle, solution, initial, notes,
        selectedCell: null,
        timeElapsed: 0, timeDisplay: '00:00',
        mistakes: 0, gameOver: false, gameWon: false
      })

      this.startTimer()
    }, 100)
  },

  fillBoard(board) {
    const emptyCell = this.findEmpty(board)
    if (!emptyCell) return true

    const { row, col } = emptyCell
    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])

    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i]
      if (this.isValid(board, row, col, num)) {
        board[row][col] = num
        if (this.fillBoard(board)) return true
        board[row][col] = 0
      }
    }
    return false
  },

  findEmpty(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) return { row, col }
      }
    }
    return null
  },

  isValid(board, row, col, num) {
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) return false
    }
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) return false
    }
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if (board[r][c] === num) return false
      }
    }
    return true
  },

  createPuzzle(solution, blanks) {
    const puzzle = solution.map(row => [...row])
    const positions = []
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push({ row: r, col: c })
      }
    }
    this.shuffleArray(positions)

    let removed = 0
    for (let i = 0; i < positions.length && removed < blanks; i++) {
      const { row, col } = positions[i]
      const backup = puzzle[row][col]
      puzzle[row][col] = 0

      const copy = puzzle.map(r => [...r])
      if (this.countSolutions(copy, 2) !== 1) {
        puzzle[row][col] = backup
      } else {
        removed++
      }
    }

    return puzzle
  },

  countSolutions(board, limit) {
    let minCandidates = 10
    let bestCell = null

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          let candidates = 0
          for (let num = 1; num <= 9; num++) {
            if (this.isValid(board, row, col, num)) candidates++
          }
          if (candidates === 0) return 0
          if (candidates < minCandidates) {
            minCandidates = candidates
            bestCell = { row, col }
          }
        }
      }
    }

    if (!bestCell) return 1

    let count = 0
    const { row, col } = bestCell
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(board, row, col, num)) {
        board[row][col] = num
        count += this.countSolutions(board, limit - count)
        board[row][col] = 0
        if (count >= limit) return count
      }
    }

    return count
  },

  shuffleArray(arr) {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = result[i]
      result[i] = result[j]
      result[j] = temp
    }
    return result
  },

  // ===== Cell Interaction =====

  onCellTap(e) {
    if (this.data.gameOver || this.data.gameWon) return
    const row = parseInt(e.currentTarget.dataset.row)
    const col = parseInt(e.currentTarget.dataset.col)
    this.setData({ selectedCell: { row, col } })
  },

  onNumberInput(e) {
    if (this.data.gameOver || this.data.gameWon) return
    const num = parseInt(e.currentTarget.dataset.num)
    const { selectedCell, board, solution, initial, mistakes, maxMistakes, notes } = this.data

    if (!selectedCell) return
    const { row, col } = selectedCell
    if (initial[row][col]) return

    const newBoard = board.map(r => [...r])
    const newNotes = notes.map(r => r.map(c => [...c]))
    newNotes[row][col] = []
    newBoard[row][col] = num

    const isCorrect = solution[row][col] === num
    let newMistakes = mistakes
    let gameOver = false

    if (!isCorrect) {
      newMistakes = mistakes + 1
      if (newMistakes >= maxMistakes) {
        gameOver = true
        this.stopTimer()
      }
    }

    this.setData({ board: newBoard, notes: newNotes, mistakes: newMistakes, gameOver })

    if (!gameOver && isCorrect) {
      this.checkWin()
    }
  },

  onErase() {
    if (this.data.gameOver || this.data.gameWon) return
    const { selectedCell, board, initial } = this.data
    if (!selectedCell) return
    const { row, col } = selectedCell
    if (initial[row][col]) return

    const newBoard = board.map(r => [...r])
    newBoard[row][col] = 0
    const newNotes = this.data.notes.map(r => r.map(c => [...c]))
    newNotes[row][col] = []

    this.setData({ board: newBoard, notes: newNotes })
  },

  checkWin() {
    const { board, solution } = this.data
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== solution[r][c]) return
      }
    }
    this.stopTimer()
    this.setData({ gameWon: true })
  },

  // ===== Game Controls =====

  restartGame() {
    this.stopTimer()
    const { solution, initial, currentDifficulty } = this.data
    if (!currentDifficulty) return

    const puzzle = Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => initial[r][c] ? solution[r][c] : 0)
    )
    const notes = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => [])
    )

    this.setData({
      board: puzzle, selectedCell: null,
      timeElapsed: 0, timeDisplay: '00:00',
      mistakes: 0, gameOver: false, gameWon: false, notes
    })
    this.startTimer()
  },

  // ===== Timer =====

  startTimer() {
    this.stopTimer()
    this.timer = setInterval(() => {
      const timeElapsed = this.data.timeElapsed + 1
      this.setData({ timeElapsed, timeDisplay: this.formatTime(timeElapsed) })
    }, 1000)
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
})
