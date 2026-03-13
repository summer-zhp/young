// 云函数入口函数 - 添加收藏
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { content_id, content_snapshot } = event

    if (!content_id) {
      return {
        success: false,
        message: '内容 ID 不能为空'
      }
    }

    // 检查是否已收藏
    const existing = await db.collection('user_favorites')
      .where({
        _openid: openid,
        content_id: content_id
      })
      .get()

    if (existing.data.length > 0) {
      return {
        success: false,
        message: '已收藏'
      }
    }

    // 添加收藏（保存内容快照）
    await db.collection('user_favorites').add({
      data: {
        _openid: openid,
        content_id,
        content_snapshot: content_snapshot || {},
        created_at: db.serverDate()
      }
    })

    return {
      success: true,
      message: '收藏成功'
    }
  } catch (err) {
    console.error('添加收藏失败:', err)
    return {
      success: false,
      error: err.message,
      message: '收藏失败'
    }
  }
}
