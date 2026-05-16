// 云函数 - 获取灵魂画像历史记录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { page = 1, pageSize = 20 } = event

  try {
    const skip = (page - 1) * pageSize

    const result = await db.collection('soul_quiz_records')
      .where({ _openid: OPENID })
      .orderBy('created_at', 'desc')
      .skip(skip)
      .limit(pageSize)
      .field({
        _id: true,
        mbti_type: true,
        scores: true,
        animal: true,
        emoji: true,
        image: true,
        workplace: true,
        workplace_desc: true,
        fantasy: true,
        fantasy_desc: true,
        analysis: true,
        keywords: true,
        color: true,
        created_at: true
      })
      .get()

    // 获取总数
    const countResult = await db.collection('soul_quiz_records')
      .where({ _openid: OPENID })
      .count()

    // 批量获取动物图片签名URL
    const cloudPaths = []
    for (var i = 0; i < result.data.length; i++) {
      if (result.data[i].image) {
        cloudPaths.push(result.data[i].image)
      }
    }

    var urlMap = {}
    if (cloudPaths.length > 0) {
      try {
        var urlResult = await cloud.getTempFileURL({ fileList: cloudPaths })
        if (urlResult.fileList) {
          for (var j = 0; j < urlResult.fileList.length; j++) {
            if (urlResult.fileList[j].tempFileURL) {
              urlMap[urlResult.fileList[j].fileID] = urlResult.fileList[j].tempFileURL
            }
          }
        }
      } catch (e) {
        console.error('获取图片URL失败:', e)
      }
    }

    // 替换image为签名URL
    for (var k = 0; k < result.data.length; k++) {
      if (result.data[k].image && urlMap[result.data[k].image]) {
        result.data[k].image = urlMap[result.data[k].image]
      }
    }

    return {
      success: true,
      data: result.data,
      total: countResult.total,
      hasMore: (skip + result.data.length) < countResult.total
    }
  } catch (err) {
    console.error('获取历史记录失败:', err)
    return { success: false, error: err.message }
  }
}
