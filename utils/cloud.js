/**
 * 云开发工具类
 */
const cloud = {
  /**
   * 调用云函数
   * @param {string} name 云函数名称
   * @param {object} data 调用数据
   * @returns {Promise} 云函数调用结果
   */
  callFunction: async (name, data = {}) => {
    try {
      // 确保云开发已初始化
      if (!wx.cloud) {
        throw new Error('云开发未初始化，请检查 app.js 中是否调用了 wx.cloud.init()')
      }

      const res = await wx.cloud.callFunction({
        name,
        data
      })
      return res.result
    } catch (err) {
      console.error(`[云函数:${name}] 调用失败:`, err)
      throw err
    }
  },

  /**
   * 上传文件到云存储
   * @param {string} filePath 文件路径
   * @param {string} cloudPath 云存储路径
   * @returns {Promise} 上传结果
   */
  uploadFile: async (filePath, cloudPath) => {
    try {
      const res = await wx.cloud.uploadFile({
        filePath,
        cloudPath
      })
      return res.fileID
    } catch (err) {
      console.error('[云存储] 上传失败:', err)
      throw err
    }
  },

  /**
   * 下载文件
   * @param {string} fileID 文件 ID
   * @returns {Promise} 临时链接
   */
  getTempFileURL: async (fileID) => {
    try {
      const res = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      })
      return res.fileList[0].tempFileURL
    } catch (err) {
      console.error('[云存储] 获取链接失败:', err)
      throw err
    }
  },

  /**
   * 获取云数据库引用
   * @returns {object} 数据库引用
   */
  database: () => {
    return wx.cloud.database()
  }
}

module.exports = { cloud }
