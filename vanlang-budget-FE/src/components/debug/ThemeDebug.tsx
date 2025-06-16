'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeDebug() {
    const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [debugInfo, setDebugInfo] = useState<any>({})

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            const info = {
                theme,
                resolvedTheme,
                systemTheme,
                htmlClass: document.documentElement.className,
                htmlDataTheme: document.documentElement.getAttribute('data-theme'),
                localStorage: typeof window !== 'undefined' ? localStorage.getItem('vanlang-budget-theme') : null,
                timestamp: new Date().toLocaleTimeString()
            }
            setDebugInfo(info)
            console.log('Theme Debug Info:', info)
        }
    }, [theme, resolvedTheme, systemTheme, mounted])

    if (!mounted) {
        return null
    }

    return (
        <div className="fixed bottom-4 left-4 z-[9999] p-4 bg-background border border-border rounded-lg shadow-lg max-w-xs text-xs">
            <div className="font-bold mb-2">Theme Debug (Mobile)</div>
            <div className="space-y-1">
                <div>Theme: <span className="font-mono">{theme}</span></div>
                <div>Resolved: <span className="font-mono">{resolvedTheme}</span></div>
                <div>System: <span className="font-mono">{systemTheme}</span></div>
                <div>HTML Class: <span className="font-mono text-xs">{debugInfo.htmlClass}</span></div>
                <div>Storage: <span className="font-mono">{debugInfo.localStorage}</span></div>
                <div>Updated: <span className="font-mono">{debugInfo.timestamp}</span></div>
            </div>
            <div className="mt-2 flex gap-1">
                <button
                    onClick={() => setTheme('light')}
                    className="px-2 py-1 text-xs bg-yellow-200 dark:bg-yellow-800 rounded"
                >
                    Light
                </button>
                <button
                    onClick={() => setTheme('dark')}
                    className="px-2 py-1 text-xs bg-gray-800 text-white rounded"
                >
                    Dark
                </button>
                <button
                    onClick={() => setTheme('system')}
                    className="px-2 py-1 text-xs bg-blue-200 dark:bg-blue-800 rounded"
                >
                    System
                </button>
            </div>
        </div>
    )
} 