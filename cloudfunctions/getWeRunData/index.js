// 云函数入口 - 获取微信运动步数数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const cloudData = event.cloudID

    if (!cloudData) {
      return { success: false, message: '缺少 cloudID 参数' }
    }

    // 情况1：SDK 自动解密成功，cloudData 已经是 { stepInfoList: [...] } 对象
    if (typeof cloudData === 'object' && cloudData.stepInfoList) {
      return { success: true, stepInfoList: cloudData.stepInfoList }
    }

    // 情况2：SDK 未自动解密，cloudData 还是字符串，手动调用 getOpenData
    if (typeof cloudData === 'string') {
      const result = await cloud.openapi.werun.getOpenData({
        list: [cloudData]
      })

      if (!result || !result.list || !result.list.length) {
        return { success: false, message: 'getOpenData 返回为空' }
      }

      const openData = result.list[0]

      // getOpenData 可能返回已解析的数据对象
      if (typeof openData === 'object' && openData.stepInfoList) {
        return { success: true, stepInfoList: openData.stepInfoList }
      }

      // 也可能返回 { data: JSON字符串 } 格式
      if (openData.data) {
        const parsed = JSON.parse(openData.data)
        if (parsed.stepInfoList) {
          return { success: true, stepInfoList: parsed.stepInfoList }
        }
      }

      return { success: false, message: '无法解析运动数据', debugType: typeof openData }
    }

    return { success: false, message: 'cloudID 格式异常', debugType: typeof cloudData }
  } catch (err) {
    console.error('获取微信运动数据失败:', err)
    return { success: false, message: err.message || '云函数执行异常' }
  }
}
