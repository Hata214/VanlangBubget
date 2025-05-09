'use client'

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
                    <h1 className="text-3xl font-bold">Cài đặt</h1>
                    <p className="text-gray-500 mt-2">Quản lý cài đặt tài khoản và ứng dụng của bạn</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5" />
                                Thông tin tài khoản
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">Quản lý thông tin cá nhân và mật khẩu tài khoản của bạn</p>
                            <Link href="/vi/profile">
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    Quản lý tài khoản
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BellIcon className="h-5 w-5" />
                                Thông báo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">Tùy chỉnh cách bạn nhận thông báo từ ứng dụng</p>
                            <Link href="/vi/settings/notifications">
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    Quản lý thông báo
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LockIcon className="h-5 w-5" />
                                Bảo mật
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">Thay đổi mật khẩu và thiết lập bảo mật tài khoản</p>
                            <Link href="/vi/profile">
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    Đổi mật khẩu
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GlobeIcon className="h-5 w-5" />
                                Ngôn ngữ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">Thay đổi ngôn ngữ hiển thị của ứng dụng</p>
                            <LanguageToggle />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CircleDollarSignIcon className="h-5 w-5" />
                                Định dạng tiền tệ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">Tùy chỉnh cách hiển thị tiền tệ trong ứng dụng</p>
                            <Link href="/vi/settings/currency">
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    Thay đổi tiền tệ
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BadgeInfo className="h-5 w-5" />
                                Giới thiệu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">Thông tin về phiên bản và nhà phát triển ứng dụng</p>
                            <Link href="/vi/about">
                                <Button variant="secondary" className="flex w-full items-center justify-between">
                                    Về ứng dụng
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-500">
                                <LogOut className="h-5 w-5" />
                                Đăng xuất
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 mb-4">Đăng xuất khỏi tài khoản của bạn trên thiết bị này</p>
                            <Button
                                variant="destructive"
                                className="flex w-full items-center justify-between"
                                onClick={handleLogout}
                            >
                                Đăng xuất
                                <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
} 