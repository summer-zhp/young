// cloudfunctions/updateTurntable/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { openid, id, name, options } = event

  try {
    // 验证是否拥有该转盘
    const checkRes = await db.collection('turntables')
      .where({ _id: id, openid })
      .get()

    if (checkRes.data.length === 0) {
      return {
        success: false,
        error: '转盘不存在或无权限'
      }
    }

    // 更新转盘
    await db.collection('turntables')
      .doc(id)
      .update({
        data: {
          name,
          options,
          updateTime: db.serverDate()
        }
      })

    return {
      success: true
    }
  } catch (err) {
    console.error('更新转盘失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
