/**
 * Debug utility để test Stock API trong production
 * Sử dụng để kiểm tra kết nối và response từ stock-api
 */

import axios from 'axios';

// URL của stock-api trong production
const STOCK_API_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'https://my-app-flashapi.onrender.com';

export interface DebugResult {
    success: boolean;
    endpoint: string;
    status?: number;
    data?: any;
    error?: string;
    timestamp: string;
    responseTime?: number;
}

/**
 * Test kết nối cơ bản đến stock-api
 */
export async function testStockApiConnection(): Promise<DebugResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
        console.log(`[DEBUG] Testing connection to: ${STOCK_API_URL}`);
        
        const response = await axios.get(`${STOCK_API_URL}/`, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'VanLang-Budget-Debug/1.0'
            }
        });
        
        const responseTime = Date.now() - startTime;
        
        return {
            success: true,
            endpoint: '/',
            status: response.status,
            data: response.data,
            timestamp,
            responseTime
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                endpoint: '/',
                status: error.response?.status,
                error: `${error.response?.status} ${error.response?.statusText || error.message}`,
                timestamp,
                responseTime
            };
        }
        
        return {
            success: false,
            endpoint: '/',
            error: `Network Error: ${error}`,
            timestamp,
            responseTime
        };
    }
}

/**
 * Test endpoint /api/price
 */
export async function testStockPriceEndpoint(symbol: string = 'VNM'): Promise<DebugResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const endpoint = `/api/price?symbol=${symbol}`;
    
    try {
        console.log(`[DEBUG] Testing price endpoint: ${STOCK_API_URL}${endpoint}`);
        
        const response = await axios.get(`${STOCK_API_URL}${endpoint}`, {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'VanLang-Budget-Debug/1.0'
            }
        });
        
        const responseTime = Date.now() - startTime;
        
        return {
            success: true,
            endpoint,
            status: response.status,
            data: response.data,
            timestamp,
            responseTime
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                endpoint,
                status: error.response?.status,
                error: `${error.response?.status} ${error.response?.statusText || error.message}`,
                timestamp,
                responseTime
            };
        }
        
        return {
            success: false,
            endpoint,
            error: `Network Error: ${error}`,
            timestamp,
            responseTime
        };
    }
}

/**
 * Test endpoint /api/stock/realtime
 */
export async function testRealtimeEndpoint(symbols: string = 'VNM,VCB,HPG', source: string = 'TCBS'): Promise<DebugResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const endpoint = `/api/stock/realtime?symbols=${symbols}&source=${source}`;
    
    try {
        console.log(`[DEBUG] Testing realtime endpoint: ${STOCK_API_URL}${endpoint}`);
        
        const response = await axios.get(`${STOCK_API_URL}${endpoint}`, {
            timeout: 20000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'VanLang-Budget-Debug/1.0'
            }
        });
        
        const responseTime = Date.now() - startTime;
        
        return {
            success: true,
            endpoint,
            status: response.status,
            data: response.data,
            timestamp,
            responseTime
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                endpoint,
                status: error.response?.status,
                error: `${error.response?.status} ${error.response?.statusText || error.message}`,
                timestamp,
                responseTime
            };
        }
        
        return {
            success: false,
            endpoint,
            error: `Network Error: ${error}`,
            timestamp,
            responseTime
        };
    }
}

/**
 * Test endpoint /api/stocks
 */
export async function testStocksListEndpoint(): Promise<DebugResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const endpoint = '/api/stocks';
    
    try {
        console.log(`[DEBUG] Testing stocks list endpoint: ${STOCK_API_URL}${endpoint}`);
        
        const response = await axios.get(`${STOCK_API_URL}${endpoint}`, {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'VanLang-Budget-Debug/1.0'
            }
        });
        
        const responseTime = Date.now() - startTime;
        
        return {
            success: true,
            endpoint,
            status: response.status,
            data: response.data,
            timestamp,
            responseTime
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        if (axios.isAxiosError(error)) {
            return {
                success: false,
                endpoint,
                status: error.response?.status,
                error: `${error.response?.status} ${error.response?.statusText || error.message}`,
                timestamp,
                responseTime
            };
        }
        
        return {
            success: false,
            endpoint,
            error: `Network Error: ${error}`,
            timestamp,
            responseTime
        };
    }
}

/**
 * Chạy tất cả các test
 */
export async function runAllStockApiTests(): Promise<DebugResult[]> {
    console.log('[DEBUG] Running comprehensive Stock API tests...');
    
    const results: DebugResult[] = [];
    
    // Test 1: Connection
    console.log('[DEBUG] Test 1: Basic connection');
    results.push(await testStockApiConnection());
    
    // Test 2: Price endpoint
    console.log('[DEBUG] Test 2: Price endpoint');
    results.push(await testStockPriceEndpoint('VNM'));
    
    // Test 3: Stocks list endpoint
    console.log('[DEBUG] Test 3: Stocks list endpoint');
    results.push(await testStocksListEndpoint());
    
    // Test 4: Realtime endpoint
    console.log('[DEBUG] Test 4: Realtime endpoint');
    results.push(await testRealtimeEndpoint('VNM,VCB,HPG', 'TCBS'));
    
    // Summary
    const successCount = results.filter(r => r.success).length;
    console.log(`[DEBUG] Tests completed: ${successCount}/${results.length} successful`);
    
    return results;
}

/**
 * Format kết quả test để hiển thị
 */
export function formatTestResults(results: DebugResult[]): string {
    let output = '=== STOCK API DEBUG RESULTS ===\n\n';
    
    results.forEach((result, index) => {
        output += `Test ${index + 1}: ${result.endpoint}\n`;
        output += `Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
        output += `HTTP Status: ${result.status || 'N/A'}\n`;
        output += `Response Time: ${result.responseTime || 'N/A'}ms\n`;
        
        if (result.error) {
            output += `Error: ${result.error}\n`;
        }
        
        if (result.data) {
            output += `Data Preview: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...\n`;
        }
        
        output += `Timestamp: ${result.timestamp}\n`;
        output += '---\n\n';
    });
    
    return output;
}
