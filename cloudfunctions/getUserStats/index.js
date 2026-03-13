// 云函数入口 - 获取用户统计数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 获取用户专注统计数据
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 获取用户专注记录
    const focusRecordsResult = await db.collection('focus_records')
      .where({
        _openid: OPENID,
        completed: true
      })
      .get()

    // 计算总专注时长和次数
    const totalFocusTime = focusRecordsResult.data.reduce((sum, record) => {
      return sum + (record.duration || 0)
    }, 0)

    const focusCount = focusRecordsResult.data.length

    // 获取用户收藏数量
    const favoritesResult = await db.collection('user_favorites')
      .where({ _openid: OPENID })
      .count()

    return {
      success: true,
      totalFocusTime,
      focusCount,
      favoritesCount: favoritesResult.total
    }
  } catch (err) {
    console.error('获取统计数据失败:', err)
    return {
      success: false,
      error: err.message,
      message: '获取统计数据失败'
    }
  }
}
