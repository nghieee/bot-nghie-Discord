/**
 * Format số tiền thành chuỗi dễ đọc
 * @param {number} value - Giá trị cần format
 * @returns {string}
 */
function formatCurrency(value) {
    if (value === null || value === undefined) return 'N/A';
    
    // Xử lý các giá trị lớn
    if (value >= 1000000000) {
        return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(2)}K`;
    }
    
    // Xử lý các giá trị nhỏ
    if (value < 1 && value > 0) {
        // Tìm vị trí số khác 0 đầu tiên sau dấu thập phân
        const decimalStr = value.toString();
        const firstNonZeroIndex = decimalStr.slice(2).search(/[1-9]/);
        
        if (firstNonZeroIndex !== -1) {
            // Làm tròn tới 2 chữ số sau số khác 0 đầu tiên
            const decimals = firstNonZeroIndex + 3;
            return `$${value.toFixed(decimals)}`;
        }
    }
    
    // Giá trị bình thường (>= 1)
    return `$${value.toFixed(2)}`;
}

/**
 * Format phần trăm
 * @param {number} value - Giá trị phần trăm
 * @returns {string}
 */
function formatPercentage(value) {
    if (value === null || value === undefined) return 'N/A';
    const formatted = value.toFixed(2);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
}

/**
 * Format số lượng lớn
 * @param {number} value - Giá trị cần format
 * @returns {string}
 */
function formatNumber(value) {
    if (!value) return 'N/A';
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
}

module.exports = {
    formatCurrency,
    formatPercentage,
    formatNumber
}; 