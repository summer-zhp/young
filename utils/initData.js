/**
 * 数据初始化脚本
 * 用于向云开发数据库添加初始数据
 *
 * 使用方法：
 * 1. 在微信开发者工具中打开"云开发"控制台
 * 2. 进入"数据库" -> "治愈内容"集合
 * 3. 点击"添加数据"，使用以下 JSON 数据
 *
 * 或者使用云函数导入（推荐）：
 * 1. 在云函数中创建 initData 函数
 * 2. 复制此脚本内容到云函数
 * 3. 调用云函数执行导入
 */

// 治愈内容初始数据
const healingContentData = [
  {
    "type": "quote",
    "content": "生活原本沉闷，但跑起来就有风。",
    "category": "life",
    "background_image": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/images/breeze.jpg",
    "is_featured": true,
    "created_at": new Date()
  },
  {
    "type": "quote",
    "content": "每一次呼吸，都是与自己的和解。",
    "category": "life",
    "background_image": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/images/breathe.jpg",
    "is_featured": true,
    "created_at": new Date()
  },
  {
    "type": "quote",
    "content": "今天辛苦了，抱抱自己吧。",
    "category": "work",
    "background_image": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/images/hug.jpg",
    "is_featured": true,
    "created_at": new Date()
  },
  {
    "type": "quote",
    "content": "你比昨天更勇敢了，为你点赞！",
    "category": "life",
    "background_image": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/images/brave.jpg",
    "is_featured": true,
    "created_at": new Date()
  },
  {
    "type": "quote",
    "content": "慢慢来，好戏都在烟火里。",
    "category": "life",
    "background_image": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/images/life.jpg",
    "is_featured": true,
    "created_at": new Date()
  },
  {
    "type": "quote",
    "content": "工作再忙，也要记得抬头看看天空。",
    "category": "work",
    "background_image": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/images/sky.jpg",
    "is_featured": true,
    "created_at": new Date()
  },
  {
    "type": "quote",
    "content": "你值得拥有所有美好。",
    "category": "love",
    "background_image": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/images/worth.jpg",
    "is_featured": true,
    "created_at": new Date()
  },
  {
    "type": "quote",
    "content": "累了就休息，歇够了再继续前行。",
    "category": "work",
    "background_image": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/images/rest.jpg",
    "is_featured": true,
    "created_at": new Date()
  }
]

// 自然声音初始数据
const natureSoundsData = [
  {
    "name": "雨声",
    "description": "轻柔的雨声，帮助你放松身心",
    "audio_url": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/sounds/rain.mp3",
    "icon": "🌧️",
    "category": "weather",
    "duration": 3600
  },
  {
    "name": "海浪",
    "description": "海浪拍打沙滩的声音",
    "audio_url": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/sounds/waves.mp3",
    "icon": "🌊",
    "category": "nature",
    "duration": 3600
  },
  {
    "name": "森林",
    "description": "森林中的鸟鸣和风声",
    "audio_url": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/sounds/forest.mp3",
    "icon": "🌲",
    "category": "nature",
    "duration": 3600
  },
  {
    "name": "篝火",
    "description": "温暖的篝火燃烧声",
    "audio_url": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/sounds/campfire.mp3",
    "icon": "🔥",
    "category": "ambient",
    "duration": 3600
  },
  {
    "name": "咖啡馆",
    "description": "轻松的咖啡馆背景音乐",
    "audio_url": "cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1257473911/sounds/cafe.mp3",
    "icon": "☕",
    "category": "ambient",
    "duration": 3600
  }
]

console.log('初始数据准备完成！')
console.log('治愈内容:', healingContentData.length, '条')
console.log('自然声音:', natureSoundsData.length, '条')
console.log('\n请在微信开发者工具中手动导入这些数据，或创建云函数进行导入')

module.exports = {
  healingContentData,
  natureSoundsData
}
