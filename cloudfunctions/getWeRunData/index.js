// 云函数入口 - 临时调试版本：查看 cloudID 自动解密是否生效
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  return {
    cloudIDType: typeof event.cloudID,
    cloudIDPreview: typeof event.cloudID === 'string'
      ? event.cloudID.substring(0, 30) + '...'
      : JSON.stringify(event.cloudID).substring(0, 300),
    allKeys: Object.keys(event)
  }
}
