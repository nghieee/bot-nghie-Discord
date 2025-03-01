require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Khởi tạo bot với quyền hạn cần thiết
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => {
    console.log(`✅ Bot đã hoạt động với tên ${client.user.tag}`);
});

// Tạo lệnh đơn giản
client.on('messageCreate', message => {
    if (message.content === '!hello') {
        message.reply(`Xin chào, ${message.author.username}! 👋`);
    }
});

// Đăng nhập bot với token
client.login(process.env.TOKEN);

//Welcome
const WELCOME_CHANNEL_ID = '1345285119237296129'; 

client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;
    
    channel.send(`🎉 Chào mừng ${member} đến với ** ${member.guild.name}**! Cảm ơn bạn đã tham gia! 🚀`);
});