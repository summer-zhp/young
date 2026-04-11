// 云函数入口 - 获取微信运动步数数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    // 打印接收到的数据用于调试
    const cloudIDValue = event.cloudID
    console.log('cloudID type:', typeof cloudIDValue)
    console.log('cloudID value:', JSON.stringify(cloudIDValue).substring(0, 200))

    // 情况1：SDK 自动解密成功，cloudID 已被替换为 { stepInfoList: [...] }
    if (cloudIDValue && typeof cloudIDValue === 'object' && cloudIDValue.stepInfoList) {
      return { success: true, stepInfoList: cloudIDValue.stepInfoList }
    }

    // 情况2：cloudID 还是字符串（自动解密未生效）
    // 尝试通过云调用解密
    if (cloudIDValue && typeof cloudIDValue === 'string') {
      try {
        const result = await cloud.openapi.werun.getOpenData({
          list: [cloudIDValue]
        })
        if (result && result.list && result.list[0]) {
          const openData = result.list[0]
          if (typeof openData === 'object' && openData.stepInfoList) {
            return { success: true, stepInfoList: openData.stepInfoList }
          }
          if (openData.data) {
            const parsed = JSON.parse(openData.data)
            if (parsed.stepInfoList) {
              return { success: true, stepInfoList: parsed.stepInfoList }
            }
          }
        }
      } catch (e) {
        console.log('getOpenData failed:', e.message)
      }
    }

    return {
      success: false,
      message: '无法解密运动数据，请检查云函数 SDK 版本',
      debug: {
        cloudIDType: typeof cloudIDValue,
        eventKeys: Object.keys(event)
      }
    }
  } catch (err) {
    console.error('云函数异常:', err)
    return { success: false, message: err.message || '云函数执行异常' }
  }
}
