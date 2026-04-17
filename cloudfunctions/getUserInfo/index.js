// 云函数入口 - 获取用户信息（包含"打工人 XXX 号"编号生成）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取或创建用户信息
 * 如果用户不存在，则创建并分配唯一的"打工人 XXX 号"
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 先尝试获取已存在的用户
    const userResult = await db.collection('users')
      .where({ _openid: OPENID })
      .limit(1)
      .get()

    if (userResult.data.length > 0) {
      // 用户已存在，返回用户信息
      const user = userResult.data[0]

      // 计算加入天数
      const createdTime = new Date(user.created_at || user.createTime)
      const now = new Date()
      const days = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)) + 1

      return {
        success: true,
        data: {
          _id: user._id,
          openid: OPENID,
          nickname: user.nickname,
          wxNickname: user.wxNickname || '',
          user_no: user.user_no,
          avatar_url: user.avatar_url || user.avatar,
          days: days,
          created_at: user.created_at || user.createTime || null,
          workSchedule: user.workSchedule || null
        },
        isNew: false
      }
    }

    // 用户不存在，创建新用户并分配编号
    // 先检查计数器是否存在
    let counterDoc
    try {
      counterDoc = await db.collection('global_config')
        .doc('user_counter')
        .get()
    } catch (err) {
      console.log('计数器文档不存在，尝试创建')
    }

    if (!counterDoc || !counterDoc.data) {
      // 创建计数器
      await db.collection('global_config').add({
        data: {
          _id: 'user_counter',
          current_no: 0
        }
      })
    }

    // 递增计数器
    await db.collection('global_config')
      .doc('user_counter')
      .update({
        data: {
          current_no: _.inc(1)
        }
      })

    // 获取更新后的编号
    const counter = await db.collection('global_config')
      .doc('user_counter')
      .get()

    const userNo = counter.data.current_no
    const nickname = `打工人${String(userNo).padStart(3, '0')}号`

    // 创建用户记录
    const createUserResult = await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickname,
        user_no: userNo,
        avatar_url: '',
        total_focus_time: 0,
        focus_count: 0,
        created_at: db.serverDate(),
        last_login_at: db.serverDate()
      }
    })

    return {
      success: true,
      data: {
        _id: createUserResult._id,
        openid: OPENID,
        nickname,
        user_no: userNo,
        avatar_url: '',
        days: 1
      },
      isNew: true
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
    return {
      success: false,
      error: err.message,
      message: '获取用户信息失败'
    }
  }
}
