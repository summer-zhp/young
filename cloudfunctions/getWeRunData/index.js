// 云函数入口 - 获取微信运动步数数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    // 云开发会自动将 cloudID 参数解码为原始数据
    // event.cloudID 传入时是 cloudID 字符串，SDK 自动替换为解密后的对象
    const stepData = event.cloudID

    if (!stepData) {
      return {
        success: false,
        message: '缺少 cloudID 参数'
      }
    }

    // 如果 SDK 已自动解密，stepData 直接就是 { stepInfoList: [...] }
    if (stepData.stepInfoList) {
      return {
        success: true,
        stepInfoList: stepData.stepInfoList
      }
    }

    return {
      success: false,
      message: '数据解析失败'
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
