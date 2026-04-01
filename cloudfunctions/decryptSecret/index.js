// cloudfunctions/decryptSecret/index.js
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { ciphertext, key, iv } = event

  if (!ciphertext || !key || !iv) {
    return { success: false, error: '密文、密钥和IV不能为空' }
  }

  try {
    const derivedKey = crypto.createHash('sha256').update(key).digest()
    const ivBuffer = Buffer.from(iv, 'base64')

    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, ivBuffer)
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return {
      success: true,
      content: decrypted
    }
  } catch (err) {
    console.error('解密失败:', err)
    return { success: false, error: '解密失败，请检查密钥是否正确' }
  }
}
