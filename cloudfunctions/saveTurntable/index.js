// cloudfunctions/saveTurntable/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { openid, name, options } = event

  try {
    const res = await db.collection('turntables').add({
      data: {
        openid,
        name,
        options,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      _id: res._id
    }
  } catch (err) {
    console.error('保存转盘失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
