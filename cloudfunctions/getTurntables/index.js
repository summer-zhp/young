// cloudfunctions/getTurntables/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { openid } = event

  try {
    const res = await db.collection('turntables')
      .where({ openid })
      .orderBy('updateTime', 'desc')
      .get()

    // 添加 id 字段（兼容前端使用）
    const data = res.data.map(item => ({
      ...item,
      id: item._id
    }))

    return {
      success: true,
      data: data
    }
  } catch (err) {
    console.error('获取转盘列表失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
