// 云函数入口 - 用户登录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID, APPID, UNIONID } = wxContext

  try {
    // 检查用户是否存在
    const userResult = await db.collection('users')
      .where({ openid: OPENID })
      .limit(1)
      .get()

    if (userResult.data.length > 0) {
      // 用户已存在，更新最后登录时间
      const user = userResult.data[0]
      await db.collection('users').doc(user._id).update({
        data: {
          lastLoginTime: db.serverDate(),
          nickname: event.nickname || user.nickname,
          avatar: event.avatar || user.avatar
        }
      })

      return {
        success: true,
        message: '登录成功',
        user: {
          _id: user._id,
          openid: OPENID,
          nickname: user.nickname,
          avatar: user.avatar,
          createTime: user.createTime,
          lastLoginTime: new Date().toISOString()
        }
      }
    } else {
      // 用户不存在，创建新用户
      const newUser = {
        openid: OPENID,
        appid: APPID,
        unionid: UNIONID || '',
        nickname: event.nickname || '新朋友',
        avatar: event.avatar || '',
        createTime: db.serverDate(),
        lastLoginTime: db.serverDate(),
        totalPracticeTime: 0,
        favoriteCount: 0
      }

      const result = await db.collection('users').add({
        data: newUser
      })

      return {
        success: true,
        message: '注册成功',
        user: {
          _id: result._id,
          openid: OPENID,
          nickname: newUser.nickname,
          avatar: newUser.avatar,
          createTime: new Date().toISOString(),
          lastLoginTime: new Date().toISOString()
        }
      }
    }
  } catch (err) {
    console.error('登录失败:', err)
    return {
      success: false,
      error: err.message,
      message: '登录失败'
    }
  }
}
