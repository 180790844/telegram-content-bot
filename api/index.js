constconst { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8607525386:AAHDISsEKlGkUCOS1O9InFu2eOpVak-NOtY';

const bot = new Telegraf(BOT_TOKEN);

// ============ 存储 ============
const conversationHistory = new Map();
const userSettings = new Map();
const drafts = [];

// ============ 角色设定 ============
const BOT_PERSONA = {
  name: "内容运营小助手",
  personality: "幽默，科技、活泼、像朋友一样",
  style: "喜欢用emoji，语气轻松，偶尔俏皮",
  expertise: ["短视频运营", "社交媒体营销", "内容创作", "科技趋势"],
  greeting: "嘿！有什么想聊的吗？😊"
};

// ============ 智能回复系统 ============
const smartResponses = {
  greeting: [
    "嗨！👋 终于等到你了！有什么想聊的吗？",
    "嘿！😄 欢迎回来！今天想做什么内容？",
    "呀！🎉 你来啦！准备好了吗？",
    "你好呀！✨ 今天是内容满满的一天！"
  ],
  thanks: [
    "不客气！😊 有问题随时问我~",
    "客气啥！😎 咱们是谁跟谁啊~",
    "必须的！💪 帮你就是我的快乐！"
  ],
  yes: [
    "收到！👍 马上帮你处理~",
    "好嘞！✨ 开始行动！",
    "没问题！🚀 交给我吧！"
  ],
  no: [
    "好吧~ 😅 那你想聊什么？",
    "明白了！💡 换个话题？",
    "没关系！🎯 我们继续~"
  ],
  confused: [
    "emmm... 🤔 你想表达什么？",
    "我有点迷惑... 😅 能再说清楚点吗？",
    "嗯？❓ 展开说说？"
  ],
  default: [
    (name, topic) => `关于「${topic}」，我可以帮你生成超棒的内容创意！🎬 试试说「帮我写${topic}」~`,
    (name, topic) => `「${topic}」这个话题很棒！📝 要我帮你想几个爆款标题吗？`,
    (name, topic) => `聊聊「${topic}」？💡 我有个大胆的想法...`,
    (name, topic) => `说到「${topic}」，我刚好有几个绝妙的idea！✨ 发送「帮我写${topic}」看看？`,
    (name, topic) => `「${topic}」这个很火啊！🔥 想不想来点TikTok脚本？`
  ]
};

// ============ 内容生成器 ============
function getTrendingTopics() {
  return [
    { rank: 1, topic: '#AI人工智能', posts: '125K', trend: '↑12%', desc: 'ChatGPT、Claude 等 AI 工具热度持续上升' },
    { rank: 2, topic: '#短视频变现', posts: '98K', trend: '↑8%', desc: 'TikTok、小红书变现方法成热门' },
    { rank: 3, topic: '#科技数码', posts: '76K', trend: '↑15%', desc: '新手机、新电脑评测' },
    { rank: 4, topic: '#创业分享', posts: '54K', trend: '↑5%', desc: '个人创业经验、踩坑记录' },
    { rank: 5, topic: '#副业赚钱', posts: '43K', trend: '↑22%', desc: '兼职、被动收入分享' }
  ];
}

function generateIdeas(keyword) {
  const templates = [
    { type: '反常识', title: `${keyword}的真相：大多数人搞错了！`, desc: '揭露常见误区，提供正确认知' },
    { type: '教程', title: `3分钟学会${keyword}`, desc: '新手入门指南' },
    { type: '故事', title: `我靠${keyword}月入X万`, desc: '真实案例分享' },
    { type: '盘点', title: `${keyword}的5种玩法`, desc: '全面解析' },
    { type: '预测', title: `${keyword}的未来趋势`, desc: '发展方向分析' }
  ];
  return templates.map((t, i) => `${i + 1}. 【${t.type}】${t.title}\n   ${t.desc}`).join('\n\n');
}

function generateTweets(topic) {
  const cleanTopic = topic.replace('#', '');
  return [
    `🧵 关于${cleanTopic}，我研究了100+案例，发现了...（thread）\n\n#${cleanTopic} #干货`,
    `🔥 ${cleanTopic} 爆火！但很少有人告诉你... \n\n#${cleanTopic} #科技`,
    `💡 普通人如何抓住${cleanTopic}的红利？\n\n3个建议：\n1. 先行动\n2. 持续学习\n3. 找到圈子\n\n#${cleanTopic} #创业`
  ];
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============ 对话分析器 ============
function analyzeMessage(text) {
  const lowerText = text.toLowerCase();

  if (/^(你好|嗨|hey|hi|hello|哈喽|嘿)/.test(lowerText)) return { intent: 'greeting', confidence: 0.9 };
  if (/^(谢谢|感谢|thx|thanks)/.test(lowerText)) return { intent: 'thanks', confidence: 0.9 };
  if (/^(好|可以|行|OK|ok|收到|明白)/.test(lowerText)) return { intent: 'yes', confidence: 0.8 };
  if (/^(不|算了|不要)/.test(lowerText)) return { intent: 'no', confidence: 0.7 };
  if (text.includes('热点') || text.includes('热门') || text.includes('趋势')) return { intent: 'trending', confidence: 0.95 };
  if (text.includes('帮我写') || text.includes('生成') || text.includes('脚本')) return { intent: 'generate', confidence: 0.95 };
  if (text.includes('推文')) return { intent: 'tweet', confidence: 0.9 };
  if (text.includes('草稿')) return { intent: 'drafts', confidence: 0.9 };
  if (text.includes('风格') || text.includes('设置')) return { intent: 'settings', confidence: 0.9 };
  if (text.includes('帮助') || text === '/help') return { intent: 'help', confidence: 0.95 };

  return { intent: 'chat', confidence: 0.5, topic: text };
}

function generateSmartResponse(intent, topic, userName) {
  const responses = smartResponses[intent];
  if (!responses) {
    const defaultResponses = smartResponses.default;
    const generator = getRandomItem(defaultResponses);
    return typeof generator === 'function' ? generator(userName, topic) : generator;
  }
  return getRandomItem(responses);
}

function addToHistory(userId, role, content) {
  if (!conversationHistory.has(userId)) conversationHistory.set(userId, []);
  const history = conversationHistory.get(userId);
  history.push({ role, content, timestamp: Date.now() });
  if (history.length > 20) history.shift();
}

// ============ Bot 命令 ============
bot.start(async (ctx) => {
  const name = ctx.from.first_name || '朋友';
  const userId = ctx.from.id;

  if (!userSettings.has(userId)) {
    userSettings.set(userId, { style: '幽默科技风', emoji: true, conversationMode: 'friend' });
  }

  addToHistory(userId, 'system', 'Conversation started');

  await ctx.reply(
    `👋 你好 ${name}！我是你的内容运营小助手！🎉\n\n${BOT_PERSONA.greeting}\n\n我能帮你：\n\n📊 每日热点 - 获取热门话题\n🎬 生成脚本 - TikTok/短视频脚本\n✍️ 推文生成 - X/Twitter推文\n📋 草稿管理 - 查看和确认内容\n⚙️ 个性设置 - 调整对话风格\n\n💬 直接聊天也行，我会尽量帮你！\n\n试试说「帮我写AI创业」或者随便聊~`
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    `📖 <b>功能指南</b>\n\n<b>📊 热点</b>\n发送「热点」或「热门」获取今日热门\n\n<b>🎬 内容生成</b>\n• 帮我写+关键词 → TikTok脚本\n• 推文+关键词 → Twitter推文\n• 创意+关键词 → 内容灵感\n\n<b>📋 管理</b>\n• 草稿 → 查看待审核\n• 确认 → 确认发布\n• 不要 → 清空草稿\n\n<b>💬 聊天</b>\n直接发消息，我们可以随便聊~`,
    { parse_mode: 'HTML' }
  );
});

bot.on('callback_query', async (ctx) => {
  const query = ctx.callbackQuery.data;
  await ctx.answerCbQuery();

  if (query === 'trending') {
    const topics = getTrendingTopics();
    let msg = '🔥 <b>今日热门话题</b>\n\n';
    topics.forEach(t => { msg += `${t.rank}. <b>${t.topic}</b>\n   📊 ${t.posts} posts | ${t.trend}\n\n`; });
    await ctx.editMessageText(msg);
  }
  if (query === 'generate') {
    await ctx.editMessageText('🎬 想说点啥？\n\n比如：「帮我写AI创业」');
  }
  if (query === 'chat') {
    await ctx.editMessageText('💬 随便聊~ 想聊什么？\n\n我可是个有趣的灵魂！😄');
  }
});

bot.on('message', async (ctx) => {
  const text = ctx.message?.text || '';
  const userId = ctx.from?.id;
  const userName = ctx.from?.first_name || '朋友';

  if (!text || !userId) return;

  if (!userSettings.has(userId)) {
    userSettings.set(userId, { style: '幽默科技风', emoji: true, conversationMode: 'friend' });
  }

  const analysis = analyzeMessage(text);
  addToHistory(userId, 'user', text);

  try {
    switch (analysis.intent) {
      case 'greeting':
        await ctx.reply(getRandomItem(smartResponses.greeting)); break;
      case 'thanks':
        await ctx.reply(getRandomItem(smartResponses.thanks)); break;
      case 'yes':
        await ctx.reply(getRandomItem(smartResponses.yes)); break;
      case 'no':
        await ctx.reply(getRandomItem(smartResponses.no)); break;
      case 'trending':
        const topics = getTrendingTopics();
        let msg = `🔥 <b>今日热点 Top 5</b>\n\n`;
        topics.forEach(t => { msg += `${t.rank}. <b>${t.topic}</b>\n   📊 ${t.posts} posts | ${t.trend}\n\n`; });
        await ctx.reply(msg, { parse_mode: 'HTML' });
        const tweets = generateTweets(topics[0].topic);
        let tweetMsg = `✍️ <b>推文草稿</b>\n\n`;
        tweets.forEach((t, i) => { tweetMsg += `${i + 1}. ${t}\n\n`; });
        await ctx.reply(tweetMsg, { parse_mode: 'HTML' });
        break;
      case 'generate':
        const keyword = text.replace(/帮我写|生成|脚本/gi, '').trim() || '科技';
        await ctx.reply(`🎬 正在为「${keyword}」生成内容...\n⏳ 稍等！`);
        const ideas = generateIdeas(keyword);
        let genMsg = `✅ <b>生成完成！</b>\n\n📌 关键词：${keyword}\n\n<b>5个内容创意：</b>\n\n${ideas}\n\n🏷️ 建议标签：#${keyword.replace(/[^a-zA-Z0-9]/g, '')} #干货 #分享`;
        drafts.push({ id: Date.now(), keyword, ideas, status: 'pending', created: new Date().toISOString() });
        await ctx.reply(genMsg, { parse_mode: 'HTML' });
        break;
      case 'tweet':
        const tweetTopic = text.replace(/推文|tweet|twitter/gi, '').trim() || '科技';
        const tweetContent = generateTweets(tweetTopic);
        let tweetResult = `✍️ <b>关于「${tweetTopic}」的推文</b>\n\n`;
        tweetContent.forEach((t, i) => { tweetResult += `${i + 1}. ${t}\n\n`; });
        await ctx.reply(tweetResult, { parse_mode: 'HTML' });
        break;
      case 'drafts':
        if (drafts.length === 0) {
          await ctx.reply('📋 暂无待审核内容\n\n发送「帮我写+关键词」生成内容！');
        } else {
          let draftMsg = `📋 <b>待审核内容</b> (${drafts.length}条)\n\n`;
          drafts.forEach((d, i) => { draftMsg += `${i + 1}. <b>${d.keyword}</b> - ${d.status}\n`; });
          await ctx.reply(draftMsg, { parse_mode: 'HTML' });
        }
        break;
      case 'settings':
        const style = text.replace(/风格|设置/gi, '').trim();
        if (style) {
          userSettings.get(userId).style = style;
          await ctx.reply(`✅ 风格已更新！\n\n记住你的偏好：${style}\n\n以后用这个风格跟你聊~ 😄`);
        } else {
          await ctx.reply(`⚙️ 当前风格：${userSettings.get(userId).style}\n\n发送「风格+描述」修改`);
        }
        break;
      case 'chat':
      default:
        const response = generateSmartResponse(analysis.intent, analysis.topic, userName);
        await ctx.reply(response);
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    await ctx.reply(getRandomItem(smartResponses.confused));
  }

  addToHistory(userId, 'assistant', 'Response sent');
});

// Vercel handler
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).json({ ok: true });
    } else {
      res.status(200).json({ status: 'Bot running!', version: '2.0', features: ['智能对话', '热点', '脚本生成', '草稿管理'] });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(200).json({ ok: true });
  }
};
  }
};
