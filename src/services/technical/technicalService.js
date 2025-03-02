const axios = require('axios');
const { RSI, SMA, MACD, BollingerBands } = require('technicalindicators');
const { createCanvas } = require('canvas');
const { AttachmentBuilder, Events, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const { formatCurrency, formatPercentage } = require('../../utils/utils');

// Thêm API key của CoinGecko
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const headers = {
    'x-cg-demo-api-key': COINGECKO_API_KEY
};

/**
 * Lấy thông tin chi tiết của token từ Binance
 * @param {string} symbol - Symbol của token
 * @returns {Promise<Object>}
 */
async function getTokenDetails(symbol) {
    try {
        const binanceSymbol = `${symbol}USDT`;
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
            params: {
                symbol: binanceSymbol
            }
        });

        if (!response.data) {
            throw new Error(`Không tìm thấy thông tin cho token ${symbol}`);
        }

        const data = response.data;
        return {
            currentPrice: parseFloat(data.lastPrice),
            priceChange24h: parseFloat(data.priceChangePercent),
            volume24h: parseFloat(data.volume) * parseFloat(data.lastPrice),
            high24h: parseFloat(data.highPrice),
            low24h: parseFloat(data.lowPrice)
        };
    } catch (error) {
        console.error('Lỗi khi lấy thông tin token:', error);
        if (error.response?.status === 400) {
            throw new Error(`Token ${symbol} không được hỗ trợ trên Binance`);
        }
        throw error;
    }
}

/**
 * Lấy thông tin token từ Binance
 * @param {string} query - Tên token hoặc symbol
 * @returns {Promise<Object>}
 */
async function getTokenInfo(query) {
    try {
        // Chuẩn hóa query
        const symbol = query.toUpperCase().trim();
        const binanceSymbol = `${symbol}USDT`;

        // Kiểm tra xem token có tồn tại trên Binance không
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
            params: {
                symbol: binanceSymbol
            }
        });

        if (!response.data) {
            throw new Error(`Không tìm thấy token "${symbol}" trên Binance`);
        }

        return {
            symbol: symbol,
            binanceSymbol: binanceSymbol
        };
    } catch (error) {
        console.error('Lỗi khi lấy thông tin token:', error);
        if (error.response?.status === 400) {
            throw new Error(`Token "${query}" không được hỗ trợ trên Binance`);
        }
        throw error;
    }
}

/**
 * Lấy dữ liệu lịch sử từ Binance API
 * @param {string} symbol - Symbol của token (ví dụ: BTC, ETH)
 * @param {string} timeframe - Khung thời gian (1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M)
 * @returns {Promise<Object>}
 */
async function getHistoricalData(symbol, timeframe = '1d') {
    try {
        // Chuyển đổi symbol sang định dạng của Binance
        const binanceSymbol = `${symbol.toUpperCase()}USDT`;
        
        // Map timeframe sang định dạng của Binance
        const intervalMap = {
            '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
            '1h': '1h', '2h': '2h', '4h': '4h', '6h': '6h', '8h': '8h', '12h': '12h',
            '1d': '1d', '3d': '3d', '1w': '1w', '1M': '1M'
        };

        const interval = intervalMap[timeframe] || '1d';
        
        // Tính thời gian bắt đầu dựa vào timeframe
        const now = Date.now();
        const limitMap = {
            '1m': 24 * 60 * 60 * 1000, // 1 ngày
            '3m': 24 * 60 * 60 * 1000,
            '5m': 24 * 60 * 60 * 1000,
            '15m': 24 * 60 * 60 * 1000,
            '30m': 24 * 60 * 60 * 1000,
            '1h': 7 * 24 * 60 * 60 * 1000, // 7 ngày
            '2h': 7 * 24 * 60 * 60 * 1000,
            '4h': 14 * 24 * 60 * 60 * 1000,
            '6h': 14 * 24 * 60 * 60 * 1000,
            '8h': 14 * 24 * 60 * 60 * 1000,
            '12h': 14 * 24 * 60 * 60 * 1000,
            '1d': 30 * 24 * 60 * 60 * 1000, // 30 ngày
            '3d': 90 * 24 * 60 * 60 * 1000,
            '1w': 180 * 24 * 60 * 60 * 1000,
            '1M': 365 * 24 * 60 * 60 * 1000 // 1 năm
        };

        const startTime = now - (limitMap[timeframe] || 30 * 24 * 60 * 60 * 1000);

        const response = await axios.get('https://api.binance.com/api/v3/klines', {
            params: {
                symbol: binanceSymbol,
                interval: interval,
                startTime: startTime,
                limit: 500
            }
        });

        if (!response.data || response.data.length === 0) {
            throw new Error('Không có dữ liệu cho cặp giao dịch này');
        }

        // Chuyển đổi dữ liệu từ định dạng của Binance
        const data = response.data.map(d => ({
            timestamp: parseInt(d[0]),
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5])
        }));

        if (data.length < 10) {
            throw new Error('Không đủ dữ liệu để vẽ biểu đồ');
        }

        return {
            data: data,
            timeframe: timeframe,
            symbol: symbol
        };
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu lịch sử:', error);
        if (error.response?.status === 400) {
            throw new Error(`Token ${symbol} không được hỗ trợ trên Binance`);
        }
        throw error;
    }
}

/**
 * Tính toán RSI
 * @param {Array} prices - Mảng giá
 * @returns {number}
 */
function calculateRSI(prices) {
    try {
        const rsi = new RSI({
            values: prices,
            period: 14
        });
        const rsiValues = rsi.getResult();
        return rsiValues[rsiValues.length - 1];
    } catch (error) {
        console.error('Lỗi khi tính RSI:', error);
        return null;
    }
}

/**
 * Tính MA (Moving Average)
 * @param {Array} prices - Mảng giá
 * @param {number} period - Chu kỳ MA
 * @returns {Array}
 */
function calculateMA(prices, period) {
    try {
        const sma = new SMA({ period: period, values: prices });
        return sma.getResult();
    } catch (error) {
        console.error(`Lỗi khi tính MA${period}:`, error);
        return [];
    }
}

/**
 * Tạo biểu đồ với các tùy chọn
 * @param {Object} historicalData - Dữ liệu lịch sử
 * @param {string} tokenSymbol - Ký hiệu token
 * @param {Object} options - Các tùy chọn biểu đồ
 * @returns {Buffer}
 */
function createCustomChart(historicalData, tokenSymbol, options = {}) {
    const {
        showMA7 = true,
        showMA20 = false,
        showMA50 = false,
        showBB = false,
        showVolume = false,
        timeframe = '1d'
    } = options;

    try {
        const width = 800;
        const height = showVolume ? 500 : 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Vẽ nền
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Lấy dữ liệu giá và volume
        const prices = historicalData.data.map(d => d.close);
        const volumes = historicalData.data.map(d => d.volume);
        const timestamps = historicalData.data.map(d => d.timestamp);

        // Tính các chỉ báo
        const ma7 = showMA7 ? calculateMA(prices, 7) : [];
        const ma20 = showMA20 ? calculateMA(prices, 20) : [];
        const ma50 = showMA50 ? calculateMA(prices, 50) : [];
        const bb = showBB ? BollingerBands.calculate({
            period: 20,
            values: prices,
            stdDev: 2
        }) : [];

        // Vẽ biểu đồ
        drawChart(ctx, {
            width,
            height,
            prices,
            volumes,
            timestamps,
            ma7,
            ma20,
            ma50,
            bb,
            showVolume,
            tokenSymbol,
            timeframe
        });

        return canvas.toBuffer();
    } catch (error) {
        console.error('Lỗi khi tạo biểu đồ:', error);
        throw error;
    }
}

/**
 * Vẽ biểu đồ
 * @param {CanvasRenderingContext2D} ctx - Context của canvas
 * @param {Object} params - Các tham số vẽ biểu đồ
 */
function drawChart(ctx, params) {
    const {
        width,
        height,
        prices,
        volumes,
        timestamps,
        ma7,
        ma20,
        ma50,
        bb,
        showVolume,
        tokenSymbol,
        timeframe
    } = params;

    // Thiết lập margin
    const margin = { top: 40, right: 50, bottom: showVolume ? 100 : 40, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Vẽ tiêu đề
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(`${tokenSymbol}/USDT (${timeframe.toUpperCase()})`, width / 2, margin.top / 2);

    // Tính giá trị min/max
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Thêm padding
    const paddingFactor = 0.05;
    const adjustedMinPrice = minPrice - (priceRange * paddingFactor);
    const adjustedMaxPrice = maxPrice + (priceRange * paddingFactor);
    const adjustedPriceRange = adjustedMaxPrice - adjustedMinPrice;

    // Vẽ đường giá
    drawPriceLine(ctx, prices, timestamps, {
        margin,
        chartWidth,
        chartHeight,
        minPrice: adjustedMinPrice,
        maxPrice: adjustedMaxPrice
    });

    // Vẽ các đường MA
    if (ma7.length) drawMA(ctx, ma7, timestamps, '#FF6B6B', 'MA7', params);
    if (ma20.length) drawMA(ctx, ma20, timestamps, '#FF9800', 'MA20', params);
    if (ma50.length) drawMA(ctx, ma50, timestamps, '#2196F3', 'MA50', params);

    // Vẽ Bollinger Bands
    if (bb.length) drawBB(ctx, bb, timestamps, params);

    // Vẽ volume
    if (showVolume) drawVolume(ctx, volumes, timestamps, params);

    // Vẽ trục thời gian
    drawTimeAxis(ctx, timestamps, timeframe, params);
}

/**
 * Vẽ đường giá
 */
function drawPriceLine(ctx, prices, timestamps, params) {
    const { margin, chartWidth, chartHeight, minPrice, maxPrice } = params;
    const priceRange = maxPrice - minPrice;

    ctx.beginPath();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;

    prices.forEach((price, i) => {
        const x = margin.left + (chartWidth * i) / (prices.length - 1);
        const y = margin.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();
}

/**
 * Vẽ đường MA
 */
function drawMA(ctx, maValues, timestamps, color, label, params) {
    const { margin, chartWidth, chartHeight, minPrice, maxPrice } = params;
    const priceRange = maxPrice - minPrice;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    maValues.forEach((value, i) => {
        if (value !== undefined) {
            const x = margin.left + (chartWidth * i) / (timestamps.length - 1);
            const y = margin.top + chartHeight - ((value - minPrice) / priceRange) * chartHeight;
            if (i === 0 || maValues[i-1] === undefined) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
    });

    ctx.stroke();

    // Thêm vào chú thích
    const legendY = params.height - margin.bottom / 2 + 10;
    const lastLegendX = findLastLegendX(ctx, margin.left);
    
    ctx.beginPath();
    ctx.moveTo(lastLegendX, legendY);
    ctx.lineTo(lastLegendX + 20, legendY);
    ctx.strokeStyle = color;
    ctx.stroke();
    
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText(label, lastLegendX + 25, legendY + 4);
}

/**
 * Vẽ Bollinger Bands
 */
function drawBB(ctx, bb, timestamps, params) {
    const { margin, chartWidth, chartHeight, minPrice, maxPrice } = params;
    const priceRange = maxPrice - minPrice;

    // Vẽ dải trên
    ctx.beginPath();
    ctx.strokeStyle = '#9C27B0';
    ctx.lineWidth = 1;
    bb.forEach((band, i) => {
        const x = margin.left + (chartWidth * i) / (timestamps.length - 1);
        const y = margin.top + chartHeight - ((band.upper - minPrice) / priceRange) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Vẽ dải giữa
    ctx.beginPath();
    ctx.strokeStyle = '#7B1FA2';
    bb.forEach((band, i) => {
        const x = margin.left + (chartWidth * i) / (timestamps.length - 1);
        const y = margin.top + chartHeight - ((band.middle - minPrice) / priceRange) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Vẽ dải dưới
    ctx.beginPath();
    ctx.strokeStyle = '#9C27B0';
    bb.forEach((band, i) => {
        const x = margin.left + (chartWidth * i) / (timestamps.length - 1);
        const y = margin.top + chartHeight - ((band.lower - minPrice) / priceRange) * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

/**
 * Vẽ volume
 */
function drawVolume(ctx, volumes, timestamps, params) {
    const { margin, chartWidth } = params;
    const volumeHeight = 60;
    const maxVolume = Math.max(...volumes);

    volumes.forEach((volume, i) => {
        const x = margin.left + (chartWidth * i) / (volumes.length - 1);
        const height = (volume / maxVolume) * volumeHeight;
        const y = params.height - margin.bottom;

        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(x - 1, y, 2, -height);
    });

    // Thêm nhãn volume
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.fillText('Volume', margin.left - 10, params.height - margin.bottom + 15);
    ctx.fillText(formatCurrency(maxVolume), margin.left - 10, params.height - margin.bottom - volumeHeight + 10);
}

/**
 * Vẽ trục thời gian
 */
function drawTimeAxis(ctx, timestamps, timeframe, params) {
    const { margin } = params;
    const xLabels = [
        timestamps[0],
        timestamps[Math.floor(timestamps.length / 2)],
        timestamps[timestamps.length - 1]
    ];

    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333';
    xLabels.forEach((timestamp, i) => {
        const x = margin.left + ((params.width - margin.left - margin.right) * i) / 2;
        let dateFormat = 'DD/MM HH:mm';
        if (['1d', '3d', '1w', '1M'].includes(timeframe)) {
            dateFormat = 'DD/MM/YYYY';
        }
        const date = moment(timestamp).format(dateFormat);
        ctx.fillText(date, x, params.height - margin.bottom / 2);
    });
}

/**
 * Tìm vị trí x cuối cùng của chú thích
 */
function findLastLegendX(ctx, startX) {
    return startX + 160;
}

/**
 * Phân tích kỹ thuật
 * @param {string} tokenId - ID của token
 * @param {string} tokenSymbol - Ký hiệu token
 * @returns {Promise<Object>}
 */
async function analyzeTechnicals(tokenId, tokenSymbol) {
    try {
        const [historicalData, tokenDetails] = await Promise.all([
            getHistoricalData(tokenId),
            getTokenDetails(tokenId)
        ]);

        const prices = historicalData.data.map(d => d.close);
        const rsi = calculateRSI(prices);
        
        // Tạo biểu đồ
        const chartBuffer = createCustomChart(historicalData, tokenSymbol, {
            showMA7: true,
            showMA20: true,
            showVolume: true
        });
        
        const chartAttachment = new AttachmentBuilder(chartBuffer, { name: 'price-chart.png' });
        
        // Tính giá cao nhất và thấp nhất
        const high14d = Math.max(...prices);
        const low14d = Math.min(...prices);
        
        let analysis = `📊 **Phân tích kỹ thuật cho ${tokenSymbol}**\n\n`;
        analysis += `💰 **Giá hiện tại:** ${formatCurrency(tokenDetails.currentPrice)} (${formatPercentage(tokenDetails.priceChange24h)} / 24h)\n`;
        analysis += `📊 **Volume 24h:** ${formatCurrency(tokenDetails.volume24h)}\n`;
        analysis += `📈 **Cao nhất 14 ngày:** ${formatCurrency(high14d)}\n`;
        analysis += `📉 **Thấp nhất 14 ngày:** ${formatCurrency(low14d)}\n`;
        
        if (rsi !== null) {
            analysis += `🔸 **RSI (14):** ${rsi.toFixed(2)}\n`;
            analysis += `${getRSIInterpretation(rsi)}\n\n`;
        }
        
        analysis += `📈 Biểu đồ giá 14 ngày với MA7 và MA20 được đính kèm bên dưới.`;

        return {
            message: analysis,
            attachment: chartAttachment
        };
    } catch (error) {
        console.error('Lỗi khi phân tích kỹ thuật:', error);
        throw error;
    }
}

/**
 * Diễn giải chỉ số RSI
 * @param {number} rsi
 * @returns {string}
 */
function getRSIInterpretation(rsi) {
    if (rsi >= 70) {
        return "⚠️ Token đang trong vùng **OVERBOUGHT** (quá mua). Có thể sẽ điều chỉnh giảm.";
    } else if (rsi <= 30) {
        return "⚠️ Token đang trong vùng **OVERSOLD** (quá bán). Có thể sẽ phục hồi.";
    } else {
        return "✅ RSI đang ở mức trung tính.";
    }
}

/**
 * Phân tích xu hướng
 * @param {string} tokenId - ID của token
 * @param {string} tokenSymbol - Ký hiệu token
 * @returns {Promise<Object>}
 */
async function predictTrend(tokenId, tokenSymbol) {
    try {
        const historicalData = await getHistoricalData(tokenId);
        const prices = historicalData.data.map(d => d.close);
        
        // Tính các chỉ báo
        const ma20 = calculateMA(prices, 20);
        const ma50 = calculateMA(prices, 50);
        const macd = MACD.calculate({
            values: prices,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });
        const bb = BollingerBands.calculate({
            period: 20,
            values: prices,
            stdDev: 2
        });

        // Phân tích xu hướng
        const currentPrice = prices[prices.length - 1];
        const lastMA20 = ma20[ma20.length - 1];
        const lastMA50 = ma50[ma50.length - 1];
        const lastMACD = macd[macd.length - 1];
        const lastBB = bb[bb.length - 1];

        // Xác định xu hướng
        let trend = "Trung lập";
        let strength = "Yếu";
        let signals = [];

        // Phân tích MA
        if (currentPrice > lastMA20 && lastMA20 > lastMA50) {
            trend = "Tăng";
            signals.push("Giá trên MA20 và MA50");
        } else if (currentPrice < lastMA20 && lastMA20 < lastMA50) {
            trend = "Giảm";
            signals.push("Giá dưới MA20 và MA50");
        }

        // Phân tích MACD
        if (lastMACD.MACD > lastMACD.signal) {
            signals.push("MACD cho tín hiệu mua");
            if (trend === "Tăng") strength = "Mạnh";
        } else if (lastMACD.MACD < lastMACD.signal) {
            signals.push("MACD cho tín hiệu bán");
            if (trend === "Giảm") strength = "Mạnh";
        }

        // Phân tích Bollinger Bands
        if (currentPrice > lastBB.upper) {
            signals.push("Giá vượt dải trên Bollinger - Có thể quá mua");
        } else if (currentPrice < lastBB.lower) {
            signals.push("Giá dưới dải dưới Bollinger - Có thể quá bán");
        }

        let prediction = `🔮 **Dự đoán xu hướng cho ${tokenSymbol}**\n\n`;
        prediction += `📈 **Xu hướng:** ${trend}\n`;
        prediction += `💪 **Độ mạnh:** ${strength}\n\n`;
        
        prediction += `🎯 **Các tín hiệu:**\n`;
        signals.forEach(signal => {
            prediction += `• ${signal}\n`;
        });
        
        prediction += `\n📊 **Các mức quan trọng:**\n`;
        prediction += `• Kháng cự: ${formatCurrency(lastBB.upper)}, ${formatCurrency(lastMA20)}\n`;
        prediction += `• Hỗ trợ: ${formatCurrency(lastBB.lower)}, ${formatCurrency(lastMA50)}\n`;

        return {
            message: prediction,
            analysis: {
                trend,
                strength,
                signals,
                supports: [lastBB.lower, lastMA50].sort((a, b) => b - a),
                resistances: [lastBB.upper, lastMA20].sort((a, b) => a - b)
            }
        };
    } catch (error) {
        console.error('Lỗi khi dự đoán xu hướng:', error);
        throw error;
    }
}

module.exports = {
    analyzeTechnicals,
    getTokenInfo,
    predictTrend,
    createCustomChart,
    getHistoricalData
}; 