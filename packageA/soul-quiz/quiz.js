// packageA/soul-quiz/quiz.js - 答题页（4选项版）
var soulQuizData = require('../../utils/soulQuizData')
var questions = soulQuizData.questions

var dimensionLabels = {
  'EI': '性格倾向',
  'SN': '认知方式',
  'TF': '决策方式',
  'JP': '生活态度'
}

// 从 answers 数组中读取指定索引的答案（转为数字），无答案返回 -1
function getSavedAnswer(answers, index) {
  var val = answers[index]
  if (val !== undefined && val !== null) {
    return parseInt(val)
  }
  return -1
}

Page({
  data: {
    currentIndex: 0,
    total: 40,
    percent: 3,
    currentQuestion: null,
    currentDimension: '',
    selectedOption: -1,
    answers: [],
    animClass: '',
    submitting: false,
    transitioning: false,
    hasNextAnswer: false
  },

  onLoad: function () {
    if (!questions || questions.length === 0) {
      wx.showToast({ title: '题目加载失败', icon: 'none' })
      return
    }
    this.setData({
      currentQuestion: questions[0],
      currentDimension: dimensionLabels[questions[0].dimension]
    })
  },

  selectOption: function (e) {
    if (this.data.submitting || this.data.transitioning) return

    var index = parseInt(e.currentTarget.dataset.index)
    var currentIndex = this.data.currentIndex
    var answers = this.data.answers.slice()

    answers[currentIndex] = index

    this.setData({
      selectedOption: index,
      answers: answers,
      transitioning: true
    })

    var that = this
    setTimeout(function () {
      if (currentIndex < 39) {
        that.goToIndex(currentIndex + 1)
      } else {
        that.submitQuiz(answers)
      }
    }, 500)
  },

  // 通用：跳转到指定题目索引
  goToIndex: function (targetIndex) {
    if (targetIndex < 0 || targetIndex >= questions.length) {
      this.setData({ transitioning: false })
      return
    }

    var q = questions[targetIndex]
    if (!q) {
      this.setData({ transitioning: false })
      return
    }

    var answers = this.data.answers
    this.setData({ animClass: 'card-exit' })

    var that = this
    setTimeout(function () {
      that.setData({
        currentIndex: targetIndex,
        percent: Math.round((targetIndex + 1) / 40 * 100),
        currentQuestion: q,
        currentDimension: dimensionLabels[q.dimension],
        selectedOption: getSavedAnswer(answers, targetIndex),
        animClass: 'card-enter',
        transitioning: false,
        hasNextAnswer: getSavedAnswer(answers, targetIndex + 1) !== -1
      })
    }, 250)
  },

  nextQuestion: function () {
    if (this.data.transitioning) return
    this.goToIndex(this.data.currentIndex + 1)
  },

  prevQuestion: function () {
    if (this.data.transitioning || this.data.currentIndex <= 0) return
    this.goToIndex(this.data.currentIndex - 1)
  },

  submitQuiz: function (answers) {
    if (this.data.submitting) return
    this.setData({ submitting: true })

    wx.showLoading({ title: '灵魂解析中...' })

    wx.cloud.callFunction({
      name: 'scoreSoulQuiz',
      data: { answers: answers },
      success: function (res) {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.redirectTo({
            url: '/packageA/soul-quiz/result?data=' + encodeURIComponent(JSON.stringify(res.result.data))
          })
        } else {
          var errMsg = (res.result && res.result.error) || '分析失败'
          wx.showToast({ title: errMsg, icon: 'none', duration: 3000 })
        }
      },
      fail: function (err) {
        wx.hideLoading()
        console.error('云函数调用失败:', err)
        wx.showToast({ title: '网络异常，请重试', icon: 'none' })
      }
    })
  }
})
