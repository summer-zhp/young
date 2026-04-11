const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { text, imageFileIDs, location } = event

  if (!text && (!imageFileIDs || imageFileIDs.length === 0)) {
    return { success: false, error: '请至少添加一张图片或一段文字' }
  }

  try {
    const result = await db.collection('memories').add({
      data: {
        _openid: OPENID,
        text: text || '',
        images: imageFileIDs || [],
        location: location || null,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })
    return { success: true, data: { _id: result._id } }
  } catch (err) {
    console.error('保存纪念失败:', err)
    return { success: false, error: err.message }
  }
}
