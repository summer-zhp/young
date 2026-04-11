// 云函数入口 - 获取微信运动步数数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    if (!event.cloudID) {
      return {
        success: false,
        message: '缺少 cloudID 参数'
      }
    }

    // 通过 cloudID 获取开放数据（云开发自动解密）
    const result = await cloud.openapi.werun.getOpenData({
      list: [event.cloudID]
    })

    if (!result || !result.list || !result.list.length) {
      return {
        success: false,
        message: '获取运动数据失败'
      }
    }

    const openData = result.list[0]
    if (openData.errcode || !openData.data) {
      return {
        success: false,
        message: openData.errmsg || '数据解密失败'
      }
    }

    // 解析步数数据
    const stepData = JSON.parse(openData.data)
    const stepInfoList = stepData.stepInfoList || []

    return {
      success: true,
      stepInfoList
    }
  } catch (err) {
    console.error('获取微信运动数据失败:', err)
    return {
      success: false,
      message: '获取运动数据失败',
      error: err.message
    }
  }
}
