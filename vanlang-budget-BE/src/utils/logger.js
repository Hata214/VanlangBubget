/**
 * Utility logger đơn giản cho ứng dụng
 */

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Các cấp độ log
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Lấy cấp độ log từ biến môi trường hoặc mặc định là 'info'
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] || LOG_LEVELS.info;

/**
 * Format thời gian
 * @returns {string} Thời gian hiện tại định dạng YYYY-MM-DD HH:MM:SS
 */
function getTimeStamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substr(0, 19);
}

/**
 * Ghi log error
 * @param {string} message - Thông điệp log
 * @param {any} data - Dữ liệu bổ sung (tùy chọn)
 */
function error(message, data = '') {
    if (currentLevel >= LOG_LEVELS.error) {
        console.error(
            `${colors.red}[ERROR]${colors.reset} ${getTimeStamp()} - ${message}`,
            data !== '' ? data : ''
        );
    }
}

/**
 * Ghi log warn
 * @param {string} message - Thông điệp log
 * @param {any} data - Dữ liệu bổ sung (tùy chọn)
 */
function warn(message, data = '') {
    if (currentLevel >= LOG_LEVELS.warn) {
        console.warn(
            `${colors.yellow}[WARN]${colors.reset} ${getTimeStamp()} - ${message}`,
            data !== '' ? data : ''
        );
    }
}

/**
 * Ghi log info
 * @param {string} message - Thông điệp log
 * @param {any} data - Dữ liệu bổ sung (tùy chọn)
 */
function info(message, data = '') {
    if (currentLevel >= LOG_LEVELS.info) {
        console.info(
            `${colors.green}[INFO]${colors.reset} ${getTimeStamp()} - ${message}`,
            data !== '' ? data : ''
        );
    }
}

/**
 * Ghi log debug
 * @param {string} message - Thông điệp log
 * @param {any} data - Dữ liệu bổ sung (tùy chọn)
 */
function debug(message, data = '') {
    if (currentLevel >= LOG_LEVELS.debug) {
        console.debug(
            `${colors.blue}[DEBUG]${colors.reset} ${getTimeStamp()} - ${message}`,
            data !== '' ? data : ''
        );
    }
}

/**
 * Ghi log với tên module cụ thể
 * @param {string} moduleName - Tên module
 * @returns {Object} Các phương thức log với tiền tố là tên module
 */
function createModuleLogger(moduleName) {
    return {
        error: (message, data) => error(`[${moduleName}] ${message}`, data),
        warn: (message, data) => warn(`[${moduleName}] ${message}`, data),
        info: (message, data) => info(`[${moduleName}] ${message}`, data),
        debug: (message, data) => debug(`[${moduleName}] ${message}`, data)
    };
}

const logger = {
    error,
    warn,
    info,
    debug,
    createModuleLogger
};

export default logger; 