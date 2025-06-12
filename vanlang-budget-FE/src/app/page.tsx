'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to Vietnamese homepage by default
        router.replace('/vi')
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-xl">Đang chuyển hướng...</div>
        </div>
    )
}