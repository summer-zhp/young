// cloudfunctions/encryptSecret/index.js
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { content, key } = event

  if (!content || !key) {
    return { success: false, error: '内容和密钥不能为空' }
  }

  try {
    // 用 key 派生 32 字节密钥（AES-256）
    const derivedKey = crypto.createHash('sha256').update(key).digest()
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv)
    let encrypted = cipher.update(content, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    return {
      success: true,
      ciphertext: encrypted,
      iv: iv.toString('base64')
    }
  } catch (err) {
    console.error('加密失败:', err)
    return { success: false, error: err.message }
  }
}
