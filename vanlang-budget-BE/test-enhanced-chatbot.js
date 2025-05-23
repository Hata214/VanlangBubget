#!/usr/bin/env node

/**
 * Enhanced Chatbot Test Script
 * Kiểm tra tất cả tính năng của enhanced chatbot system
 */

import axios from 'axios';
import chalk from 'chalk';

const BASE_URL = 'http://localhost:4000';
const ADMIN_TOKEN = 'your-admin-token-here'; // Replace với token thật

// Test cases cho NLP Intent Classification
const testCases = [
    // Greeting tests
    { message: 'chào bạn', expectedIntent: 'greeting', language: 'vi' },
    { message: 'hello', expectedIntent: 'greeting', language: 'en' },

    // Financial high confidence
    { message: 'thu nhập tháng này của tôi', expectedIntent: 'financial_high_confidence', language: 'vi' },
    { message: 'my monthly expenses', expectedIntent: 'financial_high_confidence', language: 'en' },

    // About bot
    { message: 'bạn là ai', expectedIntent: 'about_bot', language: 'vi' },
    { message: 'what can you help with', expectedIntent: 'about_bot', language: 'en' },

    // Blocked topics
    { message: 'hôm nay thời tiết thế nào', expectedIntent: 'blocked_topic', language: 'vi' },
    { message: 'tell me about politics', expectedIntent: 'blocked_topic', language: 'en' },

    // Financial analysis
    { message: 'phân tích tình hình tài chính hiện tại của tôi', expectedIntent: 'financial_high_confidence', language: 'vi' },
    { message: 'investment suggestions for this month', expectedIntent: 'financial_medium_confidence', language: 'en' }
];

class EnhancedChatbotTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    log(message, type = 'info') {
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            error: chalk.red,
            warning: chalk.yellow
        };
        console.log(colors[type](`[${type.toUpperCase()}] ${message}`));
    }

    async testHealthCheck() {
        this.log('🔍 Testing Health Check Endpoint...', 'info');

        try {
            const response = await axios.get(`${BASE_URL}/api/chatbot/health`);

            if (response.status === 200 && response.data.status === 'healthy') {
                this.log('✅ Health check passed', 'success');
                this.results.passed++;
                return true;
            } else {
                this.log('❌ Health check failed: Invalid response', 'error');
                this.results.failed++;
                return false;
            }
        } catch (error) {
            this.log(`❌ Health check failed: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    async testEnhancedEndpoint(testCase) {
        this.log(`🧪 Testing: "${testCase.message}" (${testCase.language})`, 'info');

        try {
            const response = await axios.post(`${BASE_URL}/api/chatbot/enhanced`, {
                message: testCase.message,
                language: testCase.language
            }, {
                headers: {
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data.success) {
                const metadata = response.data.metadata;
                const actualIntent = metadata?.intent || 'unknown';

                if (actualIntent === testCase.expectedIntent) {
                    this.log(`✅ Intent classification correct: ${actualIntent}`, 'success');
                    this.log(`   Response: "${response.data.response.substring(0, 100)}..."`, 'info');
                    this.log(`   Confidence: ${metadata?.confidence}, Time: ${metadata?.responseTime}ms`, 'info');
                    this.results.passed++;
                    return true;
                } else {
                    this.log(`❌ Intent mismatch. Expected: ${testCase.expectedIntent}, Got: ${actualIntent}`, 'error');
                    this.results.failed++;
                    this.results.errors.push({
                        test: testCase.message,
                        expected: testCase.expectedIntent,
                        actual: actualIntent
                    });
                    return false;
                }
            } else {
                this.log(`❌ API call failed: ${response.data.error || 'Unknown error'}`, 'error');
                this.results.failed++;
                return false;
            }
        } catch (error) {
            this.log(`❌ Test failed: ${error.message}`, 'error');
            if (error.response?.data) {
                this.log(`   Error details: ${JSON.stringify(error.response.data)}`, 'error');
            }
            this.results.failed++;
            return false;
        }
    }

    async testCachePerformance() {
        this.log('⚡ Testing Cache Performance...', 'info');

        const testMessage = 'thu nhập của tôi tháng này là bao nhiêu';

        try {
            // First call (should cache)
            const start1 = Date.now();
            const response1 = await axios.post(`${BASE_URL}/api/chatbot/enhanced`, {
                message: testMessage,
                language: 'vi'
            }, {
                headers: {
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            const time1 = Date.now() - start1;

            // Second call (should hit cache)
            const start2 = Date.now();
            const response2 = await axios.post(`${BASE_URL}/api/chatbot/enhanced`, {
                message: testMessage,
                language: 'vi'
            }, {
                headers: {
                    'Authorization': `Bearer ${ADMIN_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            const time2 = Date.now() - start2;

            const cached = response2.data.metadata?.cached;
            const speedup = time1 / time2;

            if (cached && speedup > 1.5) {
                this.log(`✅ Cache performance good. Speedup: ${speedup.toFixed(2)}x (${time1}ms → ${time2}ms)`, 'success');
                this.results.passed++;
                return true;
            } else {
                this.log(`⚠️ Cache performance suboptimal. Cached: ${cached}, Speedup: ${speedup.toFixed(2)}x`, 'warning');
                this.results.failed++;
                return false;
            }
        } catch (error) {
            this.log(`❌ Cache test failed: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    async testAnalyticsEndpoint() {
        this.log('📊 Testing Analytics Endpoint...', 'info');

        try {
            const response = await axios.get(`${BASE_URL}/api/chatbot/analytics`, {
                headers: {
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                }
            });

            if (response.status === 200 && response.data.analytics) {
                this.log('✅ Analytics endpoint accessible', 'success');
                this.log(`   Total requests: ${response.data.analytics.totalRequests}`, 'info');
                this.log(`   Success rate: ${(response.data.analytics.successRate * 100).toFixed(1)}%`, 'info');
                this.log(`   Cache hit rate: ${(response.data.cache.hitRate * 100).toFixed(1)}%`, 'info');
                this.results.passed++;
                return true;
            } else {
                this.log('❌ Analytics endpoint failed', 'error');
                this.results.failed++;
                return false;
            }
        } catch (error) {
            if (error.response?.status === 403) {
                this.log('⚠️ Analytics endpoint requires admin access (403)', 'warning');
                // This is expected behavior, so we don't count it as failure
                return true;
            } else {
                this.log(`❌ Analytics test failed: ${error.message}`, 'error');
                this.results.failed++;
                return false;
            }
        }
    }

    async testMultipleLanguages() {
        this.log('🌍 Testing Multilingual Support...', 'info');

        const tests = [
            { message: 'phân tích chi tiêu', language: 'vi' },
            { message: 'analyze my expenses', language: 'en' }
        ];

        let success = true;

        for (const test of tests) {
            try {
                const response = await axios.post(`${BASE_URL}/api/chatbot/enhanced`, test, {
                    headers: {
                        'Authorization': `Bearer ${ADMIN_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success && response.data.metadata?.language === test.language) {
                    this.log(`✅ ${test.language.toUpperCase()} language support working`, 'success');
                } else {
                    this.log(`❌ ${test.language.toUpperCase()} language support failed`, 'error');
                    success = false;
                }
            } catch (error) {
                this.log(`❌ Language test failed for ${test.language}: ${error.message}`, 'error');
                success = false;
            }
        }

        if (success) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }

        return success;
    }

    async runAllTests() {
        console.log(chalk.cyan('🚀 Starting Enhanced Chatbot Test Suite...\n'));

        // Test 1: Health Check
        await this.testHealthCheck();
        console.log('');

        // Test 2: NLP Intent Classification
        this.log('🧠 Testing NLP Intent Classification...', 'info');
        for (const testCase of testCases) {
            await this.testEnhancedEndpoint(testCase);
        }
        console.log('');

        // Test 3: Cache Performance
        await this.testCachePerformance();
        console.log('');

        // Test 4: Analytics
        await this.testAnalyticsEndpoint();
        console.log('');

        // Test 5: Multilingual
        await this.testMultipleLanguages();
        console.log('');

        // Final Results
        this.printResults();
    }

    printResults() {
        console.log(chalk.cyan('📋 TEST RESULTS SUMMARY:'));
        console.log(chalk.green(`✅ Passed: ${this.results.passed}`));
        console.log(chalk.red(`❌ Failed: ${this.results.failed}`));

        const total = this.results.passed + this.results.failed;
        const successRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;

        console.log(chalk.blue(`📊 Success Rate: ${successRate}%`));

        if (this.results.errors.length > 0) {
            console.log(chalk.red('\n🔍 ERROR DETAILS:'));
            this.results.errors.forEach((error, index) => {
                console.log(chalk.red(`${index + 1}. Test: "${error.test}"`));
                console.log(chalk.red(`   Expected: ${error.expected}, Got: ${error.actual}`));
            });
        }

        console.log(chalk.cyan('\n🎯 RECOMMENDATIONS:'));
        if (this.results.failed === 0) {
            console.log(chalk.green('✨ All tests passed! Enhanced chatbot is working perfectly.'));
        } else {
            console.log(chalk.yellow('⚠️ Some tests failed. Please check:'));
            console.log(chalk.yellow('  1. Backend server is running on port 4000'));
            console.log(chalk.yellow('  2. Environment variables are set correctly'));
            console.log(chalk.yellow('  3. Gemini API key is valid'));
            console.log(chalk.yellow('  4. NLP service is properly initialized'));
            console.log(chalk.yellow('  5. Cache service is working'));
        }
    }
}

// Main execution
async function main() {
    try {
        const tester = new EnhancedChatbotTester();
        await tester.runAllTests();
    } catch (error) {
        console.error(chalk.red('Test suite failed to run:'), error.message);
        process.exit(1);
    }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default EnhancedChatbotTester; 