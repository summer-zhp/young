// 云函数入口函数 - 取消收藏
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { content_id } = event

    if (!content_id) {
      return {
        success: false,
        message: '内容 ID 不能为空'
      }
    }

    // 删除收藏
    await db.collection('user_favorites')
      .where({
        _openid: openid,
        content_id: content_id
      })
      .remove()

    return {
      success: true,
      message: '取消收藏成功'
    }
  } catch (err) {
    console.error('取消收藏失败:', err)
    return {
      success: false,
      error: err.message,
      message: '取消收藏失败'
    }
  }
}
