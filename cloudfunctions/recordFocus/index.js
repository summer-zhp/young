// 云函数入口 - 记录专注时长
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 记录用户专注时长
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { duration, quote } = event

  console.log('recordFocus 被调用，OPENID:', OPENID, 'duration:', duration, 'quote:', quote)

  try {
    // 验证参数
    if (!duration || duration <= 0) {
      console.error('专注时长无效:', duration)
      return {
        success: false,
        message: '专注时长无效'
      }
    }

    // 创建专注记录
    const focusRecord = await db.collection('focus_records').add({
      data: {
        _openid: OPENID,
        duration: duration,
        quote_content: quote || '',
        completed: true,
        created_at: db.serverDate()
      }
    })
    console.log('专注记录创建成功，ID:', focusRecord._id)

    // 更新用户总专注时长
    const userResult = await db.collection('users')
      .where({ _openid: OPENID })
      .limit(1)
      .get()

    console.log('查询用户结果:', userResult.data.length)

    if (userResult.data.length > 0) {
      const user = userResult.data[0]
      const newTotalTime = (user.total_focus_time || 0) + duration
      const newFocusCount = (user.focus_count || 0) + 1

      await db.collection('users').doc(user._id).update({
        data: {
          total_focus_time: newTotalTime,
          focus_count: newFocusCount,
          last_login_at: db.serverDate()
        }
      })
      console.log('用户数据更新成功，总时长:', newTotalTime, '次数:', newFocusCount)
    } else {
      console.log('未找到用户记录')
    }

    return {
      success: true,
      message: '记录成功',
      data: {
        recordId: focusRecord._id
      }
    }
  } catch (err) {
    console.error('记录专注失败:', err)
    return {
      success: false,
      error: err.message,
      message: '记录专注失败：' + err.message
    }
  }
}
