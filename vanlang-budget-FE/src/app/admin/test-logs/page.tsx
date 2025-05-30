'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestLogsPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testLogs = async () => {
        try {
            setLoading(true);
            console.log('🔄 Testing activity logs...');

            const response = await fetch('/api/admin/test-logs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status);

            const data = await response.json();
            console.log('📊 Response data:', data);
            
            setResult(data);
        } catch (error) {
            console.error('❌ Error testing logs:', error);
            setResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const testActivityLogsAPI = async () => {
        try {
            setLoading(true);
            console.log('🔄 Testing activity logs API...');

            const response = await fetch('/api/admin/activity-logs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Activity logs response status:', response.status);

            const data = await response.json();
            console.log('📊 Activity logs data:', data);
            
            setResult(data);
        } catch (error) {
            console.error('❌ Error testing activity logs API:', error);
            setResult({ success: false, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Test Activity Logs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button 
                            onClick={testLogs} 
                            disabled={loading}
                            variant="outline"
                        >
                            {loading ? 'Testing...' : 'Test Create Logs'}
                        </Button>
                        
                        <Button 
                            onClick={testActivityLogsAPI} 
                            disabled={loading}
                        >
                            {loading ? 'Testing...' : 'Test Activity Logs API'}
                        </Button>
                    </div>

                    {result && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">Result:</h3>
                            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
