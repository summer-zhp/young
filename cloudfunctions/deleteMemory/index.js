const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { memoryId } = event

  if (!memoryId) {
    return { success: false, error: '缺少纪念ID' }
  }

  try {
    const memoryRes = await db.collection('memories').doc(memoryId).get()
    const memory = memoryRes.data

    if (memory._openid !== OPENID) {
      return { success: false, error: '无权操作' }
    }

    // 删除云存储中的图片
    if (memory.images && memory.images.length > 0) {
      try {
        await cloud.deleteFile({ fileList: memory.images })
      } catch (e) {
        console.error('删除图片文件失败:', e)
      }
    }

    await db.collection('memories').doc(memoryId).remove()
    return { success: true }
  } catch (err) {
    console.error('删除纪念失败:', err)
    return { success: false, error: err.message }
  }
}
