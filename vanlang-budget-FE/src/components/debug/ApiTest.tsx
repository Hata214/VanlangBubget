'use client'

import { useState } from 'react'
import api from '@/services/api'
import { Button } from '@/components/ui/Button'
import { testBackendConnection, testAuthEndpoint } from '@/utils/testBackend'
import { getToken } from '@/services/api'

export default function ApiTest() {
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const testApiCall = async () => {
        setLoading(true)
        setResult(null)

        try {
            console.log('Testing API call to /api/auth/me...')
            const response = await api.get('/api/auth/me')
            console.log('API response:', response)
            setResult({
                success: true,
                status: response.status,
                data: response.data
            })
        } catch (error: any) {
            console.error('API error:', error)
            setResult({
                success: false,
                status: error.response?.status || 0,
                message: error.message,
                data: error.response?.data
            })
        } finally {
            setLoading(false)
        }
    }

    const testBackend = async () => {
        setLoading(true)
        setResult(null)

        const backendResult = await testBackendConnection()
        setResult(backendResult)
        setLoading(false)
    }

    const testDirectAuth = async () => {
        setLoading(true)
        setResult(null)

        const token = getToken()
        if (!token) {
            setResult({ success: false, message: 'No token found' })
            setLoading(false)
            return
        }

        const authResult = await testAuthEndpoint(token)
        setResult(authResult)
        setLoading(false)
    }

    if (process.env.NODE_ENV !== 'development') {
        return null
    }

    return (
        <div className="fixed bottom-4 left-4 bg-blue-900 text-white p-4 rounded-lg text-xs max-w-md z-50">
            <h3 className="font-bold mb-2">API Test</h3>

            <div className="space-y-1">
                <Button
                    onClick={testBackend}
                    disabled={loading}
                    className="mb-1 text-xs px-2 py-1 w-full"
                >
                    {loading ? 'Testing...' : 'Test Backend Health'}
                </Button>

                <Button
                    onClick={testDirectAuth}
                    disabled={loading}
                    className="mb-1 text-xs px-2 py-1 w-full"
                >
                    {loading ? 'Testing...' : 'Test Direct Auth'}
                </Button>

                <Button
                    onClick={testApiCall}
                    disabled={loading}
                    className="mb-2 text-xs px-2 py-1 w-full"
                >
                    {loading ? 'Testing...' : 'Test via Axios'}
                </Button>
            </div>

            {result && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    <div><strong>Status:</strong> {result.status}</div>
                    <div><strong>Success:</strong> {result.success ? 'true' : 'false'}</div>
                    {result.message && <div><strong>Message:</strong> {result.message}</div>}
                    {result.data && (
                        <div>
                            <strong>Data:</strong>
                            <pre className="text-xs bg-black p-1 rounded mt-1">
                                {JSON.stringify(result.data, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
