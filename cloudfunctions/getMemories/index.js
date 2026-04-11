const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { page = 1, pageSize = 10 } = event

  try {
    const countResult = await db.collection('memories')
      .where({ _openid: OPENID })
      .count()

    const total = countResult.total
    const result = await db.collection('memories')
      .where({ _openid: OPENID })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: {
        list: result.data,
        total,
        hasMore: page * pageSize < total
      }
    }
  } catch (err) {
    console.error('获取纪念列表失败:', err)
    return { success: false, error: err.message }
  }
}
