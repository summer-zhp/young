// 云函数入口 - 更新用户职位
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 更新用户职位信息
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { job } = event

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

    // 如果 job 为空字符串，则清空职位；否则更新职位
    const updateData = {}
    if (job && job.trim() !== '') {
      updateData.job = job.trim()
    } else {
      updateData.job = ''
    }
    updateData.updated_at = db.serverDate()

    // 更新用户职位
    await db.collection('users').doc(user._id).update({
      data: updateData
    })

    return {
      success: true,
      message: job && job.trim() !== '' ? '更新成功' : '清空成功'
    }
  } catch (err) {
    console.error('更新职位失败:', err)
    return {
      success: false,
      error: err.message,
      message: '更新失败'
    }
  }
}
