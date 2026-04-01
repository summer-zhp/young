// app.js
App({
  async onLaunch() {
    await this.updateManager()

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（调用云函数、云数据库 API 等）所使用的默认环境
        //   即调用 wx.cloud.createContainer, wx.cloud.callFunction, wx.cloud.callContainer 等 API，
        //   若不指定 env 参数，默认使用 env 指定的默认环境
        //   以下 API 不受 env 参数影响：
        //     - wx.cloud.CloudID(cloudID),
        //     - wx.cloud.downloadFile,
        //     - wx.cloud.getTempFileURL,
        //     - wx.cloud.uploadFile
        // eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJhdWQiOiJjbG91ZDEtMmdwcmViNGUyZGMwNWFjYiIsImV4cCI6MjUzNDAyMzAwNzk5LCJpYXQiOjE3NzMzOTk3NzcsImF0X2hhc2giOiJWWGZObWE3YlFwbUVkQWM2UXg1M0tnIiwicHJvamVjdF9pZCI6ImNsb3VkMS0yZ3ByZWI0ZTJkYzA1YWNiIiwibWV0YSI6eyJwbGF0Zm9ybSI6IkFwaUtleSJ9LCJhZG1pbmlzdHJhdG9yX2lkIjoiMjAwMDgyMzk5MjcyMTcyNzQ4OSIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3NlcnZlciIsImlzX3N5c3RlbV9hZG1pbiI6dHJ1ZX0.HHUfrhgEE4AAOf1Ub8evwvJhHe0iq6Mb5_NfsrqziLq-oSyxDKTpBBQVcFR8vzQRX-dyqHjXGEaLin8ys1M35hdV6QaI7DaqO_axzzfnZdZ5MQgun6Ofrs_WWJymvyonWXQAMqDPX_qHHN9SNZUWqs1hwT36gLqbmNOYEg1XYZ0x0n00KF_kHhpbTFk9lh174NbpC-cwyq0iKfa5eU88WZaJdjXtrxl2DSmJaT1Ql9wQFBjk6TI-WxfXFC-Q-JSkX8kubdn3ZEiF_7GuOoS_dGNrdYOEVVwp8Pki3dn93lrCm8nVvzmF1fp0JGP4WdpH6n0m_QwVMniSUeAhv-9CrQ
        env: 'cloud1-2gpreb4e2dc05acb', // 云开发环境 ID
        traceUser: true, // 是否在将用户访问记录到用户管理中
      })
    }

    // 判断应用版本（控制功能显示和隐藏）
    await this.checkAppVersion()

    // 获取用户登录状态
    this.checkLoginStatus()
  },
  globalData: {
    userInfo: null,
    isReleaseVersion: false
  },
  // 检查是否更新
  updateManager() {
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate((res) => {
      console.log(res.hasUpdate, "是否有更新")
    })

    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })

    updateManager.onUpdateFailed(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本下载失败',
        showCancel: false
      })
    })
  },
  // 判断是否为正式版
  checkAppVersion() {
    try {
      const accountInfo = wx.getAccountInfoSync()
      console.log(accountInfo);
      // miniProgram 字段在开发版/体验版中为 undefined 或空对象
      // 在正式版中会包含完整的小程序信息
      // 获取小程序的当前环境版本：develop（开发版）、trial（体验版）、release（正式版）
      const { envVersion } = accountInfo.miniProgram
      this.globalData.isReleaseVersion = envVersion === 'trial'
    } catch (error) {
      console.error('获取版本信息失败:', error)
      // 失败时默认为非正式版
      this.globalData.isReleaseVersion = false
    }
  },

  // 检查用户登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.openid) {
      // 已登录，从本地缓存获取用户信息
      this.globalData.userInfo = userInfo
    }
  },

  // 检查是否已登录，返回布尔值
  isLogged() {
    return !!(this.globalData.userInfo && this.globalData.userInfo.openid)
  },

  // 需要登录时提示并跳转
  requireLogin() {
    if (this.isLogged()) {
      return true
    }

    // 检查本地缓存是否有 userInfo
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.openid) {
      // 本地有但 globalData 没有，同步一下
      this.globalData.userInfo = userInfo
      return true
    }

    wx.showModal({
      title: '提示',
      content: '请先登录',
      confirmText: '去登录',
      confirmColor: '#8EC5B9',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/profile/profile'
          })
        }
      }
    })

    return false
  }
})
