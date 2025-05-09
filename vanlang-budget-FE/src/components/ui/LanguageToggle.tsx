'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { locales } from '@/i18n'
import { useLanguage } from '@/contexts/LanguageContext'

type LanguageToggleProps = {
    className?: string
    variant?: 'default' | 'icon' // default: select box, icon: chỉ hiện icon
}

export function LanguageToggle({ className, variant = 'default' }: LanguageToggleProps) {
    const t = useTranslations('settings.language')
    const defaultLocale = useLocale()
    const { locale, changeLanguage, isChangingLanguage } = useLanguage()
    const [currentLocale, setCurrentLocale] = useState(defaultLocale)

    // Cập nhật trạng thái local khi locale trong context thay đổi
    useEffect(() => {
        if (locale) {
            setCurrentLocale(locale)
        }
    }, [locale])

    // Danh sách ngôn ngữ được hỗ trợ
    const languageOptions = [
        {
            value: 'vi',
            label: t('vietnamese')
        },
        {
            value: 'en',
            label: t('english')
        }
    ]

    // Xử lý khi thay đổi ngôn ngữ - bây giờ chỉ gọi changeLanguage từ context
    const handleLanguageChange = (newLocale: string) => {
        if (newLocale === currentLocale) return;
        changeLanguage(newLocale as any);
    }

    if (variant === 'icon') {
        return (
            <div className={cn("relative", className)}>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('label')}
                    title={t('label')}
                    onClick={() => {
                        // Chuyển đổi giữa tiếng Việt và tiếng Anh
                        const newLocale = currentLocale === 'vi' ? 'en' : 'vi';
                        handleLanguageChange(newLocale);
                    }}
                    disabled={isChangingLanguage}
                >
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">{t('label')}</span>
                </Button>

                {currentLocale && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {currentLocale.toUpperCase()}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            <Select
                value={currentLocale}
                onValueChange={handleLanguageChange}
                disabled={isChangingLanguage}
            >
                <SelectTrigger>
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <SelectValue placeholder={t('label')} />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
} 