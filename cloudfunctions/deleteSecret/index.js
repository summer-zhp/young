// cloudfunctions/deleteSecret/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { id } = event

  if (!id) {
    return { success: false, error: '缺少密件ID' }
  }

  try {
    // 验证是本人的密件
    const res = await db.collection('secrets')
      .where({ _id: id, _openid: OPENID })
      .count()

    if (res.total === 0) {
      return { success: false, error: '密件不存在或无权删除' }
    }

    await db.collection('secrets').doc(id).remove()

    return { success: true }
  } catch (err) {
    console.error('删除密件失败:', err)
    return { success: false, error: err.message }
  }
}
