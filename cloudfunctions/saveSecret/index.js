// cloudfunctions/saveSecret/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { title, content, ciphertext, iv } = event

  if (!title || !content || !ciphertext || !iv) {
    return { success: false, error: '参数不完整' }
  }

  try {
    const res = await db.collection('secrets').add({
      data: {
        _openid: OPENID,
        title,
        content,
        ciphertext,
        iv,
        createTime: db.serverDate()
      }
    })

    return { success: true, id: res._id }
  } catch (err) {
    console.error('保存密件失败:', err)
    return { success: false, error: err.message }
  }
}
