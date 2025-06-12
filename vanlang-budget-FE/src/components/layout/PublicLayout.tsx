'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import { SettingsToggle } from '@/components/ui/SettingsToggle'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle' // Thêm import LanguageToggle
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/DropdownMenu'
import { User, Settings, LogOut } from 'lucide-react'
import { useAppDispatch } from '@/redux/hooks'
import { logout } from '@/redux/features/authSlice'
import { useHeaderContent } from '@/hooks/useHeaderContent'

interface PublicLayoutProps {
    children: ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
    const t = useTranslations()
    const locale = useLocale()
    const pathname = usePathname()
    const dispatch = useAppDispatch()
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
    const { content: headerContent, loading: headerLoading } = useHeaderContent()

    // Debug logging
    console.log('🏠 PublicLayout - headerContent:', headerContent);
    console.log('🏠 PublicLayout - headerLoading:', headerLoading);

    // Các trang trong thanh điều hướng - sử dụng admin content với locale
    const navLinks = [
        { href: `/${locale}/about`, label: headerContent?.nav1 || t('header.links.aboutUs') },
        { href: `/${locale}/features`, label: headerContent?.nav2 || t('header.links.features') },
        { href: `/${locale}/roadmap`, label: headerContent?.nav5 || t('header.links.roadmap') },
        { href: `/${locale}/pricing`, label: headerContent?.nav3 || t('header.links.pricing') },
        { href: `/${locale}/contact`, label: headerContent?.nav4 || t('header.links.contact') }
    ]

    console.log('🔗 PublicLayout - navLinks:', navLinks);

    const handleLogout = () => {
        dispatch(logout())
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="bg-card shadow-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center h-14">
                            <Link href={`/${locale}`} className="flex items-center space-x-2">
                                <Image
                                    src="/logo-vlb.png"
                                    alt="VangLang Budget Logo"
                                    width={32}
                                    height={32}
                                    className="rounded-sm"
                                />
                                <span className="hidden font-bold md:inline-block">
                                    {headerContent?.logo || t('app.name')}
                                </span>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium ${pathname === link.href
                                        ? 'text-primary'
                                        : 'text-foreground hover:text-primary'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Right section */}
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard">
                                <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {t('common.goToWallet')}
                                </Button>
                            </Link>
                            <ThemeToggle />
                            <LanguageToggle /> {/* Thêm LanguageToggle ở đây */}

                            {isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="rounded-full w-10 h-10 p-0">
                                            <User className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <div className="flex items-center justify-start gap-2 p-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col space-y-0.5">
                                                <p className="text-sm font-medium">
                                                    {user?.firstName} {user?.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {user?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile" className="cursor-pointer flex w-full items-center">
                                                <User className="mr-2 h-4 w-4" />
                                                <span>{t('profile.account')}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings" className="cursor-pointer flex w-full items-center">
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>{t('settings.title')}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>{t('profile.logout')}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="hidden md:flex space-x-3">
                                    <Link href="/login">
                                        <Button variant="outline">{headerContent?.loginButton || t('header.buttons.login')}</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button>{headerContent?.signupButton || t('header.buttons.register')}</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    )
}
