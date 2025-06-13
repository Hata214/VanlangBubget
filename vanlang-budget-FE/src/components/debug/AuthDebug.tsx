'use client'

import { useEffect, useState } from 'react'
import { useAppSelector } from '@/redux/hooks'
import { getToken, getRefreshToken } from '@/services/api'
import { useSession } from 'next-auth/react'

export default function AuthDebug() {
    const { user, token, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth)
    const { data: session, status } = useSession()
    const [clientToken, setClientToken] = useState<string | null>(null)
    const [clientRefreshToken, setClientRefreshToken] = useState<string | null>(null)

    useEffect(() => {
        setClientToken(getToken())
        setClientRefreshToken(getRefreshToken())
    }, [])

    if (process.env.NODE_ENV !== 'development') {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
            <h3 className="font-bold mb-2">Auth Debug Info</h3>
            
            <div className="space-y-1">
                <div><strong>Redux Auth:</strong></div>
                <div>- isAuthenticated: {isAuthenticated ? 'true' : 'false'}</div>
                <div>- isLoading: {isLoading ? 'true' : 'false'}</div>
                <div>- error: {error || 'none'}</div>
                <div>- user: {user ? `${user.firstName} ${user.lastName} (${user.email})` : 'null'}</div>
                <div>- token: {token ? 'exists' : 'null'}</div>
                
                <div className="mt-2"><strong>NextAuth:</strong></div>
                <div>- status: {status}</div>
                <div>- session: {session ? `${(session.user as any)?.name || (session.user as any)?.email}` : 'null'}</div>
                
                <div className="mt-2"><strong>Client Tokens:</strong></div>
                <div>- accessToken: {clientToken ? `${clientToken.substring(0, 20)}...` : 'null'}</div>
                <div>- refreshToken: {clientRefreshToken ? `${clientRefreshToken.substring(0, 20)}...` : 'null'}</div>
            </div>
        </div>
    )
}
