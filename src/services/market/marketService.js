const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const moment = require('moment');
const { formatCurrency, formatPercentage, formatNumber } = require('../../utils/utils');

/**
 * Lấy danh sách top tokens
 * @param {string} type - Loại top: 'gainers', 'losers', 'volume'
 * @param {number} limit - Số lượng token muốn lấy
 * @returns {Promise<string>}
 */
async function getTopTokens(type = 'gainers', limit = 5) {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: type === 'volume' ? 'volume_desc' : 'price_change_24h_desc',
                per_page: type === 'gainers' ? limit : 100,
                page: 1,
                sparkline: false
            }
        });

        let tokens = response.data;
        
        if (type === 'losers') {
            tokens.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
            tokens = tokens.slice(0, limit);
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Top ${limit} ${type.charAt(0).toUpperCase() + type.slice(1)}`)
            .setTimestamp();

        tokens.forEach((token, index) => {
            const change = token.price_change_percentage_24h;
            const changeText = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
            const emoji = change > 0 ? '📈' : '📉';

            let fieldValue = `Giá: $${token.current_price.toLocaleString()}\n`;
            fieldValue += `Thay đổi 24h: ${changeText} ${emoji}\n`;
            
            if (type === 'volume') {
                fieldValue += `Volume 24h: $${token.total_volume.toLocaleString()}`;
            }

            embed.addFields({
                name: `${index + 1}. ${token.name} (${token.symbol.toUpperCase()})`,
                value: fieldValue
            });
        });

        return { content: '', embeds: [embed] };
    } catch (error) {
        console.error('Lỗi khi lấy top tokens:', error);
        return 'Có lỗi xảy ra khi lấy thông tin top tokens. Vui lòng thử lại sau.';
    }
}

/**
 * Lấy thống kê chi tiết của token
 * @param {string} tokenId - ID của token
 * @returns {Promise<string>}
 */
async function getTokenStats(tokenId) {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${tokenId}`);
        const data = response.data;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${data.name} (${data.symbol.toUpperCase()}) Stats`)
            .setThumbnail(data.image.large)
            .addFields(
                { 
                    name: '💰 Giá',
                    value: `$${data.market_data.current_price.usd.toLocaleString()}`
                },
                { 
                    name: '📊 Thay đổi giá',
                    value: `24h: ${data.market_data.price_change_percentage_24h.toFixed(2)}%\n` +
                           `7d: ${data.market_data.price_change_percentage_7d.toFixed(2)}%\n` +
                           `30d: ${data.market_data.price_change_percentage_30d.toFixed(2)}%`
                },
                { 
                    name: '📈 Market Cap',
                    value: `$${data.market_data.market_cap.usd.toLocaleString()}\n` +
                           `Rank: #${data.market_cap_rank}`
                },
                { 
                    name: '💹 Volume',
                    value: `$${data.market_data.total_volume.usd.toLocaleString()}`
                },
                {
                    name: '🔄 Supply',
                    value: `Circulating: ${data.market_data.circulating_supply.toLocaleString()}\n` +
                           `Total: ${data.market_data.total_supply ? data.market_data.total_supply.toLocaleString() : 'N/A'}\n` +
                           `Max: ${data.market_data.max_supply ? data.market_data.max_supply.toLocaleString() : 'N/A'}`
                }
            )
            .setTimestamp();

        return { embeds: [embed] };
    } catch (error) {
        console.error('Lỗi khi lấy thống kê token:', error);
        return 'Có lỗi xảy ra khi lấy thống kê token. Vui lòng thử lại sau.';
    }
}

module.exports = {
    getTopTokens,
    getTokenStats
}; 