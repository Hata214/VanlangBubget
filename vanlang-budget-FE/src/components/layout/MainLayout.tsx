'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import {
    UserIcon,
    HomeIcon,
    ArrowLeftStartOnRectangleIcon,
    DocumentTextIcon,
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    XMarkIcon,
    Bars3Icon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Menu, Bell } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { logout } from '@/redux/features/authSlice'
import { authService } from '@/services/authService'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Button } from '@/components/ui/Button'
import { NotificationDropdown } from '@/components/common/NotificationDropdown'
import NotificationBell from '../notification/NotificationBell'
import notificationService from '@/services/notificationService'
import { socketService, SocketEvent } from '@/services/socketService'
import ChatPopupVanLangBot from '@/components/chatbot/ChatPopupVanLangBot'

interface MainLayoutProps {
    children: React.ReactNode
}

// Component cho bell thông báo đơn giản
function SimpleBell({ unreadCount = 0 }) {
    const locale = useLocale();
    const router = useRouter();

    const handleClick = () => {
        router.push(`/${locale}/notifications`);
    };

    return (
        <Button variant="ghost" size="icon" onClick={handleClick} className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </Button>
    );
}

export default function MainLayout({ children }: MainLayoutProps) {
    const t = useTranslations();
    const locale = useLocale();
    const pathname = usePathname() || '';
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { token, user } = useAppSelector((state) => state.auth);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    // Cấu hình thông tin điều hướng từ các file dịch
    const navigation = [
        { name: t('navigation.dashboard'), href: '/dashboard', icon: HomeIcon },
        { name: t('navigation.incomes'), href: '/incomes', icon: BanknotesIcon },
        { name: t('navigation.expenses'), href: '/expenses', icon: BanknotesIcon },
        { name: t('navigation.loans'), href: '/loans', icon: DocumentTextIcon },
        {
            name: t('navigation.investments'), href: '/investments', icon: () => (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
            )
        },
        {
            name: t('notifications.title'), href: '/notifications', icon: () => (
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
            )
        },
    ]

    // Lấy số lượng thông báo chưa đọc
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const notifications = await notificationService.getNotifications();
                const unread = notifications.filter((notification: any) => !notification.read).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        // Lấy số lượng thông báo lần đầu khi component mount
        fetchUnreadCount();

        // Thiết lập interval để cập nhật định kỳ mỗi 30 giây
        const interval = setInterval(fetchUnreadCount, 30000);

        // Lắng nghe các sự kiện thông báo từ socket để cập nhật theo thời gian thực
        if (token && user) {
            // Khởi tạo socket nếu chưa được kết nối
            const safeToken = typeof token === 'string' ? token : undefined;
            if (safeToken) {
                socketService.connect(safeToken);
            }

            // Hàm xử lý khi có thông báo mới
            const handleNewNotification = () => {
                fetchUnreadCount();
            };

            // Đăng ký các sự kiện liên quan đến thông báo
            socketService.on('notification', handleNewNotification);
            socketService.on(SocketEvent.NOTIFICATION_CREATE, handleNewNotification);
            socketService.on('loan_status_changed', handleNewNotification);
            socketService.on(SocketEvent.BUDGET_UPDATE, handleNewNotification);
            socketService.on(SocketEvent.EXPENSE_CREATE, handleNewNotification);
            socketService.on(SocketEvent.INCOME_CREATE, handleNewNotification);
            socketService.on(SocketEvent.LOAN_UPDATE, handleNewNotification);

            // Cleanup khi component unmount
            return () => {
                clearInterval(interval);
                socketService.off('notification', handleNewNotification);
                socketService.off(SocketEvent.NOTIFICATION_CREATE, handleNewNotification);
                socketService.off('loan_status_changed', handleNewNotification);
                socketService.off(SocketEvent.BUDGET_UPDATE, handleNewNotification);
                socketService.off(SocketEvent.EXPENSE_CREATE, handleNewNotification);
                socketService.off(SocketEvent.INCOME_CREATE, handleNewNotification);
                socketService.off(SocketEvent.LOAN_UPDATE, handleNewNotification);
            };
        }

        // Cleanup interval khi không có token hoặc user
        return () => clearInterval(interval);
    }, [token, user]); // Cập nhật dependencies để bao gồm cả token và user

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true)
            // Gọi API đăng xuất
            await authService.logout()
            // Cập nhật state Redux
            dispatch(logout())
            // Chuyển hướng về trang đăng nhập
            router.push('/login')
        } catch (error) {
            console.error('Đăng xuất thất bại:', error)
        } finally {
            setIsLoggingOut(false)
        }
    }

    console.log("MainLayout rendering - Chatbot should be included here.");

    return (
        <>
            <div className="min-h-screen bg-background">
                {/* Sidebar */}
                <div
                    className={`fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="flex flex-col h-full">
                        {/* Logo and Close Button */}
                        <div className="flex items-center justify-between h-16 px-4 bg-primary">
                            <Link href="/" className="flex items-center">
                                <Image
                                    src="/logo-vlb.png"
                                    alt="VangLang Budget Logo"
                                    width={32}
                                    height={32}
                                />
                                <h1 className="ml-2 text-xl font-bold text-primary-foreground">{t('app.name')}</h1>
                            </Link>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1 text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-4 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname.includes(item.href)
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        <span className="mr-3">
                                            <item.icon
                                                className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'
                                                    }`}
                                            />
                                        </span>
                                        <span>{item.name}</span>
                                        {item.href === '/notifications' && unreadCount > 0 && (
                                            <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full z-10">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* User Menu - Gom vào một chỗ */}
                        <div className="flex-shrink-0 p-4 border-t border-border">
                            <div className="flex flex-col space-y-4">
                                {/* Theme Toggle */}
                                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-md">
                                    <span className="text-sm font-medium">{t('settings.theme.label')}</span>
                                    <ThemeToggle />
                                </div>

                                {/* Language Toggle */}
                                <div className="px-4 py-2 bg-muted/50 rounded-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">{t('settings.language.label')}</span>
                                        <LanguageToggle variant="icon" />
                                    </div>
                                    <LanguageToggle className="w-full" />
                                </div>

                                {/* Profile Menu - Dropdown */}
                                <div className="mt-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <UserIcon className="w-5 h-5 mr-2 text-muted-foreground" />
                                                    <span>{t('profile.account')}</span>
                                                </div>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-50"><path d="m6 9 6 6 6-6" /></svg>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>{t('profile.account')}</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link href={`/${locale}/profile`} className="flex items-center cursor-pointer">
                                                    <UserIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                                    {t('userProfile.title')}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/${locale}/settings`} className="flex items-center cursor-pointer">
                                                    <Cog6ToothIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                                    {t('settings.title')}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                disabled={isLoggingOut}
                                                onClick={handleLogout}
                                                className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                                            >
                                                <ArrowLeftStartOnRectangleIcon className="w-4 h-4 mr-2" />
                                                {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div
                    className={`transition-margin duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'
                        }`}
                >
                    {/* Header with menu button when sidebar is closed */}
                    {!isSidebarOpen && (
                        <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 bg-card shadow-sm">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 mr-2 text-foreground rounded-md hover:bg-muted focus:outline-none"
                                >
                                    <Bars3Icon className="w-6 h-6" />
                                </button>
                                <Link href="/" className="flex items-center">
                                    <Image
                                        src="/logo-vlb.png"
                                        alt="VangLang Budget Logo"
                                        width={24}
                                        height={24}
                                    />
                                    <h1 className="ml-2 text-lg font-semibold text-foreground">{t('app.name')}</h1>
                                </Link>
                            </div>

                            {/* Các điều khiển ở header */}
                            <div className="flex items-center space-x-3">
                                <LanguageToggle variant="icon" />
                                <ThemeToggle />
                                <SimpleBell unreadCount={unreadCount} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <UserIcon className="h-6 w-6" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{t('profile.account')}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={`/${locale}/profile`} className="flex items-center cursor-pointer">
                                                <UserIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                                {t('userProfile.title')}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/${locale}/settings`} className="flex items-center cursor-pointer">
                                                <Cog6ToothIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                                {t('settings.title')}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            disabled={isLoggingOut}
                                            onClick={handleLogout}
                                            className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                                        >
                                            <ArrowLeftStartOnRectangleIcon className="w-4 h-4 mr-2" />
                                            {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}

                    {/* Page Content */}
                    <main>{children}</main>
                </div>
            </div>

            <ChatPopupVanLangBot />
        </>
    )
} 