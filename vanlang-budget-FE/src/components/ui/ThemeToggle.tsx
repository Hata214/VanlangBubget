'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Chỉ hiển thị sau khi component được mount để tránh hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                disabled
            >
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 opacity-50" />
            </Button>
        )
    }

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            aria-label="Chuyển đổi chế độ màu"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="h-8 w-8 sm:h-10 sm:w-10 transition-colors"
        >
            {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 transition-transform" />
            ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5 transition-transform" />
            )}
        </Button>
    )
} 