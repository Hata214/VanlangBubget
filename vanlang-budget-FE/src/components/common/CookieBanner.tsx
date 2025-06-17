'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, Settings, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useTranslations } from 'next-intl'

interface CookieBannerProps {
    className?: string
}

export function CookieBanner({ className = '' }: CookieBannerProps) {
    const t = useTranslations('legal.cookieBanner')
    const [isVisible, setIsVisible] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [preferences, setPreferences] = useState({
        essential: true, // Always true, cannot be disabled
        functional: true,
        analytics: true,
        marketing: false
    })

    useEffect(() => {
        // Check if user has already made a choice
        const cookieConsent = localStorage.getItem('vanlang-cookie-consent')
        if (!cookieConsent) {
            setIsVisible(true)
        }
    }, [])

    const handleAcceptAll = () => {
        const consent = {
            essential: true,
            functional: true,
            analytics: true,
            marketing: true,
            timestamp: Date.now()
        }
        localStorage.setItem('vanlang-cookie-consent', JSON.stringify(consent))
        setIsVisible(false)
    }

    const handleAcceptSelected = () => {
        const consent = {
            ...preferences,
            essential: true, // Always true
            timestamp: Date.now()
        }
        localStorage.setItem('vanlang-cookie-consent', JSON.stringify(consent))
        setIsVisible(false)
    }

    const handleRejectAll = () => {
        const consent = {
            essential: true, // Only essential cookies
            functional: false,
            analytics: false,
            marketing: false,
            timestamp: Date.now()
        }
        localStorage.setItem('vanlang-cookie-consent', JSON.stringify(consent))
        setIsVisible(false)
    }

    const handlePreferenceChange = (type: keyof typeof preferences, value: boolean) => {
        if (type === 'essential') return // Cannot change essential cookies
        setPreferences(prev => ({ ...prev, [type]: value }))
    }

    if (!isVisible) return null

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg ${className}`}>
            <div className="max-w-6xl mx-auto">
                <Card className="border-2 border-indigo-200 dark:border-indigo-800">
                    <CardContent className="p-6">
                        {!showSettings ? (
                            // Main banner
                            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <Cookie className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground mb-2">
                                            {t('title')}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {t('description')}
                                        </p>
                                        <Link href="/legal/cookies" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {t('learnMore')}
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col xl:flex-row">
                                    <Button onClick={handleAcceptAll} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        <Check className="w-4 h-4 mr-2" />
                                        {t('acceptAll')}
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowSettings(true)}>
                                        <Settings className="w-4 h-4 mr-2" />
                                        {t('customize')}
                                    </Button>
                                    <Button variant="outline" onClick={handleRejectAll}>
                                        {t('essentialOnly')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Settings panel
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-foreground">Cài đặt Cookie</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {/* Essential Cookies */}
                                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-foreground">Cookie cần thiết</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Cần thiết cho hoạt động cơ bản của website (đăng nhập, bảo mật)
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <div className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Functional Cookies */}
                                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-foreground">Cookie chức năng</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Ghi nhớ tùy chọn của bạn (ngôn ngữ, theme, cài đặt)
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <button
                                                onClick={() => handlePreferenceChange('functional', !preferences.functional)}
                                                className={`w-10 h-6 rounded-full transition-colors ${preferences.functional ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences.functional ? 'translate-x-5' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Analytics Cookies */}
                                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-foreground">Cookie phân tích</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Giúp chúng tôi hiểu cách bạn sử dụng website để cải thiện dịch vụ
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <button
                                                onClick={() => handlePreferenceChange('analytics', !preferences.analytics)}
                                                className={`w-10 h-6 rounded-full transition-colors ${preferences.analytics ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences.analytics ? 'translate-x-5' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Marketing Cookies */}
                                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-foreground">Cookie marketing</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Cá nhân hóa quảng cáo và theo dõi hiệu quả chiến dịch
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <button
                                                onClick={() => handlePreferenceChange('marketing', !preferences.marketing)}
                                                className={`w-10 h-6 rounded-full transition-colors ${preferences.marketing ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences.marketing ? 'translate-x-5' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setShowSettings(false)}>
                                        Hủy
                                    </Button>
                                    <Button onClick={handleAcceptSelected} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Lưu tùy chọn
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 