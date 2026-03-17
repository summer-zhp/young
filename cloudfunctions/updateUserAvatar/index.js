// 云函数入口 - 更新用户头像
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 更新用户头像
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { avatarUrl } = event

  try {
    // 查找用户
    const userResult = await db.collection('users')
      .where({ _openid: OPENID })
      .limit(1)
      .get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    const user = userResult.data[0]

    // 更新用户头像
    await db.collection('users').doc(user._id).update({
      data: {
        avatarUrl,
        updated_at: db.serverDate()
      }
    })

    return {
      success: true,
      message: '头像更新成功'
    }
  } catch (err) {
    console.error('更新头像失败:', err)
    return {
      success: false,
      error: err.message,
      message: '更新失败'
    }
  }
}
