require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Khởi tạo bot với quyền hạn cần thiết
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
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
