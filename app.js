// app.js
App({
  onLaunch: function () {
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

    // 加载应用配置（控制功能显示和隐藏）
    this.loadAppConfig()

    this.globalData = {}
  },
  globalData: {
    userInfo: null,
    appConfig: null
  },
  // 加载应用配置
  async loadAppConfig() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'getAppConfig'
      })
      if (result && result.result && result.result.success) {
        this.globalData.appConfig = result.result.config
        console.log('应用配置加载成功:', result.result.config)
      }
    } catch (error) {
      console.error('加载应用配置失败:', error)
      // 失败时使用默认配置（全部开启）
      this.globalData.appConfig = {
        treeHoleEnabled: true,
        captionImageEnabled: true
      }
    }
  }
})
