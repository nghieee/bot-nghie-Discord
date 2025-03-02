const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

/**
 * Lấy tin tức crypto
 * @param {string} query - Từ khóa tìm kiếm (optional)
 * @param {number} limit - Số lượng tin tức
 * @returns {Promise<string>}
 */
async function getCryptoNews(query = '', limit = 5) {
    try {
        const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
            params: {
                auth_token: process.env.CRYPTOPANIC_API_KEY,
                currencies: 'BTC,ETH',
                filter: 'hot',
                public: true
            }
        });

        const news = response.data.results
            .filter(item => !query || item.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📰 Tin tức tiền điện tử mới nhất')
            .setTimestamp();

        news.forEach((item, index) => {
            embed.addFields({
                name: `${index + 1}. ${item.title}`,
                value: `🔗 [Đọc thêm](${item.url})\n📅 ${new Date(item.published_at).toLocaleString('vi-VN')}`
            });
        });

        return { embeds: [embed] };
    } catch (error) {
        console.error('Lỗi khi lấy tin tức:', error);
        return 'Có lỗi xảy ra khi lấy tin tức. Vui lòng thử lại sau.';
    }
}

module.exports = {
    getCryptoNews
}; 