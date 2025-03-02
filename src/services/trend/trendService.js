const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

/**
 * Lấy danh sách token đang trending
 * @returns {Promise<string>} 
 */
async function getTrendingTokens() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/search/trending');
        const trendingCoins = response.data.coins.slice(0, 7);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🔥 Top Token Trending')
            .setTimestamp();

        trendingCoins.forEach((coin, index) => {
            const data = coin.item;
            embed.addFields({
                name: `${index + 1}. ${data.name} (${data.symbol.toUpperCase()})`,
                value: `Rank: #${data.market_cap_rank || 'N/A'}\n` +
                       `Score: ${data.score}\n` +
                       `Price BTC: ${data.price_btc.toFixed(10)}`
            });
        });

        return { embeds: [embed] };
    } catch (error) {
        console.error('Lỗi khi lấy trending tokens:', error);
        return 'Có lỗi xảy ra khi lấy thông tin trending. Vui lòng thử lại sau.';
    }
}

module.exports = {
    getTrendingTokens
};
