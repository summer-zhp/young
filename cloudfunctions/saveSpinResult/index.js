// cloudfunctions/saveSpinResult/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { openid, turntableId, turntableName, result } = event

  try {
    await db.collection('spinResults').add({
      data: {
        openid,
        turntableId,
        turntableName,
        result,
        createTime: db.serverDate()
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('保存旋转结果失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
