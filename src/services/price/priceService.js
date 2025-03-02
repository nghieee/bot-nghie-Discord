const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

/**
 * Lấy giá nhiều token cùng lúc
 * @param {string[]} tokens - Danh sách token (vd: ["btc", "eth", "sol"])
 * @returns {Promise<string>}
 */
async function getMultipleTokenPrices(tokens) {
    try {
        // Lấy danh sách ID từ CoinGecko
        const listResponse = await axios.get("https://api.coingecko.com/api/v3/coins/list");
        const tokenList = listResponse.data;

        // Chuyển ký hiệu/names thành ID
        const tokenIds = tokens.map(token => {
            const tokenData = tokenList.find(t => 
                t.id.toLowerCase() === token.toLowerCase() || 
                t.symbol.toLowerCase() === token.toLowerCase()
            );
            return tokenData ? tokenData.id : null;
        }).filter(id => id !== null);

        if (tokenIds.length === 0) {
            return "❌ Không tìm thấy token nào hợp lệ.";
        }

        // Gọi API để lấy giá
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(",")}&vs_currencies=usd`;
        const response = await axios.get(url);
        const prices = response.data;

        // Tạo phản hồi
        let result = "💰 **Giá Token:**\n";
        tokens.forEach(token => {
            const tokenData = tokenList.find(t => 
                t.id.toLowerCase() === token.toLowerCase() || 
                t.symbol.toLowerCase() === token.toLowerCase()
            );
            if (tokenData && prices[tokenData.id]) {
                result += `🔹 **${tokenData.symbol.toUpperCase()}**: $${prices[tokenData.id].usd}\n`;
            } else {
                result += `❌ Không tìm thấy giá cho **${token.toUpperCase()}**\n`;
            }
        });

        return result;
    } catch (error) {
        console.error(error);
        return "⚠️ Lỗi khi lấy dữ liệu giá.";
    }
}

async function getTokenPrice(tokens) {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: tokens.join(','),
                vs_currencies: 'usd',
                include_24hr_change: true,
                include_last_updated_at: true
            }
        });

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('💰 Giá Token')
            .setTimestamp();

        Object.entries(response.data).forEach(([id, data]) => {
            const price = data.usd;
            const change = data.usd_24h_change;
            const lastUpdated = new Date(data.last_updated_at * 1000);
            const changeText = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
            const emoji = change > 0 ? '📈' : '📉';

            embed.addFields({
                name: id.toUpperCase(),
                value: `💵 Giá: $${price.toLocaleString()}\n` +
                       `📊 24h: ${changeText} ${emoji}\n` +
                       `🕒 Cập nhật: ${lastUpdated.toLocaleString('vi-VN')}`
            });
        });

        return { embeds: [embed] };
    } catch (error) {
        console.error('Lỗi khi lấy giá token:', error);
        return 'Có lỗi xảy ra khi lấy giá token. Vui lòng thử lại sau.';
    }
}

module.exports = {
    getMultipleTokenPrices,
    getTokenPrice
};
