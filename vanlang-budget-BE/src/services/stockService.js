import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Stock Service - Tích hợp với Stock API Service
 * Xử lý dữ liệu cổ phiếu real-time từ https://my-app-flashapi.onrender.com
 */
class StockService {
    constructor() {
        this.baseUrl = process.env.STOCK_API_URL || 'https://my-app-flashapi.onrender.com';
        this.timeout = process.env.NODE_ENV === 'production' ? 15000 : 30000; // Production: 15s, Dev: 30s
        this.cache = new Map(); // Cache cho dữ liệu cổ phiếu
        this.cacheExpiry = process.env.NODE_ENV === 'production' ? 3 * 60 * 1000 : 5 * 60 * 1000; // Production: 3min, Dev: 5min
        this.maxRetries = 2; // Số lần retry cho production
        this.retryDelay = 1000; // 1 giây delay giữa các retry

        // Production logging with environment variable check
        logger.info('🚀 StockService initialized', {
            environment: process.env.NODE_ENV,
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            cacheExpiry: this.cacheExpiry,
            stockApiUrlFromEnv: process.env.STOCK_API_URL,
            hasStockApiUrl: !!process.env.STOCK_API_URL
        });
    }

    /**
     * Lấy giá cổ phiếu hiện tại theo mã với retry logic cho production
     * @param {string} symbol - Mã cổ phiếu (VD: VNM, FPT, VIC)
     * @returns {Promise<Object>} Thông tin giá cổ phiếu
     */
    async getStockPrice(symbol) {
        const cacheKey = `price_${symbol.toUpperCase()}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            if (process.env.NODE_ENV !== 'production') {
                logger.info(`📊 Cache hit for stock price: ${symbol}`);
            }
            return cached;
        }

        return await this.executeWithRetry(async () => {
            if (process.env.NODE_ENV !== 'production') {
                logger.info(`📊 Fetching stock price for: ${symbol}`);
            }

            const response = await axios.get(`${this.baseUrl}/api/price`, {
                params: { symbol: symbol.toUpperCase(), source: 'TCBS' },
                timeout: this.timeout,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'VanLang-Budget-Agent/1.0'
                }
            });

            const data = response.data;

            // Validate response data
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format from Stock API');
            }

            // Xử lý dữ liệu và format
            const result = {
                symbol: data.symbol || symbol.toUpperCase(),
                price: this.validateNumber(data.price),
                change: this.validateNumber(data.change),
                pct_change: this.validateNumber(data.pct_change),
                volume: this.validateNumber(data.volume),
                source: data.source || 'TCBS',
                timestamp: data.timestamp || new Date().toISOString(),
                error: data.error || null
            };

            // Cache kết quả nếu không có lỗi và có dữ liệu hợp lệ
            if (!result.error && result.price > 0) {
                this.setCache(cacheKey, result);
            }

            return result;
        }, `stock price for ${symbol}`);
    }

    /**
     * Execute function with retry logic for production stability
     */
    async executeWithRetry(fn, operation) {
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt <= this.maxRetries) {
                    if (process.env.NODE_ENV === 'production') {
                        logger.warn(`🔄 Retry ${attempt}/${this.maxRetries} for ${operation}:`, error.message);
                    }
                    await this.delay(this.retryDelay * attempt); // Exponential backoff
                } else {
                    logger.error(`❌ Final attempt failed for ${operation}:`, error.message);
                }
            }
        }

        // Return error response instead of throwing
        return {
            symbol: operation.includes('stock price for') ? operation.split('stock price for ')[1]?.toUpperCase() : 'UNKNOWN',
            price: null,
            error: this.getProductionErrorMessage(lastError),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validate and sanitize numeric values
     */
    validateNumber(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return 0;
        }
        return Number(value);
    }

    /**
     * Get user-friendly error message for production
     */
    getProductionErrorMessage(error) {
        // Log error details for debugging (only in production logs)
        if (process.env.NODE_ENV === 'production') {
            logger.error('📊 Stock API Error Details', {
                code: error.code,
                status: error.response?.status,
                message: error.message,
                url: error.config?.url
            });
        }

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return 'Dịch vụ dữ liệu cổ phiếu đang quá tải, vui lòng thử lại sau';
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return 'Không thể kết nối đến dịch vụ dữ liệu cổ phiếu';
        }
        if (error.response?.status === 404) {
            return 'Mã cổ phiếu không tồn tại hoặc không được hỗ trợ';
        }
        if (error.response?.status === 429) {
            return 'Quá nhiều yêu cầu, vui lòng thử lại sau vài phút';
        }
        if (error.response?.status >= 500) {
            return 'Dịch vụ dữ liệu cổ phiếu tạm thời gặp sự cố';
        }

        // Generic error for production
        return process.env.NODE_ENV === 'production'
            ? 'Không thể lấy dữ liệu cổ phiếu, vui lòng thử lại sau'
            : `Lỗi: ${error.message}`;
    }

    /**
     * Delay utility for retry logic
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Lấy danh sách cổ phiếu theo ngành với retry logic
     * @param {string} industry - Tên ngành (banking, real_estate, technology, etc.)
     * @param {number} limit - Số lượng cổ phiếu cần lấy
     * @returns {Promise<Object>} Danh sách cổ phiếu theo ngành
     */
    async getStocksByIndustry(industry = 'all', limit = 20) {
        const cacheKey = `industry_${industry}_${limit}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            if (process.env.NODE_ENV !== 'production') {
                logger.info(`📊 Cache hit for industry stocks: ${industry}`);
            }
            return cached;
        }

        return await this.executeWithRetry(async () => {
            if (process.env.NODE_ENV !== 'production') {
                logger.info(`📊 Fetching stocks by industry: ${industry}`);
            }

            const response = await axios.get(`${this.baseUrl}/api/stocks/by-industry`, {
                params: { industry, limit, source: 'TCBS' },
                timeout: this.timeout,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'VanLang-Budget-Agent/1.0'
                }
            });

            const result = response.data;

            // Validate response
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid response format from Stock API');
            }

            // Cache kết quả nếu thành công
            if (result && !result.error && result.stocks && Array.isArray(result.stocks)) {
                this.setCache(cacheKey, result);
            }

            return result;
        }, `stocks by industry ${industry}`).catch(() => {
            // Fallback response for production
            return {
                industry,
                stocks: [],
                count: 0,
                error: 'Không thể lấy dữ liệu ngành, vui lòng thử lại sau',
                timestamp: new Date().toISOString()
            };
        });
    }

    /**
     * Lấy dữ liệu real-time cho nhiều mã cổ phiếu
     * @param {string[]} symbols - Mảng các mã cổ phiếu
     * @returns {Promise<Object>} Dữ liệu real-time
     */
    async getRealtimeStocks(symbols) {
        try {
            const symbolsStr = symbols.map(s => s.toUpperCase()).join(',');
            const cacheKey = `realtime_${symbolsStr}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger.info(`📊 Cache hit for realtime stocks: ${symbolsStr}`);
                return cached;
            }

            logger.info(`📊 Fetching realtime data for: ${symbolsStr}`);
            const response = await axios.get(`${this.baseUrl}/api/stock/realtime`, {
                params: { symbols: symbolsStr, source: 'TCBS' },
                timeout: this.timeout,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const result = response.data;

            // Cache kết quả nếu thành công
            if (result && !result.error) {
                this.setCache(cacheKey, result);
            }

            return result;
        } catch (error) {
            logger.error(`❌ Error fetching realtime stocks:`, error.message);
            return {
                symbols: symbols,
                data: [],
                count: 0,
                error: `Không thể lấy dữ liệu real-time: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Phân tích xu hướng cổ phiếu dựa trên dữ liệu giá
     * @param {Object} stockData - Dữ liệu cổ phiếu
     * @returns {Object} Phân tích xu hướng
     */
    analyzeStockTrend(stockData) {
        try {
            const { price, change, pct_change, volume, symbol } = stockData;

            if (!price || price === 0) {
                return {
                    trend: 'unknown',
                    analysis: 'Không có dữ liệu giá để phân tích',
                    recommendation: 'Vui lòng kiểm tra lại mã cổ phiếu'
                };
            }

            let trend = 'neutral';
            let analysis = '';
            let recommendation = '';

            // Phân tích xu hướng dựa trên % thay đổi
            if (pct_change > 3) {
                trend = 'strong_bullish';
                analysis = `${symbol} đang có xu hướng tăng mạnh với mức tăng ${pct_change.toFixed(2)}%`;
                recommendation = 'Cổ phiếu đang có momentum tích cực, có thể cân nhắc mua vào';
            } else if (pct_change > 1) {
                trend = 'bullish';
                analysis = `${symbol} đang tăng nhẹ với mức tăng ${pct_change.toFixed(2)}%`;
                recommendation = 'Xu hướng tích cực, theo dõi thêm để quyết định';
            } else if (pct_change < -3) {
                trend = 'strong_bearish';
                analysis = `${symbol} đang giảm mạnh với mức giảm ${Math.abs(pct_change).toFixed(2)}%`;
                recommendation = 'Cần thận trọng, có thể chờ đợi tín hiệu phục hồi';
            } else if (pct_change < -1) {
                trend = 'bearish';
                analysis = `${symbol} đang giảm nhẹ với mức giảm ${Math.abs(pct_change).toFixed(2)}%`;
                recommendation = 'Theo dõi sát sao, có thể là cơ hội mua vào nếu có tín hiệu phục hồi';
            } else {
                trend = 'neutral';
                analysis = `${symbol} đang giao dịch ổn định với biến động nhỏ ${pct_change.toFixed(2)}%`;
                recommendation = 'Thị trường đang consolidate, chờ đợi tín hiệu rõ ràng hơn';
            }

            // Phân tích khối lượng giao dịch
            let volumeAnalysis = '';
            if (volume > 1000000) {
                volumeAnalysis = 'Khối lượng giao dịch cao, cho thấy sự quan tâm lớn từ nhà đầu tư';
            } else if (volume > 100000) {
                volumeAnalysis = 'Khối lượng giao dịch trung bình';
            } else {
                volumeAnalysis = 'Khối lượng giao dịch thấp, thanh khoản hạn chế';
            }

            return {
                trend,
                analysis: `${analysis}. ${volumeAnalysis}`,
                recommendation,
                technical_indicators: {
                    price_change: change,
                    pct_change: pct_change,
                    volume: volume,
                    volume_level: volume > 1000000 ? 'high' : volume > 100000 ? 'medium' : 'low'
                }
            };
        } catch (error) {
            logger.error('❌ Error analyzing stock trend:', error.message);
            return {
                trend: 'unknown',
                analysis: 'Không thể phân tích xu hướng do lỗi dữ liệu',
                recommendation: 'Vui lòng thử lại sau'
            };
        }
    }

    /**
     * Format giá cổ phiếu theo định dạng tiền tệ Việt Nam
     * @param {number} price - Giá cổ phiếu
     * @returns {string} Giá đã format
     */
    formatPrice(price) {
        if (!price || price === 0) return 'N/A';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    /**
     * Format phần trăm thay đổi
     * @param {number} pctChange - Phần trăm thay đổi
     * @returns {string} Phần trăm đã format với màu sắc
     */
    formatPctChange(pctChange) {
        if (pctChange === null || pctChange === undefined) return 'N/A';
        const sign = pctChange >= 0 ? '+' : '';
        const emoji = pctChange >= 0 ? '📈' : '📉';
        return `${emoji} ${sign}${pctChange.toFixed(2)}%`;
    }

    /**
     * Format khối lượng giao dịch
     * @param {number} volume - Khối lượng
     * @returns {string} Khối lượng đã format
     */
    formatVolume(volume) {
        if (!volume || volume === 0) return 'N/A';
        if (volume >= 1000000) {
            return `${(volume / 1000000).toFixed(1)}M`;
        } else if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}K`;
        }
        return volume.toLocaleString('vi-VN');
    }

    /**
     * Tạo response đầy đủ cho cổ phiếu với phân tích
     * @param {string} symbol - Mã cổ phiếu
     * @returns {Promise<Object>} Response đầy đủ
     */
    async getStockAnalysis(symbol) {
        try {
            const stockData = await this.getStockPrice(symbol);

            if (stockData.error) {
                return {
                    success: false,
                    symbol: symbol.toUpperCase(),
                    error: stockData.error,
                    message: `Không thể lấy thông tin cho mã cổ phiếu ${symbol.toUpperCase()}`
                };
            }

            const trendAnalysis = this.analyzeStockTrend(stockData);

            return {
                success: true,
                symbol: stockData.symbol,
                price: {
                    current: stockData.price,
                    formatted: this.formatPrice(stockData.price),
                    change: stockData.change,
                    pct_change: stockData.pct_change,
                    pct_change_formatted: this.formatPctChange(stockData.pct_change)
                },
                volume: {
                    raw: stockData.volume,
                    formatted: this.formatVolume(stockData.volume)
                },
                analysis: trendAnalysis,
                source: stockData.source,
                timestamp: stockData.timestamp
            };
        } catch (error) {
            logger.error(`❌ Error getting stock analysis for ${symbol}:`, error.message);
            return {
                success: false,
                symbol: symbol.toUpperCase(),
                error: error.message,
                message: `Đã xảy ra lỗi khi phân tích cổ phiếu ${symbol.toUpperCase()}`
            };
        }
    }

    /**
     * So sánh cổ phiếu với các cổ phiếu cùng ngành
     * @param {string} symbol - Mã cổ phiếu
     * @param {string} industry - Ngành
     * @returns {Promise<Object>} Kết quả so sánh
     */
    async compareWithIndustry(symbol, industry) {
        try {
            const [stockData, industryData] = await Promise.all([
                this.getStockPrice(symbol),
                this.getStocksByIndustry(industry, 10)
            ]);

            if (stockData.error || industryData.error) {
                return {
                    success: false,
                    error: 'Không thể lấy dữ liệu để so sánh'
                };
            }

            const industryStocks = industryData.stocks || [];
            const avgPctChange = industryStocks.reduce((sum, stock) => sum + (stock.pct_change || 0), 0) / industryStocks.length;

            let comparison = '';
            if (stockData.pct_change > avgPctChange + 1) {
                comparison = 'outperforming';
            } else if (stockData.pct_change < avgPctChange - 1) {
                comparison = 'underperforming';
            } else {
                comparison = 'inline';
            }

            return {
                success: true,
                symbol: stockData.symbol,
                industry,
                stock_performance: stockData.pct_change,
                industry_avg: avgPctChange,
                comparison,
                comparison_text: this.getComparisonText(comparison, stockData.pct_change, avgPctChange),
                industry_stocks: industryStocks.slice(0, 5) // Top 5 cổ phiếu cùng ngành
            };
        } catch (error) {
            logger.error(`❌ Error comparing ${symbol} with industry ${industry}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Tạo text so sánh với ngành
     * @param {string} comparison - Loại so sánh
     * @param {number} stockPct - % thay đổi của cổ phiếu
     * @param {number} industryAvg - % thay đổi trung bình ngành
     * @returns {string} Text mô tả so sánh
     */
    getComparisonText(comparison, stockPct, industryAvg) {
        const diff = Math.abs(stockPct - industryAvg).toFixed(2);

        switch (comparison) {
            case 'outperforming':
                return `Cổ phiếu đang vượt trội so với ngành, cao hơn ${diff}% so với mức trung bình`;
            case 'underperforming':
                return `Cổ phiếu đang kém hiệu quả so với ngành, thấp hơn ${diff}% so với mức trung bình`;
            default:
                return `Cổ phiếu đang giao dịch phù hợp với xu hướng chung của ngành`;
        }
    }

    /**
     * Cache management methods
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        logger.info('📊 Stock cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

export default StockService;
