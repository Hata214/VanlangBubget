'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Globe, Sun, Moon, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel
} from '@/components/ui/DropdownMenu'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'

export function SettingsToggle() {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { changeLanguage, isChangingLanguage } = useLanguage()
    const [mounted, setMounted] = useState(false)

    // Đảm bảo component đã mount để tránh hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLanguageChange = (newLocale: 'vi' | 'en') => {
        // Lấy pathname hiện tại và thay thế locale
        const currentPath = window.location.pathname
        const pathWithoutLocale = currentPath.replace(/^\/(vi|en)/, '') || '/'
        const newPath = `/${newLocale}${pathWithoutLocale}`
        
        router.push(newPath)
    }

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme)
    }

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Settings className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">{t('common.settings')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('common.settings')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Language Settings */}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    {t('settings.language.label')}
                </DropdownMenuLabel>
                <DropdownMenuItem 
                    onClick={() => handleLanguageChange('vi')}
                    className={`flex items-center ${locale === 'vi' ? 'bg-accent' : ''}`}
                    disabled={isChangingLanguage}
                >
                    <Globe className="mr-2 h-4 w-4" />
                    <span className="mr-2">🇻🇳</span>
                    Tiếng Việt
                    {locale === 'vi' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center ${locale === 'en' ? 'bg-accent' : ''}`}
                    disabled={isChangingLanguage}
                >
                    <Globe className="mr-2 h-4 w-4" />
                    <span className="mr-2">🇺🇸</span>
                    English
                    {locale === 'en' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Theme Settings */}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    {t('settings.theme.label')}
                </DropdownMenuLabel>
                <DropdownMenuItem 
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center ${theme === 'light' ? 'bg-accent' : ''}`}
                >
                    <Sun className="mr-2 h-4 w-4" />
                    {t('settings.theme.light')}
                    {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center ${theme === 'dark' ? 'bg-accent' : ''}`}
                >
                    <Moon className="mr-2 h-4 w-4" />
                    {t('settings.theme.dark')}
                    {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => handleThemeChange('system')}
                    className={`flex items-center ${theme === 'system' ? 'bg-accent' : ''}`}
                >
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings.theme.system')}
                    {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
