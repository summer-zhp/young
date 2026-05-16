// packageA/soul-quiz/history.js - 历史记录页

Page({
  data: {
    records: [],
    page: 1,
    hasMore: false,
    loading: false
  },

  onShow: function () {
    this.setData({ records: [], page: 1, hasMore: false })
    this.loadRecords()
  },

  loadRecords: function () {
    if (this.data.loading) return
    this.setData({ loading: true })

    var that = this
    wx.cloud.callFunction({
      name: 'getSoulQuizHistory',
      data: { page: that.data.page, pageSize: 20 },
      success: function (res) {
        if (res.result && res.result.success) {
          var list = res.result.data || []
          for (var i = 0; i < list.length; i++) {
            var d = list[i].created_at
            if (d) {
              var date = new Date(d)
              list[i].dateStr = date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0') + ' ' +
                String(date.getHours()).padStart(2, '0') + ':' +
                String(date.getMinutes()).padStart(2, '0')
            }
          }
          that.setData({
            records: that.data.records.concat(list),
            hasMore: res.result.hasMore,
            loading: false
          })
        } else {
          that.setData({ loading: false })
        }
      },
      fail: function () {
        that.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  loadMore: function () {
    this.setData({ page: this.data.page + 1 })
    this.loadRecords()
  },

  viewDetail: function (e) {
    var index = e.currentTarget.dataset.index
    var record = this.data.records[index]
    if (!record) return
    var data = {
      mbti_type: record.mbti_type,
      scores: record.scores,
      animal: record.animal,
      emoji: record.emoji,
      image: record.image,
      workplace: record.workplace,
      workplace_desc: record.workplace_desc,
      fantasy: record.fantasy,
      fantasy_desc: record.fantasy_desc,
      analysis: record.analysis,
      keywords: record.keywords,
      color: record.color
    }
    wx.navigateTo({
      url: '/packageA/soul-quiz/result?data=' + encodeURIComponent(JSON.stringify(data))
    })
  },

  goQuiz: function () {
    wx.navigateTo({ url: '/packageA/soul-quiz/quiz' })
  }
})
