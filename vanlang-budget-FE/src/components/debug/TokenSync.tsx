'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { getCookie } from 'cookies-next'
import { getToken, saveTokenToCookie } from '@/services/api'

export default function TokenSync() {
    const { data: session } = useSession()
    const [syncResult, setSyncResult] = useState<string>('')

    const syncTokens = () => {
        console.log('=== Token Sync Debug ===')
        
        // Get tokens from various sources
        const sessionUser = session?.user as any
        const sessionAccessToken = sessionUser?.accessToken
        const sessionRefreshToken = sessionUser?.refreshToken
        
        const cookieToken = getCookie('token')
        const cookieRefreshToken = getCookie('refreshToken')
        
        const localStorageToken = localStorage.getItem('token')
        const localStorageRefreshToken = localStorage.getItem('refreshToken')
        
        const apiToken = getToken()
        
        console.log('Token sources:', {
            sessionAccessToken: !!sessionAccessToken,
            cookieToken: !!cookieToken,
            localStorageToken: !!localStorageToken,
            apiToken: !!apiToken
        })
        
        // Determine the best token to use
        let bestToken = sessionAccessToken || cookieToken || localStorageToken || apiToken
        let bestRefreshToken = sessionRefreshToken || cookieRefreshToken || localStorageRefreshToken
        
        if (bestToken) {
            // Sync to all storage methods
            localStorage.setItem('token', bestToken)
            if (bestRefreshToken) {
                localStorage.setItem('refreshToken', bestRefreshToken)
            }
            
            // Save to cookies
            saveTokenToCookie(bestToken, bestRefreshToken || '')
            
            setSyncResult(`✅ Token synced successfully! Source: ${
                sessionAccessToken ? 'NextAuth Session' :
                cookieToken ? 'Cookie' :
                localStorageToken ? 'LocalStorage' :
                'API Service'
            }`)
            
            console.log('Token synced to all storage methods')
        } else {
            setSyncResult('❌ No token found in any source!')
            console.log('No token found in any source')
        }
    }

    const clearAllTokens = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        setSyncResult('🗑️ All tokens cleared!')
        console.log('All tokens cleared')
    }

    if (process.env.NODE_ENV !== 'development') {
        return null
    }

    return (
        <div className="fixed top-4 left-4 bg-orange-900 text-white p-4 rounded-lg text-xs max-w-md z-50">
            <h3 className="font-bold mb-2">Token Sync</h3>
            
            <div className="space-y-1 mb-4">
                <button 
                    onClick={syncTokens}
                    className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs w-full"
                >
                    🔄 Sync Tokens
                </button>
                
                <button 
                    onClick={clearAllTokens}
                    className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs w-full"
                >
                    🗑️ Clear All Tokens
                </button>
            </div>

            {syncResult && (
                <div className="border-t pt-2">
                    <div className="text-xs">{syncResult}</div>
                </div>
            )}
        </div>
    )
}
