// 云函数入口函数 - 初始化数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 治愈内容初始数据
const healingContentData = [
  {
    type: 'quote',
    content: '生活原本沉闷，但跑起来就有风。',
    category: 'life',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '每一次呼吸，都是与自己的和解。',
    category: 'life',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '今天辛苦了，抱抱自己吧。',
    category: 'work',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '你比昨天更勇敢了，为你点赞！',
    category: 'life',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '慢慢来，好戏都在烟火里。',
    category: 'life',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '工作再忙，也要记得抬头看看天空。',
    category: 'work',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '你值得拥有所有美好。',
    category: 'love',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '累了就休息，歇够了再继续前行。',
    category: 'work',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '世界很大，幸福很小，有你就好。',
    category: 'love',
    is_featured: true,
    created_at: new Date()
  },
  {
    type: 'quote',
    content: '做一个温暖的人，不卑不亢，清澈善良。',
    category: 'life',
    is_featured: true,
    created_at: new Date()
  }
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 1. 初始化 global_config 集合（用户计数器）
    const counterDoc = await db.collection('global_config')
      .doc('user_counter')
      .get()
      .catch(() => null)

    if (!counterDoc || !counterDoc.data) {
      // 尝试创建计数器文档
      try {
        await db.collection('global_config').add({
          data: {
            _id: 'user_counter',
            current_no: 0,
            description: '用户编号计数器'
          }
        })
        console.log('创建用户计数器成功')
      } catch (err) {
        console.log('global_config 集合可能不存在，请在云开发控制台手动创建')
      }
    }

    // 2. 初始化治愈内容数据
    const existingData = await db.collection('healing_content').count()

    if (existingData.total === 0) {
      // 批量插入数据
      const promises = healingContentData.map(item => {
        return db.collection('healing_content').add({
          data: item
        })
      })

      await Promise.all(promises)
      console.log('插入治愈内容成功:', healingContentData.length)
    }

    return {
      success: true,
      message: '初始化成功',
      globalConfig: counterDoc ? '已存在' : '已尝试创建',
      healingContentCount: existingData.total === 0 ? healingContentData.length : '已存在'
    }
  } catch (err) {
    console.error('初始化数据失败:', err)
    return {
      success: false,
      error: err.message,
      message: '初始化失败'
    }
  }
}
