'use client'

import { SessionProvider } from 'next-auth/react'
import React from 'react'

// Không cần prop session nữa, SessionProvider sẽ tự xử lý ở client
interface NextAuthProviderProps {
    children: React.ReactNode
}

export default function NextAuthProvider({ children }: NextAuthProviderProps) {
    // SessionProvider sẽ tự động fetch session ở client khi không có prop session
    return <SessionProvider>{children}</SessionProvider>
}
