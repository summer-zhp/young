// 云函数入口 - 获取微信运动步数数据
// 通过 encryptedData + iv + code 手动解密
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const https = require('https')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 调用微信 jscode2session 接口获取 session_key
 */
function getSessionKey(appid, secret, code) {
  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve(result)
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

/**
 * AES-128-CBC 解密微信运动数据
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
      return { success: false, message: '缺少必要参数 (encryptedData/iv/code)' }
    }

    // 获取 APPID 和 SECRET
    const { APPID } = cloud.getWXContext()
    const SECRET = process.env.APP_SECRET

    if (!SECRET) {
      return {
        success: false,
        message: '请先在云函数配置中设置 APP_SECRET 环境变量'
      }
    }

    // 1. 用 code 换取 session_key
    const sessionRes = await getSessionKey(APPID, SECRET, code)

    if (!sessionRes.session_key) {
      return {
        success: false,
        message: '获取 session_key 失败: ' + (sessionRes.errmsg || JSON.stringify(sessionRes))
      }
    }

    // 2. 解密运动数据
    const stepData = decryptData(encryptedData, sessionRes.session_key, iv)

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
