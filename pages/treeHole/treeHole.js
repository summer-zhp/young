// pages/treeHole/treeHole.js
// 陪伴者倾诉页面 - 使用微信云开发 AI SDK 直接调用混元模型

// 系统提示词 - 定义"小树洞"角色
const systemPrompt = `你是一个温暖的陪伴者，名字叫"小树洞"。你的特点是：
1. 善于倾听：当用户倾诉烦恼时，给予理解和共情
2. 给予支持：用温暖、接纳的语言回应用户
3. 适度建议：只在适当时机给出简单实用的建议，不要说教
4. 避免标签：不要使用"AI"、"智能"、"机器人"、"模型"、"助手"等字眼
5. 语言风格：温和、真诚、简洁，像一位贴心的朋友

回应原则：
- 先共情，再回应
- 不评判、不说教
- 简短温暖，不要长篇大论
- 用"我"来称呼自己，像真人一样对话

安全边界：
- 如果用户提到自伤、自杀等危险内容，请温和地建议寻求专业帮助`;

Page({
  data: {
    inputValue: '',
    isLoading: false,
    scrollToView: '',
    messages: [],
    userAvatar: ''
  },

  // 消息 ID 计数器
  messageIdCounter: 0,

  onLoad() {
    // 页面加载时获取用户头像
    this.loadUserAvatar();

    // 页面加载时滚动到底部
    wx.nextTick(() => {
      this.scrollToBottom();
    });
  },

  // 加载用户头像
  loadUserAvatar() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.avatarUrl) {
        this.setData({
          userAvatar: userInfo.avatarUrl
        });
      }
    } catch (err) {
      console.error('加载用户头像失败:', err);
    }
  },

  onReady() {
    // 页面渲染完成
  },

  onUnload() {
    // 页面卸载
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 输入框内容变化
  onInput(e) {
    const value = e.detail.value;

    // 如果输入包含换行符，去掉换行符并发送消息
    if (value.includes('\n')) {
      this.setData({
        inputValue: value.replace(/\n/g, '')
      });
      this.sendMessage();
      return;
    }

    this.setData({
      inputValue: value
    });
  },

  // 发送消息
  async sendMessage() {
    const { inputValue, isLoading } = this.data;

    // 如果正在加载或输入为空，不处理
    if (isLoading || !inputValue.trim()) {
      return;
    }

    // 添加用户消息
    const userMessage = {
      id: ++this.messageIdCounter,
      role: 'user',
      content: inputValue.trim(),
      time: this.formatTime(new Date())
    };

    this.setData({
      messages: [...this.data.messages, userMessage],
      inputValue: '',
      isLoading: true
    });

    // 滚动到底部
    wx.nextTick(() => {
      this.scrollToBottom();
    });

    try {
      // 调用微信云开发 AI 模型
      const reply = await this.callAIModel(userMessage.content);

      // 添加机器人回复
      const botMessage = {
        id: ++this.messageIdCounter,
        role: 'bot',
        content: reply,
        time: this.formatTime(new Date())
      };

      this.setData({
        messages: [...this.data.messages, botMessage],
        isLoading: false
      });

    } catch (error) {
      console.error('Send message error:', error);

      // 错误时的兜底回复
      const errorMessage = {
        id: ++this.messageIdCounter,
        role: 'bot',
        content: '我现在有点累，等会再聊好吗？',
        time: this.formatTime(new Date())
      };

      this.setData({
        messages: [...this.data.messages, errorMessage],
        isLoading: false
      });
    }

    // 滚动到底部
    wx.nextTick(() => {
      this.scrollToBottom();
    });
  },

  // 调用微信云开发 AI 模型 - 使用 createModel 和 streamText 方法
  async callAIModel(message) {
    console.log('=== 开始调用 AI 模型 ===');
    console.log('message:', message);

    // 检查 AI 接口是否存在
    if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
      console.error('AI 接口不可用:', wx.cloud);
      throw new Error('AI 接口不可用');
    }

    try {
      // 创建模型实例 - 使用混元模型
      const model = wx.cloud.extend.AI.createModel("hunyuan-exp");

      // 调用 streamText 方法，传入 system prompt 和用户消息
      const res = await model.streamText({
        data: {
          model: "hunyuan-turbos-latest", // 使用混元 lite 版本
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
        },
      });

      console.log('AI 模型响应成功:', !!res);
      console.log('textStream:', res.textStream);

      // 收集流式返回的内容
      let fullContent = '';

      // 循环接收完整的响应文本
      for await (let str of res.textStream) {
        console.log('stream chunk:', str);
        fullContent += str;
      }

      console.log('最终回复内容:', fullContent);

      // 如果内容为空，返回默认回复
      if (!fullContent.trim()) {
        return '我在听，请继续说...';
      }

      return fullContent;

    } catch (error) {
      console.error('AI model call error:', error);
      throw error;
    }
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({
      scrollToView: 'bottomSpacer'
    });
  },

  // 格式化时间
  formatTime(date) {
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }
});