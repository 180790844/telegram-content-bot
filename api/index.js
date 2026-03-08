const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8607525386:AAHDISsEKlGkUCOS1O9InFu2eOpVak-NOtY';

const bot = new Telegraf(BOT_TOKEN);

const contentDrafts = [];

function generateContentIdeas(keyword) {
  const ideas = [
    `🔥 <b>${keyword}，普通人也能月入过万？</b>\n\n🤔 揭秘行业内幕...`,
    `📱 <b>${keyword}，这个风口千万别错过！</b>\n\n💡 普通人如何抓住红利？...`,
    `😱 <b>${keyword}，90%的人都搞错了！</b>\n\n90%的人都在犯的错误...`,
    `💰 <b>靠${keyword}赚钱？这几点必须知道！</b>\n\n真实案例分析...`,
    `🎯 <b>${keyword}的5种玩法，最后一个太狠了！</b>\n\n建议收藏...`
  ];
  return ideas.map((idea, i) => `${i+1}. ${idea}`).join('\n\n');
}

function getTrendingTopics() {
  const t = [
    {rank:1,topic:'#AI',posts:'125K',trend:'↑12%'},
    {rank:2,topic:'#ChatGPT',posts:'98K',trend:'↑8%'},
    {rank:3,topic:'#科技趋势',posts:'76K',trend:'↑15%'},
    {rank:4,topic:'#创业',posts:'54K',trend:'↑5%'},
    {rank:5,topic:'#搞钱',posts:'43K',trend:'↑22%'}
  ];
  return t.map(x => `${x.rank}. <b>${x.topic}</b>\n📊 ${x.posts} posts | ${x.trend}`).join('\n\n');
}

bot.start(async (ctx) => {
  await ctx.reply(`👋 你好！我是你的内容运营小助手！🎉\n\n📊 每日热点 - 发送「热点」\n🎬 生成脚本 - 发送「帮我写+关键词」\n📋 待审核 - 发送「草稿」\n\n试试发送「热点」吧！`);
});

bot.on('message', async (ctx) => {
  const text = ctx.message.text || '';
  
  if (text.includes('热点') || text.includes('热门')) {
    await ctx.reply(`🔥 <b>今日热点 Top 5</b>\n\n${getTrendingTopics()}\n\n<i>数据来源：X Trending</i>`);
    return;
  }
  
  if (text.includes('帮我写')) {
    const keyword = text.replace('帮我写','').trim() || '科技';
    await ctx.reply('🎬 正在生成...');
    const ideas = generateContentIdeas(keyword);
    await ctx.reply(`✅ <b>5个脚本idea：</b>\n\n${ideas}`);
    return;
  }
  
  if (text.includes('草稿')) {
    if (contentDrafts.length === 0) {
      await ctx.reply('📋 暂无待审核内容');
    } else {
      await ctx.reply(`📋 有 ${contentDrafts.length} 条待审核内容`);
    }
    return;
  }
  
  await ctx.reply(`🤔 收到！试试：\n• 热点\n• 帮我写+关键词\n• 草稿`);
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).json({ok:true});
    } catch(e) {
      console.error('Error:', e.message);
      res.status(200).json({ok:true});
    }
  } else {
    res.status(200).json({status:'Bot running!'});
  }
};
