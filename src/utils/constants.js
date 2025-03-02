// ID của các message quan trọng
const RULES_MESSAGE_ID = '1345443188956987504';

// ID của các role
const MEMBER_ROLE_ID = '1345449929430138961';

// Các emoji được sử dụng
const EMOJIS = {
    CHECK_MARK: '✅',
    WARNING: '⚠️',
    ERROR: '❌',
    LOADING: '🔄',
    CHART: '📊',
    CRYSTAL_BALL: '🔮',
    NEWS: '📰',
    MONEY: '💰',
    CHART_UP: '📈',
    CHART_DOWN: '📉'
};

// Các kênh mặc định
const DEFAULT_CHANNELS = {
    RULES: 'rules',
    WELCOME: 'welcome'
};

// Các timeframe hợp lệ cho biểu đồ
const VALID_TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];

module.exports = {
    RULES_MESSAGE_ID,
    MEMBER_ROLE_ID,
    EMOJIS,
    DEFAULT_CHANNELS,
    VALID_TIMEFRAMES
}; 