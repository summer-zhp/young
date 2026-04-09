// 云函数入口 - 更新用户工作日程
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 更新用户工作日程（上下班时间、休息日）
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { workSchedule } = event

  try {
    const userResult = await db.collection('users')
      .where({ _openid: OPENID })
      .limit(1)
      .get()

    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userResult.data[0]
    const updateData = { updated_at: db.serverDate() }

    if (workSchedule) {
      updateData.workSchedule = workSchedule
    } else {
      updateData.workSchedule = db.command.remove()
    }

    await db.collection('users').doc(user._id).update({
      data: updateData
    })

    return {
      success: true,
      message: workSchedule ? '保存成功' : '已清除'
    }
  } catch (err) {
    console.error('更新工作日程失败:', err)
    return { success: false, error: err.message, message: '保存失败' }
  }
}
