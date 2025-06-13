'use client'

import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { fetchUserProfile } from '@/redux/features/authSlice'
import { getToken } from '@/services/api'
import api from '@/services/api'

export default function ProfileDebug() {
    const dispatch = useAppDispatch()
    const { user, isLoading, error } = useAppSelector((state) => state.auth)
    const [manualFetchResult, setManualFetchResult] = useState<any>(null)
    const [testing, setTesting] = useState(false)

    const testFetchUserProfile = async () => {
        setTesting(true)
        setManualFetchResult(null)
        
        console.log('=== Testing fetchUserProfile ===')
        console.log('Current token:', getToken())
        
        try {
            const result = await dispatch(fetchUserProfile()).unwrap()
            console.log('fetchUserProfile success:', result)
            setManualFetchResult({ success: true, data: result })
        } catch (error: any) {
            console.error('fetchUserProfile error:', error)
            setManualFetchResult({ success: false, error: error })
        }
        
        setTesting(false)
    }

    const testDirectApiCall = async () => {
        setTesting(true)
        setManualFetchResult(null)
        
        console.log('=== Testing direct API call ===')
        console.log('Current token:', getToken())
        
        try {
            const response = await api.get('/api/auth/me')
            console.log('Direct API call success:', response.data)
            setManualFetchResult({ success: true, data: response.data })
        } catch (error: any) {
            console.error('Direct API call error:', error)
            setManualFetchResult({ 
                success: false, 
                error: error.response?.data?.message || error.message,
                status: error.response?.status
            })
        }
        
        setTesting(false)
    }

    if (process.env.NODE_ENV !== 'development') {
        return null
    }

    return (
        <div className="fixed top-4 right-4 bg-purple-900 text-white p-4 rounded-lg text-xs max-w-md z-50 max-h-96 overflow-y-auto">
            <h3 className="font-bold mb-2">Profile Debug</h3>
            
            <div className="space-y-2 mb-4">
                <div><strong>Redux User:</strong></div>
                <div>- Loading: {isLoading ? 'true' : 'false'}</div>
                <div>- Error: {error || 'none'}</div>
                <div>- User exists: {user ? 'true' : 'false'}</div>
                {user && (
                    <div className="ml-2 text-xs">
                        <div>- ID: {user._id}</div>
                        <div>- Email: {user.email}</div>
                        <div>- Name: {user.firstName} {user.lastName}</div>
                        <div>- Phone: {user.phoneNumber || 'none'}</div>
                    </div>
                )}
            </div>

            <div className="space-y-1 mb-4">
                <button 
                    onClick={testFetchUserProfile}
                    disabled={testing}
                    className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs w-full"
                >
                    {testing ? 'Testing...' : 'Test Redux fetchUserProfile'}
                </button>
                
                <button 
                    onClick={testDirectApiCall}
                    disabled={testing}
                    className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs w-full"
                >
                    {testing ? 'Testing...' : 'Test Direct API Call'}
                </button>
            </div>

            {manualFetchResult && (
                <div className="border-t pt-2">
                    <div><strong>Test Result:</strong></div>
                    <div>Success: {manualFetchResult.success ? 'true' : 'false'}</div>
                    {manualFetchResult.success ? (
                        <div className="text-green-300 text-xs">
                            <div>User: {manualFetchResult.data?.user?.email || manualFetchResult.data?.email}</div>
                        </div>
                    ) : (
                        <div className="text-red-300 text-xs">
                            <div>Error: {manualFetchResult.error}</div>
                            {manualFetchResult.status && <div>Status: {manualFetchResult.status}</div>}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
