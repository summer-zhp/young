// 云函数 - 灵魂画像评分（4选项版）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云存储图片基础路径
const animalImageBase = 'cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1308074643/animal/'

// MBTI 16种类型映射
const mbtiMap = {
  'INTJ': {
    animal: '猫头鹰', emoji: '🦉', image: animalImageBase + '猫头鹰.png',
    workplace: '战略大师', workplaceDesc: '高瞻远瞩，运筹帷幄，是团队中的幕后军师',
    fantasy: '暗影贤者', fantasyDesc: '掌握古老智慧，在暗处引导世界走向',
    analysis: '你是一个独立而深邃的灵魂。你善于从全局出发思考问题，有着非凡的洞察力和战略眼光。在人群中你可能不是最活跃的，但你的想法往往最有深度。你追求效率和卓越，对自己和他人都有着很高的标准。',
    keywords: ['战略思维', '独立', '洞察力', '完美主义'], color: '#5B7DB1'
  },
  'INTP': {
    animal: '章鱼', emoji: '🐙', image: animalImageBase + '章鱼.png',
    workplace: '理论发明家', workplaceDesc: '沉浸在思维海洋，用逻辑构建全新世界',
    fantasy: '虚空学者', fantasyDesc: '游走在知识边界，探索宇宙的终极奥秘',
    analysis: '你是一个充满好奇心的思考者。你热衷于探索事物的本质和规律，脑海中总是有各种各样的想法。你享受独处的时光，因为那是你思维最活跃的时刻。对知识的渴望是你最强大的驱动力。',
    keywords: ['逻辑分析', '好奇心', '创造力', '独立思考'], color: '#7B68AE'
  },
  'ENTJ': {
    animal: '狮子', emoji: '🦁', image: animalImageBase + '狮子.png',
    workplace: 'CEO预备役', workplaceDesc: '天生领袖，雷厉风行，目标就是登上巅峰',
    fantasy: '帝国统帅', fantasyDesc: '号令天下的王者，用铁腕和智慧开创纪元',
    analysis: '你是一个天生的领导者和组织者。你有着强大的决断力和执行力，能够迅速抓住问题的核心并制定有效的策略。你的自信和魄力能够感染身边的人，推动团队向着目标前进。',
    keywords: ['领导力', '决断力', '目标导向', '高效执行'], color: '#C45C5C'
  },
  'ENTP': {
    animal: '狐狸', emoji: '🦊', image: animalImageBase + '狐狸.png',
    workplace: '点子大王', workplaceDesc: '脑洞无限的创意引擎，永远有新花样',
    fantasy: '混沌使者', fantasyDesc: '游走在秩序边缘，用机智改变游戏规则',
    analysis: '你是一个充满活力和创造力的灵魂。你享受思维的碰撞，喜欢挑战既有的观点和规则。你的机智和幽默让你成为人群中的焦点，而你无穷的创意总能带来意想不到的惊喜。',
    keywords: ['创造力', '辩论高手', '适应力', '幽默感'], color: '#E8924A'
  },
  'INFJ': {
    animal: '独角兽', emoji: '🦄', image: animalImageBase + '独角兽.png',
    workplace: '心灵导师', workplaceDesc: '洞察人心的温暖守护者，安静但有力量',
    fantasy: '命运先知', fantasyDesc: '感知未来的预言家，用爱与智慧照亮前路',
    analysis: '你是一个温柔而深沉的灵魂。你有着非凡的共情能力和直觉，能够敏锐地感受到他人的情绪和需求。你追求有意义的人生，内心有着坚定的理想和信念。你是那个安静地改变世界的人。',
    keywords: ['共情力', '理想主义', '直觉', '温暖'], color: '#9B6FAE'
  },
  'INFP': {
    animal: '小鹿', emoji: '🦌', image: animalImageBase + '小鹿.png',
    workplace: '灵魂创作者', workplaceDesc: '内心世界无比丰富，用作品表达真实自我',
    fantasy: '梦境守护者', fantasyDesc: '编织梦想的精灵，守护世间最后的纯真',
    analysis: '你是一个浪漫而理想主义的灵魂。你内心拥有一个丰富而美丽的世界，对美和真实有着深刻的追求。你温柔、善良，总是能看到事物最好的一面。你的创造力和想象力是你最珍贵的礼物。',
    keywords: ['理想主义', '创造力', '温柔', '真实'], color: '#7EA8BE'
  },
  'ENFJ': {
    animal: '海豚', emoji: '🐬', image: animalImageBase + '海豚.png',
    workplace: '团魂担当', workplaceDesc: '天生的人心凝聚者，让每个人都闪闪发光',
    fantasy: '光明使者', fantasyDesc: '以爱之名集结伙伴，照亮世界的每个角落',
    analysis: '你是一个充满热情和感染力的灵魂。你天生就懂得如何激励和帮助他人，你的温暖和真诚能够融化最冰冷的心。你追求和谐的人际关系，总是把团队的利益放在心上。',
    keywords: ['感染力', '利他精神', '沟通天赋', '热情'], color: '#E8A04A'
  },
  'ENFP': {
    animal: '金毛犬', emoji: '🐕', image: animalImageBase + '金毛犬.png',
    workplace: '社交发动机', workplaceDesc: '热情似火，创意无限，走到哪都自带气氛',
    fantasy: '灵焰使者', fantasyDesc: '燃烧着不灭的热情，用欢乐点燃每一颗心',
    analysis: '你是一个充满热情和创造力的灵魂。你对生活充满好奇和热爱，总能发现身边美好的事物。你的热情和真诚感染着每一个遇到你的人，而你无穷的创意和想象力让世界变得更加有趣。',
    keywords: ['热情', '创造力', '社交达人', '乐观主义'], color: '#E8C44A'
  },
  'ISTJ': {
    animal: '海狸', emoji: '🦫', image: animalImageBase + '海狸.png',
    workplace: '可靠担当', workplaceDesc: '一丝不苟执行到位，是团队最坚实的后盾',
    fantasy: '守卫骑士', fantasyDesc: '忠诚的守护者，用坚不可摧的意志保卫家园',
    analysis: '你是一个值得信赖和依靠的人。你做事认真负责、有条不紊，对承诺的事情总是全力以赴。你重视传统和秩序，是团队中最稳定的力量。你的可靠和坚持是你最大的闪光点。',
    keywords: ['责任心', '可靠', '条理性', '坚韧'], color: '#5A8A7A'
  },
  'ISFJ': {
    animal: '考拉', emoji: '🐨', image: animalImageBase + '考拉.png',
    workplace: '温暖后盾', workplaceDesc: '默默付出细心照顾，有你在就很安心',
    fantasy: '生命守护者', fantasyDesc: '温柔的力量守护着每个需要帮助的生命',
    analysis: '你是一个温暖而体贴的灵魂。你总是默默地关心和照顾身边的人，记得每个人的喜好和需要。你的善良和可靠让你成为朋友心中最温暖的存在，虽然你不张扬，但你的付出是最珍贵的。',
    keywords: ['温暖', '细心', '忠诚', '默默付出'], color: '#8AB88A'
  },
  'ESTJ': {
    animal: '德国牧羊犬', emoji: '🐕‍🦺', image: animalImageBase + '德国牧羊犬.png',
    workplace: '效率专家', workplaceDesc: '执行力爆表的管理者，让一切井然有序',
    fantasy: '秩序之王', fantasyDesc: '以铁律治国的明君，让混乱重归秩序',
    analysis: '你是一个务实而高效的人。你有着出色的组织能力和执行力，能够把复杂的事情安排得井井有条。你重视规则和效率，是团队中把计划变为现实的关键力量。',
    keywords: ['执行力', '组织力', '务实', '高效率'], color: '#5A7A8A'
  },
  'ESFJ': {
    animal: '企鹅', emoji: '🐧', image: animalImageBase + '企鹅.png',
    workplace: '团建委员', workplaceDesc: '人际关系的粘合剂，让大家一起开心',
    fantasy: '和谐守护者', fantasyDesc: '维系世界和平的使者，让爱连接每个人',
    analysis: '你是一个热心而友善的灵魂。你天生善于社交和照顾他人，总是主动营造和谐的氛围。你关心身边每个人的感受，是朋友圈中的暖心担当。你的真诚和热心让你拥有广泛的人缘。',
    keywords: ['热心肠', '社交能力', '善解人意', '团队精神'], color: '#C47A7A'
  },
  'ISTP': {
    animal: '猎鹰', emoji: '🦅', image: animalImageBase + '猎鹰.png',
    workplace: '极客独行侠', workplaceDesc: '冷静分析精准行动，一个人就是一支队伍',
    fantasy: '风暴锻造师', fantasyDesc: '以精密手艺打造神器，用冷静面对一切',
    analysis: '你是一个冷静而精干的灵魂。你善于分析和解决实际问题，在危机中保持镇定。你享受动手操作的乐趣，有着出色的机械和空间感知能力。你独立自主，喜欢按自己的节奏行动。',
    keywords: ['冷静分析', '动手能力', '独立', '应变力'], color: '#6A8A6A'
  },
  'ISFP': {
    animal: '熊猫', emoji: '🐼', image: animalImageBase + '熊猫.png',
    workplace: '美学鉴赏家', workplaceDesc: '用作品说话的低调艺术家，品味满分',
    fantasy: '自然精灵', fantasyDesc: '与万物共生的森林守护者，感受自然之美',
    analysis: '你是一个温柔而富有艺术感的灵魂。你对美有着敏锐的感知力，追求真实而和谐的生活方式。你温和、谦逊，不喜欢冲突，但你内心有着坚定的价值观。你的审美和创造力让你独具魅力。',
    keywords: ['审美天赋', '温和', '真实', '艺术感'], color: '#7AAE7A'
  },
  'ESTP': {
    animal: '猎豹', emoji: '🐆', image: animalImageBase + '猎豹.png',
    workplace: '行动派', workplaceDesc: '想到就做的实干家，快准狠解决问题',
    fantasy: '极速猎人', fantasyDesc: '速度与激情的化身，在冒险中征服一切',
    analysis: '你是一个充满活力和行动力的灵魂。你享受当下的每一刻，善于把握机会快速行动。你的勇敢和果断让你在挑战面前无所畏惧，而你的幽默和魅力让你成为人群中的焦点。',
    keywords: ['行动力', '冒险精神', '应变力', '魅力'], color: '#D4894A'
  },
  'ESFP': {
    animal: '水獭', emoji: '🦦', image: animalImageBase + '水獭.png',
    workplace: '气氛组C位', workplaceDesc: '天生表演家，有你的地方就有欢乐',
    fantasy: '欢乐精灵', fantasyDesc: '传播快乐的使者，让笑声回荡在每一个角落',
    analysis: '你是一个活泼而充满魅力的灵魂。你热爱生活，享受当下的每一刻快乐。你的热情和感染力让你成为人群中的焦点，而你慷慨友善的性格让你拥有很多朋友。你让周围的世界变得更加多彩。',
    keywords: ['活力四射', '乐观', '表演天赋', '感染力'], color: '#E88A6A'
  }
}

// 每道题的选项映射: [A=强左, B=弱左, C=弱右, D=强右]
// 左=E/S/T/J, 右=I/N/F/P
// score: 2=强烈, 1=一般
const questionOptions = [
  // Q1-Q10: EI维度
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  [{value:'E',score:2},{value:'E',score:1},{value:'I',score:1},{value:'I',score:2}],
  // Q11-Q20: SN维度
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  [{value:'S',score:2},{value:'S',score:1},{value:'N',score:1},{value:'N',score:2}],
  // Q21-Q30: TF维度
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  [{value:'T',score:2},{value:'T',score:1},{value:'F',score:1},{value:'F',score:2}],
  // Q31-Q40: JP维度
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}],
  [{value:'J',score:2},{value:'J',score:1},{value:'P',score:1},{value:'P',score:2}]
]

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { answers } = event

  // 校验
  if (!answers || !Array.isArray(answers) || answers.length !== 40) {
    return { success: false, error: '答案数据不完整，需要40题' }
  }

  try {
    // 1. 计算各维度得分
    var scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }

    for (var i = 0; i < 40; i++) {
      var optIdx = answers[i]
      if (optIdx < 0 || optIdx > 3) {
        return { success: false, error: '第' + (i + 1) + '题答案无效' }
      }
      var opt = questionOptions[i][optIdx]
      scores[opt.value] += opt.score
    }

    // 2. 判断各维度倾向
    var type = ''
    type += (scores.E >= scores.I) ? 'E' : 'I'
    type += (scores.S >= scores.N) ? 'S' : 'N'
    type += (scores.T >= scores.F) ? 'T' : 'F'
    type += (scores.J >= scores.P) ? 'J' : 'P'

    // 3. 计算倾向百分比（每维度满分20，最小0）
    // 正值=前一端(E/S/T/J), 负值=后一端(I/N/F/P)
    var percentEI = Math.round((scores.E - scores.I) / 20 * 100)
    var percentSN = Math.round((scores.S - scores.N) / 20 * 100)
    var percentTF = Math.round((scores.T - scores.F) / 20 * 100)
    var percentJP = Math.round((scores.J - scores.P) / 20 * 100)

    // 4. 查映射表
    var result = mbtiMap[type]
    if (!result) {
      return { success: false, error: '未知的MBTI类型: ' + type }
    }

    var record = {
      _openid: OPENID,
      mbti_type: type,
      scores: { EI: percentEI, SN: percentSN, TF: percentTF, JP: percentJP },
      animal: result.animal,
      emoji: result.emoji,
      image: result.image,
      workplace: result.workplace,
      workplace_desc: result.workplaceDesc,
      fantasy: result.fantasy,
      fantasy_desc: result.fantasyDesc,
      analysis: result.analysis,
      keywords: result.keywords,
      color: result.color,
      answers: answers,
      created_at: db.serverDate()
    }

    // 5. 存入数据库
    await db.collection('soul_quiz_records').add({ data: record })

    // 6. 服务端获取动物图片签名URL
    var imageUrl = ''
    try {
      var urlResult = await cloud.getTempFileURL({
        fileList: [result.image]
      })
      if (urlResult.fileList && urlResult.fileList[0] && urlResult.fileList[0].tempFileURL) {
        imageUrl = urlResult.fileList[0].tempFileURL
      }
    } catch (e) {
      console.error('获取图片URL失败:', e)
    }

    // 7. 返回结果
    return {
      success: true,
      data: {
        mbti_type: type,
        scores: record.scores,
        animal: result.animal,
        emoji: result.emoji,
        image: imageUrl,
        workplace: result.workplace,
        workplace_desc: result.workplaceDesc,
        fantasy: result.fantasy,
        fantasy_desc: result.fantasyDesc,
        analysis: result.analysis,
        keywords: result.keywords,
        color: result.color
      }
    }
  } catch (err) {
    console.error('评分失败:', err)
    return { success: false, error: err.message }
  }
}
