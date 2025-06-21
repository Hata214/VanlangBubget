'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    GlobeIcon,
    UserIcon,
    BellIcon,
    LockIcon,
    CircleDollarSignIcon,
    ArrowRightIcon,
    Languages,
    BadgeInfo,
    LogOut
} from 'lucide-react'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { useAppDispatch } from '@/redux/hooks'
import { logout } from '@/redux/features/authSlice'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter()
    const dispatch = useAppDispatch()

    const handleLogout = () => {
        dispatch(logout())
        router.push('/login')
    }

    return (
        <MainLayout>
            <div className="container pb-12 pt-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
                    <p className="text-gray-500 mt-2">{t('settings.subtitle')}</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5" />
                                {t('settings.userProfile')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">{t('settings.userProfileDesc')}</p>
                            <Link href={`/${locale}/profile`}>
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    {t('settings.manageProfile')}
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BellIcon className="h-5 w-5" />
                                {t('notifications.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">{t('settings.notificationsDesc')}</p>
                            <Link href={`/${locale}/settings/notifications`}>
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    {t('settings.manageNotifications')}
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LockIcon className="h-5 w-5" />
                                {t('settings.security')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">{t('settings.securityDesc')}</p>
                            <Link href={`/${locale}/profile`}>
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    {t('settings.changePassword')}
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GlobeIcon className="h-5 w-5" />
                                {t('settings.languageSection')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">{t('settings.languageDesc')}</p>
                            <LanguageToggle />
                        </CardContent>
                    </Card>

                    {/* Currency Format Card - Hidden as requested */}
                    {/*
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CircleDollarSignIcon className="h-5 w-5" />
                                {t('settings.currencyFormat')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">{t('settings.currencyFormatDesc')}</p>
                            <Link href={`/${locale}/settings/currency`}>
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    {t('settings.changeCurrency')}
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                    */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BadgeInfo className="h-5 w-5" />
                                {t('settings.about')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">{t('settings.aboutDesc')}</p>
                            <Link href={`/${locale}/about`}>
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    {t('settings.aboutApp')}
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-500">
                                <LogOut className="h-5 w-5" />
                                {t('common.logout')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">{t('settings.logoutDesc')}</p>
                            <Button
                                variant="destructive"
                                className="flex w-full items-center justify-between"
                                onClick={handleLogout}
                            >
                                {t('common.logout')}
                                <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
}
