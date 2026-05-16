/**
 * 灵魂画像 - 题目数据与结果映射
 * 每题4选项：A=强倾向左, B=弱倾向左, C=弱倾向右, D=强倾向右
 * score: 2=强烈, 1=一般
 */

var questions = [
  // ===== E/I 维度（1-10题）=====
  { id:1, dimension:'EI', text:'周末到了，你更倾向于？',
    options:[
      {text:'约一大帮朋友出去嗨', value:'E', score:2},
      {text:'约两三个好友吃饭逛街', value:'E', score:1},
      {text:'在家安静地看书追剧', value:'I', score:1},
      {text:'关掉手机独处放空一天', value:'I', score:2}
    ]},
  { id:2, dimension:'EI', text:'参加一个聚会时，你通常会？',
    options:[
      {text:'主动和不认识的人攀谈', value:'E', score:2},
      {text:'在朋友的引荐下认识新面孔', value:'E', score:1},
      {text:'待在熟悉的朋友身边就好', value:'I', score:1},
      {text:'找个角落安静地待着', value:'I', score:2}
    ]},
  { id:3, dimension:'EI', text:'工作中遇到问题，你倾向于？',
    options:[
      {text:'立刻找同事讨论碰撞想法', value:'E', score:2},
      {text:'简单问问身边人的意见', value:'E', score:1},
      {text:'自己先查资料想想再说', value:'I', score:1},
      {text:'完全独立思考不参考别人', value:'I', score:2}
    ]},
  { id:4, dimension:'EI', text:'下面哪种场景更让你充电？',
    options:[
      {text:'和一群人热热闹闹地玩', value:'E', score:2},
      {text:'和朋友一起做点轻松的事', value:'E', score:1},
      {text:'独自散步或听音乐', value:'I', score:1},
      {text:'一个人安静地冥想发呆', value:'I', score:2}
    ]},
  { id:5, dimension:'EI', text:'在微信群里，你通常是？',
    options:[
      {text:'群里的气氛担当，天天活跃', value:'E', score:2},
      {text:'偶尔冒个泡参与话题', value:'E', score:1},
      {text:'只看不说话的潜水党', value:'I', score:1},
      {text:'消息免打扰，基本不看', value:'I', score:2}
    ]},
  { id:6, dimension:'EI', text:'面对一个新项目，你会？',
    options:[
      {text:'立刻拉群头脑风暴', value:'E', score:2},
      {text:'先和搭档聊一聊', value:'E', score:1},
      {text:'自己先列好思路再找人', value:'I', score:1},
      {text:'从头到尾独立搞定', value:'I', score:2}
    ]},
  { id:7, dimension:'EI', text:'下班后你更喜欢？',
    options:[
      {text:'约不同圈子的人聚餐社交', value:'E', score:2},
      {text:'和固定朋友吃个饭聊聊天', value:'E', score:1},
      {text:'一个人逛逛书店或咖啡馆', value:'I', score:1},
      {text:'直接回家享受独处时光', value:'I', score:2}
    ]},
  { id:8, dimension:'EI', text:'旅行时你更享受？',
    options:[
      {text:'认识新朋友，体验热闹的夜生活', value:'E', score:2},
      {text:'和旅伴一起探索当地美食', value:'E', score:1},
      {text:'安静地感受风景拍照', value:'I', score:1},
      {text:'一个人深度漫游不与人交流', value:'I', score:2}
    ]},
  { id:9, dimension:'EI', text:'开会时你通常？',
    options:[
      {text:'积极发言，主导讨论方向', value:'E', score:2},
      {text:'有想法就顺手说一下', value:'E', score:1},
      {text:'认真听别人讲再默默记下', value:'I', score:1},
      {text:'全程沉默，会后私下沟通', value:'I', score:2}
    ]},
  { id:10, dimension:'EI', text:'完成一个重要任务后，你更想？',
    options:[
      {text:'发朋友圈请全组庆祝', value:'E', score:2},
      {text:'和几个亲近的人分享喜悦', value:'E', score:1},
      {text:'给自己买个小礼物犒劳', value:'I', score:1},
      {text:'内心满足就好不需告诉谁', value:'I', score:2}
    ]},

  // ===== S/N 维度（11-20题）=====
  { id:11, dimension:'SN', text:'学习新东西时，你更喜欢？',
    options:[
      {text:'手把手教我一步步怎么做', value:'S', score:2},
      {text:'看具体的教程和案例', value:'S', score:1},
      {text:'先搞懂背后的原理和逻辑', value:'N', score:1},
      {text:'直接联想它的本质和趋势', value:'N', score:2}
    ]},
  { id:12, dimension:'SN', text:'在工作中你更关注？',
    options:[
      {text:'每个细节都要做到位', value:'S', score:2},
      {text:'先把眼前的事做好', value:'S', score:1},
      {text:'思考这件事的未来走向', value:'N', score:1},
      {text:'关注行业的整体趋势变化', value:'N', score:2}
    ]},
  { id:13, dimension:'SN', text:'你更喜欢哪种类型的书？',
    options:[
      {text:'实用技能操作手册', value:'S', score:2},
      {text:'真实人物传记或历史', value:'S', score:1},
      {text:'科幻或奇幻小说', value:'N', score:1},
      {text:'哲学或未来学著作', value:'N', score:2}
    ]},
  { id:14, dimension:'SN', text:'面对一个难题，你倾向于？',
    options:[
      {text:'严格按照已有经验来处理', value:'S', score:2},
      {text:'参考类似案例做适当调整', value:'S', score:1},
      {text:'尝试一个全新的思路', value:'N', score:1},
      {text:'大胆颠覆传统做法从头来', value:'N', score:2}
    ]},
  { id:15, dimension:'SN', text:'描述一件事情时，你通常会？',
    options:[
      {text:'用精确的数据和事实说话', value:'S', score:2},
      {text:'有条理地讲清楚来龙去脉', value:'S', score:1},
      {text:'打个比方让人更好理解', value:'N', score:1},
      {text:'天马行空用各种联想来讲', value:'N', score:2}
    ]},
  { id:16, dimension:'SN', text:'你更信赖？',
    options:[
      {text:'经过反复验证的权威方法', value:'S', score:2},
      {text:'大多数人都在用的做法', value:'S', score:1},
      {text:'自己脑海中的灵光一闪', value:'N', score:1},
      {text:'无法解释但很准的第六感', value:'N', score:2}
    ]},
  { id:17, dimension:'SN', text:'做计划时你更看重？',
    options:[
      {text:'每一步都切实可行的细节', value:'S', score:2},
      {text:'有清晰的步骤和时间线', value:'S', score:1},
      {text:'一个令人振奋的方向和愿景', value:'N', score:1},
      {text:'大胆的目标和颠覆性的设想', value:'N', score:2}
    ]},
  { id:18, dimension:'SN', text:'看一部电影，你更关注？',
    options:[
      {text:'画面质量和演员演技', value:'S', score:2},
      {text:'剧情是否紧凑有趣', value:'S', score:1},
      {text:'深层想表达的隐喻', value:'N', score:1},
      {text:'它对社会和未来的启示', value:'N', score:2}
    ]},
  { id:19, dimension:'SN', text:'买一件东西，你更看重？',
    options:[
      {text:'参数、性价比和用户评价', value:'S', score:2},
      {text:'实用性和质量', value:'S', score:1},
      {text:'独特的设计感', value:'N', score:1},
      {text:'它背后的理念和故事', value:'N', score:2}
    ]},
  { id:20, dimension:'SN', text:'你觉得最厉害的人是？',
    options:[
      {text:'能把一件事做到极致的工匠', value:'S', score:2},
      {text:'经验丰富做事靠谱的老手', value:'S', score:1},
      {text:'总能想到别人想不到的创意人', value:'N', score:1},
      {text:'改变世界的远见卓识者', value:'N', score:2}
    ]},

  // ===== T/F 维度（21-30题）=====
  { id:21, dimension:'TF', text:'做一个重要决定时，你更依赖？',
    options:[
      {text:'冷冰冰的数据和逻辑推理', value:'T', score:2},
      {text:'客观分析加上一点判断', value:'T', score:1},
      {text:'内心感受结合理性思考', value:'F', score:1},
      {text:'完全跟着直觉和价值观走', value:'F', score:2}
    ]},
  { id:22, dimension:'TF', text:'朋友向你吐槽，你第一反应是？',
    options:[
      {text:'直接帮TA分析问题出在哪', value:'T', score:2},
      {text:'先理性安抚再给建议', value:'T', score:1},
      {text:'先共情安慰说"我懂你"', value:'F', score:1},
      {text:'和TA一起吐槽，感受TA的感受', value:'F', score:2}
    ]},
  { id:23, dimension:'TF', text:'评价一个同事时，你更看重？',
    options:[
      {text:'工作效率和产出质量', value:'T', score:2},
      {text:'专业能力和靠谱程度', value:'T', score:1},
      {text:'为人友善和团队配合度', value:'F', score:1},
      {text:'对大家的关心和温暖程度', value:'F', score:2}
    ]},
  { id:24, dimension:'TF', text:'团队有分歧时，你认为最重要的是？',
    options:[
      {text:'用数据说话找到最优解', value:'T', score:2},
      {text:'理性讨论找到最佳方案', value:'T', score:1},
      {text:'先照顾大家的感受再讨论', value:'F', score:1},
      {text:'维持关系和谐比方案更重要', value:'F', score:2}
    ]},
  { id:25, dimension:'TF', text:'你更认同哪句话？',
    options:[
      {text:'真相第一，对事不对人', value:'T', score:2},
      {text:'客观理性，效率优先', value:'T', score:1},
      {text:'做事先做人，关系很重要', value:'F', score:1},
      {text:'人心比规则更值得关注', value:'F', score:2}
    ]},
  { id:26, dimension:'TF', text:'收到批评时，你会？',
    options:[
      {text:'当没事一样冷静分析对错', value:'T', score:2},
      {text:'克制情绪去想想有没有道理', value:'T', score:1},
      {text:'心里不舒服但尽量接受', value:'F', score:1},
      {text:'很受伤需要很久才能消化', value:'F', score:2}
    ]},
  { id:27, dimension:'TF', text:'选择一份工作，你更看重？',
    options:[
      {text:'薪资和晋升路径清晰', value:'T', score:2},
      {text:'发展空间和行业前景', value:'T', score:1},
      {text:'团队氛围好同事友善', value:'F', score:1},
      {text:'工作能让自己感到有意义', value:'F', score:2}
    ]},
  { id:28, dimension:'TF', text:'跟朋友约好的事临时变了，你会？',
    options:[
      {text:'调整计划按新情况执行', value:'T', score:2},
      {text:'问清楚原因再调整安排', value:'T', score:1},
      {text:'先担心对方是不是遇到事了', value:'F', score:1},
      {text:'心疼对方忍不住要关心一下', value:'F', score:2}
    ]},
  { id:29, dimension:'TF', text:'你买东西时？',
    options:[
      {text:'列出参数表格货比三家', value:'T', score:2},
      {text:'做做功课找最优选择', value:'T', score:1},
      {text:'看心情和眼缘随便挑挑', value:'F', score:1},
      {text:'全凭感觉喜欢就买不犹豫', value:'F', score:2}
    ]},
  { id:30, dimension:'TF', text:'处理问题时，你更倾向于？',
    options:[
      {text:'追求绝对公平和客观标准', value:'T', score:2},
      {text:'制定规则按规则办事', value:'T', score:1},
      {text:'考虑每个人的实际情况', value:'F', score:1},
      {text:'优先照顾弱势一方的感受', value:'F', score:2}
    ]},

  // ===== J/P 维度（31-40题）=====
  { id:31, dimension:'JP', text:'你的工作方式更像？',
    options:[
      {text:'每天列清单按计划执行', value:'J', score:2},
      {text:'有个大致安排按节奏来', value:'J', score:1},
      {text:'随性发挥看心情做事', value:'P', score:1},
      {text:'完全凭直觉想做什么做什么', value:'P', score:2}
    ]},
  { id:32, dimension:'JP', text:'去旅行你会？',
    options:[
      {text:'提前做好详细攻略精确到小时', value:'J', score:2},
      {text:'大概定好行程和酒店', value:'J', score:1},
      {text:'只定大方向细节到时再说', value:'P', score:1},
      {text:'随心所欲走到哪算哪', value:'P', score:2}
    ]},
  { id:33, dimension:'JP', text:'面对截止日期，你通常？',
    options:[
      {text:'提前完成留出充足余量', value:'J', score:2},
      {text:'按部就班不早不晚刚好', value:'J', score:1},
      {text:'前期磨蹭后期加速冲刺', value:'P', score:1},
      {text:'最后一刻爆发惊人效率', value:'P', score:2}
    ]},
  { id:34, dimension:'JP', text:'你的桌面/房间通常？',
    options:[
      {text:'整整齐齐每样东西有固定位置', value:'J', score:2},
      {text:'大体整洁偶尔有点小乱', value:'J', score:1},
      {text:'看着乱但自己能找到东西', value:'P', score:1},
      {text:'乱到朋友来了会吓一跳', value:'P', score:2}
    ]},
  { id:35, dimension:'JP', text:'做决定时你更倾向于？',
    options:[
      {text:'快速分析后果断拍板', value:'J', score:2},
      {text:'想清楚主要利弊就定', value:'J', score:1},
      {text:'再等等看有没有更多信息', value:'P', score:1},
      {text:'能拖就拖到不得不决定', value:'P', score:2}
    ]},
  { id:36, dimension:'JP', text:'生活变化对你来说？',
    options:[
      {text:'喜欢稳定有规律的生活节奏', value:'J', score:2},
      {text:'小变化可以大方向不变就行', value:'J', score:1},
      {text:'偶尔来点新鲜感挺好', value:'P', score:1},
      {text:'越变越刺激生活才有意思', value:'P', score:2}
    ]},
  { id:37, dimension:'JP', text:'安排周末时你会？',
    options:[
      {text:'列一个详细的计划清单', value:'J', score:2},
      {text:'心里有几个想做的事', value:'J', score:1},
      {text:'大致想想到时候看心情', value:'P', score:1},
      {text:'完全不想到了再说', value:'P', score:2}
    ]},
  { id:38, dimension:'JP', text:'你更认同哪种工作节奏？',
    options:[
      {text:'严格按时间表推进每一步', value:'J', score:2},
      {text:'有明确的里程碑和节点', value:'J', score:1},
      {text:'弹性时间以结果为导向', value:'P', score:1},
      {text:'完全自由只管灵感来了干活', value:'P', score:2}
    ]},
  { id:39, dimension:'JP', text:'关于规则你更倾向于？',
    options:[
      {text:'严格遵守规则让事情有序', value:'J', score:2},
      {text:'尊重规则但允许小调整', value:'J', score:1},
      {text:'规则是参考可以灵活变通', value:'P', score:1},
      {text:'规则就是用来打破的', value:'P', score:2}
    ]},
  { id:40, dimension:'JP', text:'开始新的一天，你更想？',
    options:[
      {text:'按照昨晚的计划清单执行', value:'J', score:2},
      {text:'有几个固定的习惯然后自由安排', value:'J', score:1},
      {text:'看看今天会有什么有趣的事', value:'P', score:1},
      {text:'睡到自然醒再说', value:'P', score:2}
    ]}
]

// 云存储图片 cloud:// 基础路径
var animalImageBase = 'cloud://cloud1-2gpreb4e2dc05acb.636c-cloud1-2gpreb4e2dc05acb-1308074643/animal/'

// MBTI 16种类型映射
var mbtiMap = {
  'INTJ': {
    animal: { name: '猫头鹰', emoji: '🦉', image: animalImageBase + '猫头鹰' + '.png' },
    workplace: { name: '战略大师', description: '高瞻远瞩，运筹帷幄，是团队中的幕后军师' },
    fantasy: { name: '暗影贤者', description: '掌握古老智慧，在暗处引导世界走向' },
    analysis: '你是一个独立而深邃的灵魂。你善于从全局出发思考问题，有着非凡的洞察力和战略眼光。在人群中你可能不是最活跃的，但你的想法往往最有深度。你追求效率和卓越，对自己和他人都有着很高的标准。',
    keywords: ['战略思维', '独立', '洞察力', '完美主义'],
    color: '#5B7DB1'
  },
  'INTP': {
    animal: { name: '章鱼', emoji: '🐙', image: animalImageBase + '章鱼' + '.png' },
    workplace: { name: '理论发明家', description: '沉浸在思维海洋，用逻辑构建全新世界' },
    fantasy: { name: '虚空学者', description: '游走在知识边界，探索宇宙的终极奥秘' },
    analysis: '你是一个充满好奇心的思考者。你热衷于探索事物的本质和规律，脑海中总是有各种各样的想法。你享受独处的时光，因为那是你思维最活跃的时刻。对知识的渴望是你最强大的驱动力。',
    keywords: ['逻辑分析', '好奇心', '创造力', '独立思考'],
    color: '#7B68AE'
  },
  'ENTJ': {
    animal: { name: '狮子', emoji: '🦁', image: animalImageBase + '狮子' + '.png' },
    workplace: { name: 'CEO预备役', description: '天生领袖，雷厉风行，目标就是登上巅峰' },
    fantasy: { name: '帝国统帅', description: '号令天下的王者，用铁腕和智慧开创纪元' },
    analysis: '你是一个天生的领导者和组织者。你有着强大的决断力和执行力，能够迅速抓住问题的核心并制定有效的策略。你的自信和魄力能够感染身边的人，推动团队向着目标前进。',
    keywords: ['领导力', '决断力', '目标导向', '高效执行'],
    color: '#C45C5C'
  },
  'ENTP': {
    animal: { name: '狐狸', emoji: '🦊', image: animalImageBase + '狐狸' + '.png' },
    workplace: { name: '点子大王', description: '脑洞无限的创意引擎，永远有新花样' },
    fantasy: { name: '混沌使者', description: '游走在秩序边缘，用机智改变游戏规则' },
    analysis: '你是一个充满活力和创造力的灵魂。你享受思维的碰撞，喜欢挑战既有的观点和规则。你的机智和幽默让你成为人群中的焦点，而你无穷的创意总能带来意想不到的惊喜。',
    keywords: ['创造力', '辩论高手', '适应力', '幽默感'],
    color: '#E8924A'
  },
  'INFJ': {
    animal: { name: '独角兽', emoji: '🦄', image: animalImageBase + '独角兽' + '.png' },
    workplace: { name: '心灵导师', description: '洞察人心的温暖守护者，安静但有力量' },
    fantasy: { name: '命运先知', description: '感知未来的预言家，用爱与智慧照亮前路' },
    analysis: '你是一个温柔而深沉的灵魂。你有着非凡的共情能力和直觉，能够敏锐地感受到他人的情绪和需求。你追求有意义的人生，内心有着坚定的理想和信念。你是那个安静地改变世界的人。',
    keywords: ['共情力', '理想主义', '直觉', '温暖'],
    color: '#9B6FAE'
  },
  'INFP': {
    animal: { name: '小鹿', emoji: '🦌', image: animalImageBase + '小鹿' + '.png' },
    workplace: { name: '灵魂创作者', description: '内心世界无比丰富，用作品表达真实自我' },
    fantasy: { name: '梦境守护者', description: '编织梦想的精灵，守护世间最后的纯真' },
    analysis: '你是一个浪漫而理想主义的灵魂。你内心拥有一个丰富而美丽的世界，对美和真实有着深刻的追求。你温柔、善良，总是能看到事物最好的一面。你的创造力和想象力是你最珍贵的礼物。',
    keywords: ['理想主义', '创造力', '温柔', '真实'],
    color: '#7EA8BE'
  },
  'ENFJ': {
    animal: { name: '海豚', emoji: '🐬', image: animalImageBase + '海豚' + '.png' },
    workplace: { name: '团魂担当', description: '天生的人心凝聚者，让每个人都闪闪发光' },
    fantasy: { name: '光明使者', description: '以爱之名集结伙伴，照亮世界的每个角落' },
    analysis: '你是一个充满热情和感染力的灵魂。你天生就懂得如何激励和帮助他人，你的温暖和真诚能够融化最冰冷的心。你追求和谐的人际关系，总是把团队的利益放在心上。',
    keywords: ['感染力', '利他精神', '沟通天赋', '热情'],
    color: '#E8A04A'
  },
  'ENFP': {
    animal: { name: '金毛犬', emoji: '🐕', image: animalImageBase + '金毛犬' + '.png' },
    workplace: { name: '社交发动机', description: '热情似火，创意无限，走到哪都自带气氛' },
    fantasy: { name: '灵焰使者', description: '燃烧着不灭的热情，用欢乐点燃每一颗心' },
    analysis: '你是一个充满热情和创造力的灵魂。你对生活充满好奇和热爱，总能发现身边美好的事物。你的热情和真诚感染着每一个遇到你的人，而你无穷的创意和想象力让世界变得更加有趣。',
    keywords: ['热情', '创造力', '社交达人', '乐观主义'],
    color: '#E8C44A'
  },
  'ISTJ': {
    animal: { name: '海狸', emoji: '🦫', image: animalImageBase + '海狸' + '.png' },
    workplace: { name: '可靠担当', description: '一丝不苟执行到位，是团队最坚实的后盾' },
    fantasy: { name: '守卫骑士', description: '忠诚的守护者，用坚不可摧的意志保卫家园' },
    analysis: '你是一个值得信赖和依靠的人。你做事认真负责、有条不紊，对承诺的事情总是全力以赴。你重视传统和秩序，是团队中最稳定的力量。你的可靠和坚持是你最大的闪光点。',
    keywords: ['责任心', '可靠', '条理性', '坚韧'],
    color: '#5A8A7A'
  },
  'ISFJ': {
    animal: { name: '考拉', emoji: '🐨', image: animalImageBase + '考拉' + '.png' },
    workplace: { name: '温暖后盾', description: '默默付出细心照顾，有你在就很安心' },
    fantasy: { name: '生命守护者', description: '温柔的力量守护着每个需要帮助的生命' },
    analysis: '你是一个温暖而体贴的灵魂。你总是默默地关心和照顾身边的人，记得每个人的喜好和需要。你的善良和可靠让你成为朋友心中最温暖的存在，虽然你不张扬，但你的付出是最珍贵的。',
    keywords: ['温暖', '细心', '忠诚', '默默付出'],
    color: '#8AB88A'
  },
  'ESTJ': {
    animal: { name: '德国牧羊犬', emoji: '🐕‍🦺', image: animalImageBase + '德国牧羊犬' + '.png' },
    workplace: { name: '效率专家', description: '执行力爆表的管理者，让一切井然有序' },
    fantasy: { name: '秩序之王', description: '以铁律治国的明君，让混乱重归秩序' },
    analysis: '你是一个务实而高效的人。你有着出色的组织能力和执行力，能够把复杂的事情安排得井井有条。你重视规则和效率，是团队中把计划变为现实的关键力量。',
    keywords: ['执行力', '组织力', '务实', '高效率'],
    color: '#5A7A8A'
  },
  'ESFJ': {
    animal: { name: '企鹅', emoji: '🐧', image: animalImageBase + '企鹅' + '.png' },
    workplace: { name: '团建委员', description: '人际关系的粘合剂，让大家一起开心' },
    fantasy: { name: '和谐守护者', description: '维系世界和平的使者，让爱连接每个人' },
    analysis: '你是一个热心而友善的灵魂。你天生善于社交和照顾他人，总是主动营造和谐的氛围。你关心身边每个人的感受，是朋友圈中的暖心担当。你的真诚和热心让你拥有广泛的人缘。',
    keywords: ['热心肠', '社交能力', '善解人意', '团队精神'],
    color: '#C47A7A'
  },
  'ISTP': {
    animal: { name: '猎鹰', emoji: '🦅', image: animalImageBase + '猎鹰' + '.png' },
    workplace: { name: '极客独行侠', description: '冷静分析精准行动，一个人就是一支队伍' },
    fantasy: { name: '风暴锻造师', description: '以精密手艺打造神器，用冷静面对一切' },
    analysis: '你是一个冷静而精干的灵魂。你善于分析和解决实际问题，在危机中保持镇定。你享受动手操作的乐趣，有着出色的机械和空间感知能力。你独立自主，喜欢按自己的节奏行动。',
    keywords: ['冷静分析', '动手能力', '独立', '应变力'],
    color: '#6A8A6A'
  },
  'ISFP': {
    animal: { name: '熊猫', emoji: '🐼', image: animalImageBase + '熊猫' + '.png' },
    workplace: { name: '美学鉴赏家', description: '用作品说话的低调艺术家，品味满分' },
    fantasy: { name: '自然精灵', description: '与万物共生的森林守护者，感受自然之美' },
    analysis: '你是一个温柔而富有艺术感的灵魂。你对美有着敏锐的感知力，追求真实而和谐的生活方式。你温和、谦逊，不喜欢冲突，但你内心有着坚定的价值观。你的审美和创造力让你独具魅力。',
    keywords: ['审美天赋', '温和', '真实', '艺术感'],
    color: '#7AAE7A'
  },
  'ESTP': {
    animal: { name: '猎豹', emoji: '🐆', image: animalImageBase + '猎豹' + '.png' },
    workplace: { name: '行动派', description: '想到就做的实干家，快准狠解决问题' },
    fantasy: { name: '极速猎人', description: '速度与激情的化身，在冒险中征服一切' },
    analysis: '你是一个充满活力和行动力的灵魂。你享受当下的每一刻，善于把握机会快速行动。你的勇敢和果断让你在挑战面前无所畏惧，而你的幽默和魅力让你成为人群中的焦点。',
    keywords: ['行动力', '冒险精神', '应变力', '魅力'],
    color: '#D4894A'
  },
  'ESFP': {
    animal: { name: '水獭', emoji: '🦦', image: animalImageBase + '水獭' + '.png' },
    workplace: { name: '气氛组C位', description: '天生表演家，有你的地方就有欢乐' },
    fantasy: { name: '欢乐精灵', description: '传播快乐的使者，让笑声回荡在每一个角落' },
    analysis: '你是一个活泼而充满魅力的灵魂。你热爱生活，享受当下的每一刻快乐。你的热情和感染力让你成为人群中的焦点，而你慷慨友善的性格让你拥有很多朋友。你让周围的世界变得更加多彩。',
    keywords: ['活力四射', '乐观', '表演天赋', '感染力'],
    color: '#E88A6A'
  }
}

module.exports = {
  questions: questions,
  mbtiMap: mbtiMap
}
