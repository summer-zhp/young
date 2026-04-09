// pages/work-schedule/index.js
Page({
  data: {
    hasUserInfo: false,
    workSchedule: null,
    editStartTime: '09:00',
    editEndTime: '18:00',
    editRestType: 'double',
    editRestDays: [0, 6],
    weekDays: [
      { value: 1, label: '周一', active: false },
      { value: 2, label: '周二', active: false },
      { value: 3, label: '周三', active: false },
      { value: 4, label: '周四', active: false },
      { value: 5, label: '周五', active: false },
      { value: 6, label: '周六', active: false },
      { value: 0, label: '周日', active: false }
    ],
    countdownState: 'not_configured',
    countdownText: ''
  },

  onLoad: function () {
    var userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      this.setData({ hasUserInfo: false })
      return
    }

    this.setData({ hasUserInfo: true })
    this.syncWeekDaysActive()

    var ws = wx.getStorageSync('workSchedule')
    if (ws) {
      var that = this
      var weekDays = this.data.weekDays.map(function (d) {
        return { value: d.value, label: d.label, active: ws.restDays.indexOf(d.value) > -1 }
      })
      this.setData({
        workSchedule: ws,
        editStartTime: ws.startTime,
        editEndTime: ws.endTime,
        editRestType: ws.restType,
        editRestDays: ws.restDays.slice(),
        weekDays: weekDays
      })
      that.startCountdown()
    }
  },

  onShow: function () {
    if (this.data.workSchedule) {
      this.startCountdown()
    }
  },

  onHide: function () {
    if (this._timer) { clearInterval(this._timer); this._timer = null }
  },

  onUnload: function () {
    if (this._timer) { clearInterval(this._timer); this._timer = null }
  },

  // ===== 倒计时 =====

  startCountdown: function () {
    if (this._timer) clearInterval(this._timer)
    this.updateCountdown()
    var that = this
    this._timer = setInterval(function () { that.updateCountdown() }, 1000)
  },

  updateCountdown: function () {
    var ws = this.data.workSchedule
    if (!ws) {
      this.setData({ countdownState: 'not_configured', countdownText: '' })
      return
    }

    var now = new Date()
    var day = now.getDay()

    if (ws.restDays && ws.restDays.indexOf(day) > -1) {
      this.setData({ countdownState: 'rest_day', countdownText: '今天是休息日，好好放松~' })
      return
    }

    var nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
    var sp = ws.startTime.split(':')
    var startMin = parseInt(sp[0]) * 60 + parseInt(sp[1])
    var ep = ws.endTime.split(':')
    var endMin = parseInt(ep[0]) * 60 + parseInt(ep[1])

    if (startMin >= endMin) {
      // 夜班 - 跨午夜（如 19:00-07:00）
      if (nowMin >= startMin || nowMin < endMin) {
        var elapsed = nowMin >= startMin ? nowMin - startMin : (1440 - startMin) + nowMin
        var totalWork = (1440 - startMin) + endMin
        var diff = totalWork - elapsed
        var h = Math.floor(diff / 60)
        var m = Math.floor(diff % 60)
        var s = Math.floor((diff - Math.floor(diff)) * 60)
        var text = h > 0 ? '距离下班还有 ' + h + '小时' + m + '分' + s + '秒' : '距离下班还有 ' + m + '分' + s + '秒'
        this.setData({ countdownState: 'working', countdownText: text })
      } else {
        var diff = startMin - nowMin
        var h = Math.floor(diff / 60)
        var m = Math.ceil(diff % 60)
        this.setData({ countdownState: 'before_work', countdownText: '距离上班还有 ' + h + '小时' + m + '分钟' })
      }
    } else {
      // 白班 - 同一天
      if (nowMin < startMin) {
        var diff = startMin - nowMin
        var h = Math.floor(diff / 60)
        var m = Math.ceil(diff % 60)
        this.setData({ countdownState: 'before_work', countdownText: '距离上班还有 ' + h + '小时' + m + '分钟' })
      } else if (nowMin < endMin) {
        var diff = endMin - nowMin
        var h = Math.floor(diff / 60)
        var m = Math.floor(diff % 60)
        var s = Math.floor((diff - Math.floor(diff)) * 60)
        var text = h > 0 ? '距离下班还有 ' + h + '小时' + m + '分' + s + '秒' : '距离下班还有 ' + m + '分' + s + '秒'
        this.setData({ countdownState: 'working', countdownText: text })
      } else {
        var diff = nowMin - endMin
        var h = Math.floor(diff / 60)
        var m = Math.floor(diff % 60)
        var text = h > 0 ? '已下班 ' + h + '小时' + m + '分钟，辛苦了~' : '已下班 ' + m + '分钟，辛苦了~'
        this.setData({ countdownState: 'after_work', countdownText: text })
      }
    }
  },

  // ===== 登录引导 =====

  goToLogin: function () {
    wx.switchTab({ url: '/pages/profile/profile' })
  },

  // ===== 编辑操作 =====

  onStartTimeChange: function (e) {
    this.setData({ editStartTime: e.detail.value })
  },

  onEndTimeChange: function (e) {
    this.setData({ editEndTime: e.detail.value })
  },

  onRestTypeChange: function (e) {
    var type = e.currentTarget.dataset.type
    var restDays = this.data.editRestDays.slice()

    if (type === 'double') {
      if (restDays.indexOf(6) === -1) restDays.push(6)
      if (restDays.indexOf(0) === -1) restDays.push(0)
    }

    this.setData({ editRestType: type, editRestDays: restDays })
    this.syncWeekDaysActive()
  },

  onRestDayToggle: function (e) {
    var day = Number(e.currentTarget.dataset.day)
    var restDays = this.data.editRestDays.slice()
    var idx = restDays.indexOf(day)

    if (idx > -1) {
      restDays.splice(idx, 1)
    } else {
      restDays.push(day)
    }

    this.setData({ editRestDays: restDays })
    this.syncWeekDaysActive()
  },

  syncWeekDaysActive: function () {
    var restDays = this.data.editRestDays
    var weekDays = this.data.weekDays.map(function (d) {
      return { value: d.value, label: d.label, active: restDays.indexOf(d.value) > -1 }
    })
    this.setData({ weekDays: weekDays })
  },

  saveWorkSchedule: function () {
    var that = this
    var schedule = {
      startTime: this.data.editStartTime,
      endTime: this.data.editEndTime,
      restType: this.data.editRestType,
      restDays: this.data.editRestDays.slice()
    }

    wx.showLoading({ title: '保存中...' })

    try {
      wx.setStorageSync('workSchedule', schedule)
      that.setData({ workSchedule: schedule })
      that.startCountdown()

      wx.cloud.callFunction({
        name: 'updateWorkSchedule',
        data: { workSchedule: schedule },
        success: function () {
          wx.hideLoading()
          wx.showToast({ title: '保存成功', icon: 'success' })
        },
        fail: function (cloudErr) {
          wx.hideLoading()
          console.error('云端同步失败:', cloudErr)
          wx.showToast({ title: '保存成功', icon: 'success' })
        }
      })
    } catch (err) {
      wx.hideLoading()
      console.error('保存工作日程失败:', err)
      wx.showToast({ title: '保存失败', icon: 'error' })
    }
  },

  clearWorkSchedule: function () {
    var that = this
    wx.showModal({
      title: '确认清除',
      content: '确定要清除上下班时间设置吗？',
      success: function (res) {
        if (res.confirm) {
          wx.removeStorageSync('workSchedule')

          var weekDays = that.data.weekDays.map(function (d) {
            return { value: d.value, label: d.label, active: [0, 6].indexOf(d.value) > -1 }
          })

          that.setData({
            workSchedule: null,
            countdownState: 'not_configured',
            countdownText: '',
            editStartTime: '09:00',
            editEndTime: '18:00',
            editRestType: 'double',
            editRestDays: [0, 6],
            weekDays: weekDays
          })

          if (that._timer) { clearInterval(that._timer); that._timer = null }

          wx.cloud.callFunction({
            name: 'updateWorkSchedule',
            data: { workSchedule: null },
            complete: function () {
              wx.showToast({ title: '已清除', icon: 'success' })
            }
          })
        }
      }
    })
  }
})
