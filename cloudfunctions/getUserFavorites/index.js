// 云函数入口函数 - 获取用户收藏列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { page = 1, pageSize = 10 } = event

    // 获取用户收藏总数
    const countResult = await db.collection('user_favorites')
      .where({ _openid: openid })
      .count()

    // 获取用户收藏列表
    const result = await db.collection('user_favorites')
      .where({
        _openid: openid
      })
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 返回收藏列表（包含快照内容和 content_id）
    const favorites = result.data.map(item => ({
      _id: item._id,
      content_id: item.content_id,
      content_snapshot: item.content_snapshot,
      created_at: item.created_at
    }))

    return {
      success: true,
      data: {
        favorites: favorites,
        total: countResult.total
      },
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取用户收藏失败:', err)
    return {
      success: false,
      error: err.message,
      message: '获取失败'
    }
  }
}
