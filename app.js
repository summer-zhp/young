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
        env: 'cloud1-2gpreb4e2dc05acb', // 云开发环境 ID
        traceUser: true, // 是否在将用户访问记录到用户管理中
      })
    }

    this.globalData = {}
  },
  globalData: {
    userInfo: null
  }
})
