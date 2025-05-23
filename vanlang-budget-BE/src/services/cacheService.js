import NodeCache from 'node-cache';
import crypto from 'crypto';

class CacheService {
    constructor() {
        // In-memory cache với TTL 15 phút
        this.memoryCache = new NodeCache({
            stdTTL: 900, // 15 minutes
            checkperiod: 120, // Check for expired keys every 2 minutes
            useClones: false // Improve performance
        });

        // Redis cache (nếu có)
        this.redisClient = null;
        this.initRedis();

        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            errors: 0
        };
    }

    async initRedis() {
        try {
            if (process.env.REDIS_URL) {
                const redis = await import('redis');
                this.redisClient = redis.default.createClient({
                    url: process.env.REDIS_URL,
                    retry_strategy: (options) => {
                        if (options.error && options.error.code === 'ECONNREFUSED') {
                            console.warn('CacheService: Redis server refused connection');
                            return undefined; // Fallback to memory cache
                        }
                        return Math.min(options.attempt * 100, 3000);
                    }
                });

                await this.redisClient.connect();
                console.log('CacheService: Redis connected successfully');
            }
        } catch (error) {
            console.warn('CacheService: Redis connection failed, using memory cache only:', error.message);
            this.redisClient = null;
        }
    }

    /**
     * Cache key generators
     */
    getUserFinancialDataKey(userId) {
        return `financial_data:${userId}`;
    }

    getConversationKey(userId) {
        return `conversation:${userId}`;
    }

    getIntentAnalysisKey(message) {
        const hash = crypto.createHash('md5').update(message).digest('hex');
        return `intent:${hash}`;
    }

    getGeminiResponseKey(prompt) {
        const hash = crypto.createHash('md5').update(prompt).digest('hex');
        return `gemini:${hash}`;
    }

    /**
     * Get from cache với fallback strategy
     */
    async get(key) {
        try {
            // 1. Thử memory cache trước (nhanh nhất)
            const memoryResult = this.memoryCache.get(key);
            if (memoryResult !== undefined) {
                this.stats.hits++;
                return memoryResult;
            }

            // 2. Thử Redis nếu có
            if (this.redisClient) {
                const redisResult = await this.redisClient.get(key);
                if (redisResult) {
                    const parsed = JSON.parse(redisResult);
                    // Cache lại vào memory để lần sau nhanh hơn
                    this.memoryCache.set(key, parsed, 300); // 5 minutes in memory
                    this.stats.hits++;
                    return parsed;
                }
            }

            this.stats.misses++;
            return null;
        } catch (error) {
            console.error('CacheService: Get error for key', key, error);
            this.stats.errors++;
            return null;
        }
    }

    /**
     * Set cache với multi-layer strategy
     */
    async set(key, value, ttl = 900) {
        try {
            // 1. Set vào memory cache
            this.memoryCache.set(key, value, ttl);

            // 2. Set vào Redis nếu có
            if (this.redisClient) {
                await this.redisClient.setEx(key, ttl, JSON.stringify(value));
            }

            this.stats.sets++;
            return true;
        } catch (error) {
            console.error('CacheService: Set error for key', key, error);
            this.stats.errors++;
            return false;
        }
    }

    /**
     * Cache financial data với smart invalidation
     */
    async cacheUserFinancialData(userId, data) {
        const key = this.getUserFinancialDataKey(userId);
        return await this.set(key, data, 1800); // 30 minutes
    }

    async getUserFinancialData(userId) {
        const key = this.getUserFinancialDataKey(userId);
        return await this.get(key);
    }

    /**
     * Cache conversation history
     */
    async cacheConversation(userId, messages) {
        const key = this.getConversationKey(userId);
        return await this.set(key, messages, 3600); // 1 hour
    }

    async getConversation(userId) {
        const key = this.getConversationKey(userId);
        return await this.get(key);
    }

    async addMessageToConversation(userId, message) {
        const conversation = await this.getConversation(userId) || [];
        conversation.push({
            ...message,
            timestamp: new Date().toISOString()
        });

        // Giữ chỉ 20 tin nhắn gần nhất
        if (conversation.length > 20) {
            conversation.splice(0, conversation.length - 20);
        }

        await this.cacheConversation(userId, conversation);
        return conversation;
    }

    /**
     * Cache intent analysis results
     */
    async cacheIntentAnalysis(message, analysis) {
        const key = this.getIntentAnalysisKey(message);
        return await this.set(key, analysis, 7200); // 2 hours
    }

    async getIntentAnalysis(message) {
        const key = this.getIntentAnalysisKey(message);
        return await this.get(key);
    }

    /**
     * Cache Gemini responses cho similar queries
     */
    async cacheGeminiResponse(prompt, response) {
        const key = this.getGeminiResponseKey(prompt);
        return await this.set(key, response, 1800); // 30 minutes
    }

    async getGeminiResponse(prompt) {
        const key = this.getGeminiResponseKey(prompt);
        return await this.get(key);
    }

    /**
     * Invalidate caches
     */
    async invalidateUserData(userId) {
        const keys = [
            this.getUserFinancialDataKey(userId),
            this.getConversationKey(userId)
        ];

        for (const key of keys) {
            this.memoryCache.del(key);
            if (this.redisClient) {
                await this.redisClient.del(key);
            }
        }
    }

    /**
     * Clear all caches
     */
    async clearAll() {
        this.memoryCache.flushAll();
        if (this.redisClient) {
            await this.redisClient.flushAll();
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const memoryStats = this.memoryCache.getStats();
        return {
            ...this.stats,
            memory: {
                keys: memoryStats.keys,
                hits: memoryStats.hits,
                misses: memoryStats.misses,
                ksize: memoryStats.ksize,
                vsize: memoryStats.vsize
            },
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
        };
    }

    /**
     * Warming up cache với frequently used data
     */
    async warmupCache() {
        console.log('CacheService: Starting cache warmup...');

        // Preload common responses
        const commonQueries = [
            'xin chào',
            'bạn là ai',
            'giúp tôi quản lý tài chính',
            'thu nhập của tôi',
            'chi tiêu tháng này'
        ];

        // Cache common intent analyses
        for (const query of commonQueries) {
            const intentKey = this.getIntentAnalysisKey(query);
            if (!await this.get(intentKey)) {
                // Placeholder - sẽ được fill bởi NLP service
                await this.set(intentKey, { cached: true, query }, 3600);
            }
        }

        console.log('CacheService: Cache warmup completed');
    }

    /**
     * Cleanup expired entries và memory management
     */
    cleanup() {
        try {
            const beforeKeys = this.memoryCache.getStats().keys;

            // node-cache tự động xóa expired entries, chúng ta chỉ cần kiểm tra stats
            // Hoặc có thể flush một số entries cũ nếu cần
            const stats = this.memoryCache.getStats();

            // Log thông tin cache hiện tại
            if (stats.keys > 1000) { // Nếu có quá nhiều keys
                console.log(`CacheService: Cache has ${stats.keys} keys, consider manual cleanup`);
                // Có thể thêm logic cleanup thủ công ở đây nếu cần
            }

            const afterKeys = this.memoryCache.getStats().keys;
            console.log(`CacheService: Cache stats - Keys: ${afterKeys}, Hits: ${stats.hits}, Misses: ${stats.misses}`);
        } catch (error) {
            console.error('CacheService: Cleanup error:', error);
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        try {
            if (this.redisClient) {
                await this.redisClient.quit();
                console.log('CacheService: Redis connection closed');
            }
            this.memoryCache.close();
            console.log('CacheService: Memory cache closed');
        } catch (error) {
            console.error('CacheService: Shutdown error:', error);
        }
    }
}

// Singleton instance
let cacheInstance = null;

function getCacheService() {
    if (!cacheInstance) {
        cacheInstance = new CacheService();

        // Setup cleanup interval
        setInterval(() => {
            cacheInstance.cleanup();
        }, 300000); // Every 5 minutes

        // Warmup cache
        cacheInstance.warmupCache();
    }
    return cacheInstance;
}

export default getCacheService;