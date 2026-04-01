// cloudfunctions/getSecrets/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const res = await db.collection('secrets')
      .where({ _openid: OPENID })
      .orderBy('createTime', 'desc')
      .get()

    const data = res.data.map(item => ({
      id: item._id,
      title: item.title,
      ciphertext: item.ciphertext,
      iv: item.iv,
      createTime: item.createTime
    }))

    return { success: true, data }
  } catch (err) {
    console.error('获取密件列表失败:', err)
    return { success: false, error: err.message }
  }
}
