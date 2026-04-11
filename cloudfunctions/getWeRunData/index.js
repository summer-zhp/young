// 云函数入口 - 获取微信运动步数数据
// 通过 encryptedData + iv + code 方式解密
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 解密微信运动数据
 * @param {string} encryptedData Base64 编码的加密数据
 * @param {string} sessionKey Base64 编码的会话密钥
 * @param {string} iv Base64 编码的初始向量
 * @returns {object} 解密后的数据
 */
function decryptData(encryptedData, sessionKey, iv) {
  const sessionKeyBuf = Buffer.from(sessionKey, 'base64')
  const ivBuf = Buffer.from(iv, 'base64')
  const encryptedBuf = Buffer.from(encryptedData, 'base64')

  const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuf, ivBuf)
  decipher.setAutoPadding(true)

  let decrypted = decipher.update(encryptedBuf, null, 'utf8')
  decrypted += decipher.final('utf8')

  return JSON.parse(decrypted)
}

exports.main = async (event, context) => {
  try {
    const { encryptedData, iv, code } = event

    if (!encryptedData || !iv || !code) {
      return { success: false, message: '缺少必要参数' }
    }

    // 通过 code 获取 session_key
    const sessionRes = await cloud.openapi.code2Session({
      jsCode: code
    })

    if (!sessionRes || !sessionRes.sessionKey) {
      return { success: false, message: '获取会话密钥失败' }
    }

    // 解密运动数据
    const stepData = decryptData(encryptedData, sessionRes.sessionKey, iv)

    if (!stepData || !stepData.stepInfoList) {
      return { success: false, message: '运动数据格式异常' }
    }

    return {
      success: true,
      stepInfoList: stepData.stepInfoList
    }
  } catch (err) {
    console.error('获取微信运动数据失败:', err)
    return { success: false, message: err.message || '云函数执行异常' }
  }
}
