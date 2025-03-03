require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder, Partials } = require('discord.js');
const { VALID_TIMEFRAMES } = require('./src/utils/constants');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Import các service
const marketService = require('./src/services/market/marketService');
const newsService = require('./src/services/news/newsService'); 
const priceService = require('./src/services/price/priceService');
const roleService = require('./src/services/role/roleService');
const technicalService = require('./src/services/technical/technicalService');
const trendService = require('./src/services/trend/trendService');
const welcomeService = require('./src/services/welcome/welcomeService');

// Import các event handlers
const readyEvent = require('./src/events/ready');
const reactionEvent = require('./src/events/reaction');

// Khởi tạo bot với các intent cần thiết
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    presence: {
        activities: [{ name: '!help để xem hướng dẫn', type: 'WATCHING' }],
        status: 'online'
    }
});

// Biến để theo dõi trạng thái kết nối
let isReconnecting = false;
let lastHeartbeat = Date.now();

// Xử lý sự kiện mất kết nối
client.on('disconnect', () => {
    console.log('Bot đã bị ngắt kết nối!', new Date().toISOString());
    isReconnecting = true;
});

client.on('error', error => {
    console.error('Lỗi kết nối:', error, new Date().toISOString());
    isReconnecting = true;
});

// Tự động kết nối lại khi bị ngắt
client.on('shardError', error => {
    console.error('Lỗi WebSocket:', error, new Date().toISOString());
    isReconnecting = true;
});

client.on('shardReconnecting', () => {
    console.log('Đang kết nối lại...', new Date().toISOString());
    isReconnecting = true;
});

client.on('shardResume', () => {
    console.log('Đã kết nối lại thành công!', new Date().toISOString());
    isReconnecting = false;
    lastHeartbeat = Date.now();
});

// Đăng ký các event handler
client.on('ready', () => {
    console.log(`Đã đăng nhập thành công với tên ${client.user.tag}!`, new Date().toISOString());
    isReconnecting = false;
    lastHeartbeat = Date.now();
    readyEvent.execute(client);
});

client.on('messageReactionAdd', (reaction, user) => reactionEvent.execute(reaction, user));
client.on('messageReactionRemove', (reaction, user) => reactionEvent.reactionRemove.execute(reaction, user));

// Xử lý tin nhắn
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Kiểm tra prefix
    if (!message.content.startsWith('!')) return;

    try {
        switch (command) {
            case 'price':
                if (!args.length) {
                    return message.reply('⚠️ Vui lòng nhập mã token. Ví dụ: !price btc');
                }
                const priceResponse = await priceService.getTokenPrice(args);
                message.reply(priceResponse);
                break;

            case 'analysis':
                if (!args.length) {
                    return message.reply('⚠️ Vui lòng nhập mã token. Ví dụ: !analysis btc');
                }
                const tokenInfo = await technicalService.getTokenInfo(args[0]);
                const analysis = await technicalService.analyzeTechnicals(tokenInfo.symbol, tokenInfo.symbol);
                message.reply({ content: analysis.message, files: [analysis.attachment] });
                break;

            case 'top':
                const type = args[0] || 'gainers';
                if (!['gainers', 'losers', 'volume'].includes(type)) {
                    return message.reply('⚠️ Loại top không hợp lệ. Sử dụng: gainers, losers, hoặc volume');
                }
                const topResponse = await marketService.getTopTokens(type);
                message.reply(topResponse);
                break;

            case 'stats':
                if (!args.length) {
                    return message.reply('⚠️ Vui lòng nhập mã token. Ví dụ: !stats btc');
                }
                const statsResponse = await marketService.getTokenStats(args[0]);
                message.reply(statsResponse);
                break;

            case 'predict':
                if (!args.length) {
                    return message.reply('⚠️ Vui lòng nhập mã token. Ví dụ: !predict btc');
                }
                const tokenData = await technicalService.getTokenInfo(args[0]);
                const prediction = await technicalService.predictTrend(tokenData.symbol, tokenData.symbol);
                message.reply(prediction.message);
                break;

            case 'news':
                const query = args.join(' ');
                const newsResponse = await newsService.getCryptoNews(query);
                message.reply(newsResponse);
                break;

            case 'chart':
                if (args.length < 1) {
                    return message.reply('⚠️ Vui lòng nhập mã token. Ví dụ: !chart btc 1d');
                }
                const symbol = args[0];
                const timeframe = args[1] || '1d';

                if (!VALID_TIMEFRAMES.includes(timeframe)) {
                    return message.reply(`⚠️ Khung thời gian không hợp lệ. Sử dụng: ${VALID_TIMEFRAMES.join(', ')}`);
                }

                const chartData = await technicalService.getHistoricalData(symbol, timeframe);
                const chartBuffer = technicalService.createCustomChart(chartData, symbol.toUpperCase(), {
                    timeframe: timeframe,
                    showMA7: true,
                    showMA20: true,
                    showVolume: true
                });

                const chartAttachment = new AttachmentBuilder(chartBuffer, { name: 'chart.png' });
                message.reply({ files: [chartAttachment] });
                break;

            case 'trending':
                const trendingResponse = await trendService.getTrendingTokens();
                message.reply(trendingResponse);
                break;

            case 'mod':
                await roleService.assignModRole(message);
                break;

            default:
                message.reply('❌ Lệnh không hợp lệ!');
                break;
        }
    } catch (error) {
        console.error('Lỗi khi xử lý lệnh:', error);
        message.reply('❌ Có lỗi xảy ra khi xử lý lệnh. Vui lòng thử lại sau.');
    }
});

// Xử lý khi có thành viên mới
const WELCOME_CHANNEL_ID = '1345285119237296129';

client.on('guildMemberAdd', async member => {
    try {
        // Không làm gì cả, user sẽ chỉ thấy kênh rules
        console.log(`Thành viên mới: ${member.user.tag}`);
    } catch (error) {
        console.error('Lỗi khi xử lý thành viên mới:', error);
    }
});

// Khởi động web server
app.get('/', (req, res) => {
    const now = Date.now();
    const status = {
        bot: client.ws.status === 0 ? 'online' : 'offline',
        ping: client.ws.ping,
        uptime: client.uptime,
        serverCount: client.guilds.cache.size,
        lastHeartbeat: new Date(lastHeartbeat).toISOString(),
        timeSinceLastHeartbeat: now - lastHeartbeat,
        isReconnecting,
        memory: process.memoryUsage()
    };
    res.json(status);
});

// Endpoint để kiểm tra health
app.get('/health', (req, res) => {
    if (client.ws.status === 0 && !isReconnecting) {
        res.status(200).json({ status: 'healthy' });
    } else {
        res.status(503).json({ 
            status: 'unhealthy',
            wsStatus: client.ws.status,
            isReconnecting,
            lastHeartbeat: new Date(lastHeartbeat).toISOString()
        });
    }
});

const server = app.listen(port, () => {
    console.log(`Web server is running on port ${port}`, new Date().toISOString());
});

// Heartbeat để giữ kết nối
setInterval(() => {
    if (client.ws.status === 0) {
        lastHeartbeat = Date.now();
        console.log('Heartbeat OK:', new Date().toISOString());
    } else if (!isReconnecting) {
        console.log('Kết nối không ổn định, thử kết nối lại...', new Date().toISOString());
        login();
    }
}, 30000); // Kiểm tra mỗi 30 giây

// Xử lý khi process bị kill
process.on('SIGTERM', () => {
    console.log('Nhận tín hiệu SIGTERM, đang tắt bot...', new Date().toISOString());
    client.destroy();
    server.close();
});

// Hàm kết nối lại khi gặp lỗi
function login() {
    if (isReconnecting) return;
    
    isReconnecting = true;
    client.login(process.env.DISCORD_TOKEN).catch(error => {
        console.error('Lỗi đăng nhập:', error, new Date().toISOString());
        console.log('Thử kết nối lại sau 5 giây...', new Date().toISOString());
        setTimeout(() => {
            isReconnecting = false;
            login();
        }, 5000);
    });
}

// Bắt đầu kết nối
login();