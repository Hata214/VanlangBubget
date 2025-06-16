'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Chỉ hiển thị sau khi component được mount để tránh hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Chuyển đổi chế độ màu"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="h-8 w-8 sm:h-10 sm:w-10"
        >
            {theme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
        </Button>
    )
} 