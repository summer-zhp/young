// 云函数入口 - 更新用户昵称
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { wxNickname } = event

  try {
    const userResult = await db.collection('users')
      .where({ _openid: OPENID })
      .limit(1)
      .get()

    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userResult.data[0]
    const updateData = {
      wxNickname: (wxNickname || '').trim(),
      updated_at: db.serverDate()
    }

    await db.collection('users').doc(user._id).update({ data: updateData })

    return { success: true, wxNickname: updateData.wxNickname }
  } catch (err) {
    console.error('更新昵称失败:', err)
    return { success: false, error: err.message }
  }
}
