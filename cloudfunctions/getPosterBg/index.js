// 云函数入口 - 获取海报背景图临时链接
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  var fileID = 'cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1308074643/static/img/sport_back.png'
  try {
    var result = await cloud.getTempFileURL({
      fileList: [fileID]
    })
    var file = result.fileList[0]
    if (file && file.tempFileURL) {
      return { success: true, url: file.tempFileURL }
    }
    return { success: false, error: '未获取到临时链接' }
  } catch (err) {
    console.error('getPosterBg error:', err)
    return { success: false, error: err.message }
  }
}
