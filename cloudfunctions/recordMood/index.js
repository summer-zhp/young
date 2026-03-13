// 云函数入口函数 - 记录心情
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { mood, note } = event

    if (!mood || mood < 1 || mood > 5) {
      return {
        success: false,
        message: '心情值必须在 1-5 之间'
      }
    }

    // 添加心情记录
    await db.collection('mood_records').add({
      data: {
        _openid: openid,
        mood,
        note: note || '',
        created_at: db.serverDate()
      }
    })

    return {
      success: true,
      message: '记录成功'
    }
  } catch (err) {
    console.error('记录心情失败:', err)
    return {
      success: false,
      error: err.message,
      message: '记录失败'
    }
  }
}
