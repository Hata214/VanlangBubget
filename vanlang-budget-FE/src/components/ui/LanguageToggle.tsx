'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type LanguageToggleProps = {
    className?: string
    variant?: 'default' | 'icon' // default: select box, icon: chỉ hiện icon
}

export function LanguageToggle({ className, variant = 'default' }: LanguageToggleProps) {
    const t = useTranslations('settings.language')
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [isChanging, setIsChanging] = useState(false)

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

    // Danh sách các đường dẫn protected (sau khi đăng nhập)
    const protectedPaths = [
        '/dashboard',
        '/incomes',
        '/expenses',
        '/loans',
        '/investments',
        '/budgets',
        '/reports',
        '/notifications'
    ];

    // Kiểm tra xem có phải protected path không
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    // Use simple locale switching without context dependency

    // Xử lý khi thay đổi ngôn ngữ
    const handleLanguageChange = (newLocale: string) => {
        if (newLocale === locale || isChanging) return;

        setIsChanging(true);

        if (isProtectedPath) {
            // Đối với protected paths, sử dụng simple reload
            localStorage.setItem('preferred-locale', newLocale);
            window.location.reload(); // Reload để cập nhật translations
        } else {
            // Đối với public paths, sử dụng routing với locale prefix
            const pathWithoutLocale = pathname.replace(/^\/(vi|en)/, '') || '';
            const newPath = `/${newLocale}${pathWithoutLocale}`;
            router.push(newPath);
        }

        // Reset loading state sau một khoảng thời gian
        setTimeout(() => setIsChanging(false), 1000);
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
                        const newLocale = locale === 'vi' ? 'en' : 'vi';
                        handleLanguageChange(newLocale);
                    }}
                    disabled={isChanging}
                    className="h-8 w-8 sm:h-10 sm:w-10"
                >
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only">{t('label')}</span>
                </Button>

                {locale && (
                    <span className="absolute -bottom-1 -right-1 sm:-bottom-1 sm:-right-1 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-primary text-[8px] sm:text-[10px] font-bold text-primary-foreground">
                        {locale.toUpperCase()}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            <Select
                value={locale}
                onValueChange={handleLanguageChange}
                disabled={isChanging}
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