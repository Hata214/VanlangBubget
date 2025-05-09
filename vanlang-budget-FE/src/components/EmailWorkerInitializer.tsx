'use client'

import { useEffect } from 'react'

export function EmailWorkerInitializer() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('@/services/workers/emailWorker')
        }
    }, [])

    return null
} 