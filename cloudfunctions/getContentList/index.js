// 云函数入口函数 - 获取内容列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const { page = 1, pageSize = 10, category, type } = event

    // 构建查询条件
    const query = {}
    if (category) {
      query.category = category
    }
    if (type) {
      query.type = type
    }

    // 获取内容列表
    const result = await db.collection('healing_content')
      .where(query)
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取总数
    const countResult = await db.collection('healing_content')
      .where(query)
      .count()

    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page,
        pageSize
      },
      message: '获取成功'
    }
  } catch (err) {
    console.error('获取内容列表失败:', err)
    return {
      success: false,
      error: err.message,
      message: '获取失败'
    }
  }
}
