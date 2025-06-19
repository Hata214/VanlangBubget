'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { runAllStockApiTests, formatTestResults, type DebugResult } from '@/utils/debugStockApi';
import { getDirectRealtimeStocks } from '@/services/stockApiService';
import { toast } from '@/components/ui/Toaster';

export default function StockApiTester() {
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState<DebugResult[]>([]);
    const [lastTest, setLastTest] = useState<string>('');

    const runQuickTest = async () => {
        setTesting(true);
        try {
            console.log('[QUICK TEST] Starting quick stock API test...');
            
            // Test 1: Direct realtime call
            const realtimeResult = await getDirectRealtimeStocks('VNM,VCB', 'TCBS');
            console.log('[QUICK TEST] Realtime result:', realtimeResult);
            
            if (realtimeResult.error) {
                toast.error("Quick Test Failed", `Error: ${realtimeResult.error}`);
            } else {
                toast.success("Quick Test Success", `Got ${realtimeResult.count} stocks from ${realtimeResult.source}`);
            }
            
            setLastTest(`Quick Test - ${new Date().toLocaleTimeString()}: ${realtimeResult.error ? 'FAILED' : 'SUCCESS'} - ${realtimeResult.count} stocks from ${realtimeResult.source}`);
            
        } catch (error) {
            console.error('[QUICK TEST] Failed:', error);
            toast.error("Quick Test Failed", "Check console for details");
            setLastTest(`Quick Test - ${new Date().toLocaleTimeString()}: ERROR - ${error}`);
        } finally {
            setTesting(false);
        }
    };

    const runFullTest = async () => {
        setTesting(true);
        try {
            console.log('[FULL TEST] Starting comprehensive stock API tests...');
            toast.info("Full Test Started", "Running comprehensive tests...");
            
            const testResults = await runAllStockApiTests();
            setResults(testResults);
            
            const successCount = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;
            
            console.log('[FULL TEST] Results:', testResults);
            console.log(formatTestResults(testResults));
            
            if (successCount === totalTests) {
                toast.success("All Tests Passed", `${successCount}/${totalTests} tests successful`);
            } else if (successCount > 0) {
                toast.warning("Some Tests Failed", `${successCount}/${totalTests} tests successful`);
            } else {
                toast.error("All Tests Failed", "Check console for details");
            }
            
            setLastTest(`Full Test - ${new Date().toLocaleTimeString()}: ${successCount}/${totalTests} passed`);
            
        } catch (error) {
            console.error('[FULL TEST] Failed:', error);
            toast.error("Full Test Failed", "Check console for details");
            setLastTest(`Full Test - ${new Date().toLocaleTimeString()}: ERROR - ${error}`);
        } finally {
            setTesting(false);
        }
    };

    const clearResults = () => {
        setResults([]);
        setLastTest('');
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>🔧 Stock API Tester</span>
                    <div className="text-sm text-muted-foreground">
                        URL: https://my-app-flashapi.onrender.com
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Test Buttons */}
                <div className="flex gap-2 flex-wrap">
                    <Button 
                        onClick={runQuickTest} 
                        disabled={testing}
                        variant="default"
                        size="sm"
                    >
                        {testing ? 'Testing...' : 'Quick Test (Realtime)'}
                    </Button>
                    
                    <Button 
                        onClick={runFullTest} 
                        disabled={testing}
                        variant="outline"
                        size="sm"
                    >
                        {testing ? 'Testing...' : 'Full Test (All Endpoints)'}
                    </Button>
                    
                    <Button 
                        onClick={clearResults} 
                        disabled={testing}
                        variant="ghost"
                        size="sm"
                    >
                        Clear Results
                    </Button>
                </div>

                {/* Last Test Result */}
                {lastTest && (
                    <div className="p-3 bg-muted rounded-md">
                        <div className="text-sm font-medium">Last Test:</div>
                        <div className="text-sm text-muted-foreground">{lastTest}</div>
                    </div>
                )}

                {/* Full Test Results */}
                {results.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Test Results:</h3>
                        {results.map((result, index) => (
                            <div 
                                key={index} 
                                className={`p-3 rounded-md border ${
                                    result.success 
                                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                                        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">
                                        {result.success ? '✅' : '❌'} {result.endpoint}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {result.responseTime}ms
                                    </div>
                                </div>
                                
                                {result.status && (
                                    <div className="text-sm text-muted-foreground">
                                        Status: {result.status}
                                    </div>
                                )}
                                
                                {result.error && (
                                    <div className="text-sm text-red-600 dark:text-red-400">
                                        Error: {result.error}
                                    </div>
                                )}
                                
                                {result.data && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Data: {JSON.stringify(result.data, null, 2).substring(0, 100)}...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Instructions */}
                <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>Quick Test:</strong> Tests realtime endpoint only</div>
                    <div><strong>Full Test:</strong> Tests all endpoints (connection, price, stocks, realtime)</div>
                    <div><strong>Console:</strong> Check browser console for detailed logs</div>
                </div>
            </CardContent>
        </Card>
    );
}
