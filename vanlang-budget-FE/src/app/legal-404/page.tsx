'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Legal404() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to the new legal page
        router.replace('/legal')
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                    Đang chuyển hướng...
                </h1>
                <p className="text-muted-foreground">
                    Bạn sẽ được chuyển đến trang tài liệu pháp lý mới
                </p>
            </div>
        </div>
    )
} 