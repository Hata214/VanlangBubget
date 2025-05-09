'use client'

import React from 'react'
import { Providers } from '@/redux/provider'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    return <Providers>{children}</Providers>
}