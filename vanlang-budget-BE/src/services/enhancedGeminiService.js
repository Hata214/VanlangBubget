/**
 * ⚡ Enhanced Gemini Service with Advanced Features
 * Optimizes Gemini AI usage with caching, retry logic, and advanced configurations
 */

import axios from 'axios';
import logger from '../utils/logger.js';

class EnhancedGeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.modelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash';
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`;
        
        // Response cache for identical requests
        this.responseCache = new Map();
        this.cacheExpiryTime = 5 * 60 * 1000; // 5 minutes
        
        // Request rate limiting
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.maxRequestsPerMinute = 60;
        this.requestTimestamps = [];
        
        // Performance metrics
        this.metrics = {
            totalRequests: 0,
            cacheHits: 0,
            errors: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        };

        // Advanced configurations for different use cases
        this.configurations = {
            // Intent classification - Low temperature for consistency
            intent_analysis: {
                temperature: 0.1,
                topK: 10,
                topP: 0.8,
                maxOutputTokens: 50,
                candidateCount: 1
            },
            
            // Data extraction - Very low temperature for precision
            data_extraction: {
                temperature: 0.05,
                topK: 5,
                topP: 0.7,
                maxOutputTokens: 200,
                candidateCount: 1
            },
            
            // Financial analysis - Balanced for accuracy and creativity
            financial_analysis: {
                temperature: 0.6,
                topK: 40,
                topP: 0.9,
                maxOutputTokens: 1024,
                candidateCount: 1
            },
            
            // Conversation - Higher temperature for natural responses
            conversation: {
                temperature: 0.8,
                topK: 50,
                topP: 0.95,
                maxOutputTokens: 512,
                candidateCount: 1
            },
            
            // Calculation - Low temperature for accuracy
            calculation: {
                temperature: 0.2,
                topK: 20,
                topP: 0.8,
                maxOutputTokens: 300,
                candidateCount: 1
            },
            
            // Creative advice - Higher temperature for diverse suggestions
            creative_advice: {
                temperature: 0.9,
                topK: 60,
                topP: 0.95,
                maxOutputTokens: 800,
                candidateCount: 1
            }
        };

        // Start cache cleanup interval
        setInterval(() => this.cleanupCache(), 60000); // Every minute
    }

    /**
     * 🎯 Main method with enhanced features
     */
    async generateContent(prompt, options = {}) {
        const startTime = Date.now();
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(prompt, options);
            const cachedResponse = this.getFromCache(cacheKey);
            
            if (cachedResponse) {
                this.metrics.cacheHits++;
                logger.info('Cache hit for Gemini request', { 
                    promptLength: prompt.length,
                    cacheKey: cacheKey.substring(0, 20) + '...'
                });
                return cachedResponse;
            }

            // Rate limiting check
            await this.checkRateLimit();

            // Get configuration
            const config = this.getConfiguration(options.useCase || 'conversation');
            const finalConfig = { ...config, ...options };

            // Make request with retry logic
            const response = await this.makeRequestWithRetry(prompt, finalConfig);

            // Cache the response
            this.cacheResponse(cacheKey, response);

            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updateMetrics(responseTime);

            logger.info('Gemini request completed', {
                promptLength: prompt.length,
                responseLength: response.length,
                responseTime,
                useCase: options.useCase || 'conversation',
                cached: false
            });

            return response;

        } catch (error) {
            this.metrics.errors++;
            logger.error('Enhanced Gemini service error:', error);
            throw error;
        }
    }

    /**
     * 🔄 Request with retry logic
     */
    async makeRequestWithRetry(prompt, config, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.post(this.baseUrl, {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: config.temperature,
                        topK: config.topK,
                        topP: config.topP,
                        maxOutputTokens: config.maxOutputTokens,
                        candidateCount: config.candidateCount || 1
                    }
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': this.apiKey
                    },
                    timeout: 30000 // 30 second timeout
                });

                const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
                if (!result) {
                    throw new Error('Empty response from Gemini API');
                }

                return result;

            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    logger.warn(`Gemini request failed, retrying in ${delay}ms`, {
                        attempt,
                        error: error.message
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    logger.error('All Gemini retry attempts failed', {
                        attempts: maxRetries,
                        finalError: error.message
                    });
                }
            }
        }

        throw lastError;
    }

    /**
     * ⚡ Rate limiting
     */
    async checkRateLimit() {
        const now = Date.now();
        
        // Remove timestamps older than 1 minute
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < 60000
        );

        // Check if we're at the limit
        if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
            const oldestRequest = Math.min(...this.requestTimestamps);
            const waitTime = 60000 - (now - oldestRequest);
            
            if (waitTime > 0) {
                logger.warn('Rate limit reached, waiting', { waitTime });
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        this.requestTimestamps.push(now);
    }

    /**
     * 🗂️ Cache management
     */
    generateCacheKey(prompt, options) {
        const configString = JSON.stringify(options);
        const combined = prompt + configString;
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return `gemini_${Math.abs(hash)}`;
    }

    getFromCache(cacheKey) {
        const cached = this.responseCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiryTime) {
            return cached.response;
        }
        
        if (cached) {
            this.responseCache.delete(cacheKey);
        }
        
        return null;
    }

    cacheResponse(cacheKey, response) {
        // Don't cache very large responses
        if (response.length > 2000) {
            return;
        }

        this.responseCache.set(cacheKey, {
            response,
            timestamp: Date.now()
        });

        // Limit cache size
        if (this.responseCache.size > 100) {
            const oldestKey = this.responseCache.keys().next().value;
            this.responseCache.delete(oldestKey);
        }
    }

    cleanupCache() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, value] of this.responseCache.entries()) {
            if (now - value.timestamp > this.cacheExpiryTime) {
                this.responseCache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info('Cleaned up expired cache entries', { count: cleanedCount });
        }
    }

    /**
     * ⚙️ Configuration management
     */
    getConfiguration(useCase) {
        return this.configurations[useCase] || this.configurations.conversation;
    }

    addConfiguration(name, config) {
        this.configurations[name] = config;
        logger.info('Added new Gemini configuration', { name, config });
    }

    /**
     * 📊 Metrics and monitoring
     */
    updateMetrics(responseTime) {
        this.metrics.totalRequests++;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
    }

    getMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: this.metrics.totalRequests > 0 ? 
                (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2) + '%' : '0%',
            errorRate: this.metrics.totalRequests > 0 ? 
                (this.metrics.errors / this.metrics.totalRequests * 100).toFixed(2) + '%' : '0%',
            cacheSize: this.responseCache.size,
            requestQueueSize: this.requestQueue.length
        };
    }

    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            cacheHits: 0,
            errors: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        };
        logger.info('Gemini metrics reset');
    }

    /**
     * 🧹 Cleanup and maintenance
     */
    clearCache() {
        this.responseCache.clear();
        logger.info('Gemini cache cleared');
    }

    /**
     * 🔧 Utility methods for specific use cases
     */
    async analyzeIntent(message) {
        return await this.generateContent(message, { 
            useCase: 'intent_analysis',
            maxOutputTokens: 50
        });
    }

    async extractData(message) {
        return await this.generateContent(message, { 
            useCase: 'data_extraction',
            maxOutputTokens: 200
        });
    }

    async analyzeFinances(prompt) {
        return await this.generateContent(prompt, { 
            useCase: 'financial_analysis',
            maxOutputTokens: 1024
        });
    }

    async generateConversation(prompt) {
        return await this.generateContent(prompt, { 
            useCase: 'conversation',
            maxOutputTokens: 512
        });
    }

    async calculateFinancial(prompt) {
        return await this.generateContent(prompt, { 
            useCase: 'calculation',
            maxOutputTokens: 300
        });
    }

    async generateAdvice(prompt) {
        return await this.generateContent(prompt, { 
            useCase: 'creative_advice',
            maxOutputTokens: 800
        });
    }
}

export default EnhancedGeminiService;
