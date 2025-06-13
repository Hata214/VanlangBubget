'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getToken, saveTokenToCookie } from '@/services/api'
import Cookies from 'js-cookie'

export function useAuthToken() {
    const { data: session, status } = useSession()

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Kiểm tra xem có token trong cookie không
            const existingToken = getToken()
            
            if (!existingToken) {
                // Nếu không có token, thử lấy từ cookie được set bởi NextAuth
                const nextAuthToken = Cookies.get('token')
                
                if (nextAuthToken) {
                    console.log('Found NextAuth token, saving to our token system...')
                    saveTokenToCookie(nextAuthToken)
                } else {
                    console.warn('No token found in NextAuth cookies')
                }
            } else {
                console.log('Token already exists in our system')
            }
        } else if (status === 'unauthenticated') {
            console.log('User is unauthenticated, clearing tokens')
            // Có thể cần clear tokens ở đây
        }
    }, [session, status])

    return {
        session,
        status,
        hasToken: !!getToken()
    }
}
