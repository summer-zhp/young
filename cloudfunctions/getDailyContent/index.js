// 云函数入口函数 - 获取每日治愈内容
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 随机获取一条治愈内容
    // 先获取总数量
    const countResult = await db.collection('healing_content').count()
    const total = countResult.total

    if (total === 0) {
      return {
        success: false,
        data: null,
        message: '暂无内容'
      }
    }

    // 生成随机偏移量
    const randomOffset = Math.floor(Math.random() * total)

    // 随机获取一条
    const result = await db.collection('healing_content')
      .skip(randomOffset)
      .limit(1)
      .get()

    return {
      success: true,
      data: result.data[0] || null,
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取每日内容失败:', err)
    return {
      success: false,
      error: err.message,
      message: '获取失败'
    }
  }
}
