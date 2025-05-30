'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/Card'
import {
    UserIcon,
    DollarSign,
    Calendar,
    BarChart3,
    Activity,
    Shield,
    TrendingUp,
    Database,
    Users,
    FileText
} from 'lucide-react'
import adminService from '@/services/adminService'
import { toast } from 'react-hot-toast'

interface DashboardData {
    users: {
        total: number;
        new: number;
        active: number;
        admin: number;
        byRole: Array<{ _id: string; count: number }>;
    };
    financialData: {
        incomes: number;
        expenses: number;
        loans: number;
        budgets: number;
    };
    adminActivity: {
        recent: Array<any>;
        period: string;
    };
}

interface UserInfo {
    name: string;
    email: string;
    role: string;
}

export default function AdminDashboardPage() {
    const t = useTranslations()
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<UserInfo | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Lấy thông tin người dùng từ localStorage
        if (typeof window !== 'undefined') {
            const userName = localStorage.getItem('user_name') || '';
            const userEmail = localStorage.getItem('user_email') || '';
            const userRole = localStorage.getItem('user_role') || '';

            if (userEmail) {
                setUser({
                    name: userName,
                    email: userEmail,
                    role: userRole
                });
                console.log('Đã tải thông tin người dùng từ localStorage:', userName, userEmail, userRole);
            }
        }

        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await adminService.getDashboardData()

                if (response.status === 'success' && response.data) {
                    setDashboardData(response.data)
                } else {
                    throw new Error('Invalid response format')
                }
            } catch (err: any) {
                console.error('Lỗi khi tải dữ liệu dashboard:', err)
                setError('Không thể tải dữ liệu dashboard')

                // Fallback data for development
                setDashboardData({
                    users: {
                        total: 1250,
                        new: 45,
                        active: 843,
                        admin: 3,
                        byRole: [
                            { _id: 'user', count: 1244 },
                            { _id: 'admin', count: 5 },
                            { _id: 'superadmin', count: 1 }
                        ]
                    },
                    financialData: {
                        incomes: 2847,
                        expenses: 3921,
                        loans: 156,
                        budgets: 89
                    },
                    adminActivity: {
                        recent: [],
                        period: '7 ngày qua'
                    }
                })

                toast.error('Sử dụng dữ liệu mẫu do không thể kết nối backend')
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    const stats_cards = dashboardData ? [
        {
            title: 'Tổng số người dùng',
            value: dashboardData.users.total.toLocaleString(),
            description: 'Người dùng đã đăng ký',
            icon: Users,
            color: 'bg-blue-500'
        },
        {
            title: 'Người dùng mới',
            value: dashboardData.users.new.toLocaleString(),
            description: '30 ngày qua',
            icon: TrendingUp,
            color: 'bg-green-500'
        },
        {
            title: 'Người dùng hoạt động',
            value: dashboardData.users.active.toLocaleString(),
            description: 'Đang hoạt động',
            icon: Activity,
            color: 'bg-yellow-500'
        },
        {
            title: 'Quản trị viên',
            value: dashboardData.users.admin.toLocaleString(),
            description: 'Admin & SuperAdmin',
            icon: Shield,
            color: 'bg-purple-500'
        },
        {
            title: 'Thu nhập',
            value: dashboardData.financialData.incomes.toLocaleString(),
            description: 'Bản ghi thu nhập',
            icon: DollarSign,
            color: 'bg-emerald-500'
        },
        {
            title: 'Chi tiêu',
            value: dashboardData.financialData.expenses.toLocaleString(),
            description: 'Bản ghi chi tiêu',
            icon: FileText,
            color: 'bg-red-500'
        },
        {
            title: 'Khoản vay',
            value: dashboardData.financialData.loans.toLocaleString(),
            description: 'Khoản vay đang quản lý',
            icon: BarChart3,
            color: 'bg-orange-500'
        },
        {
            title: 'Ngân sách',
            value: dashboardData.financialData.budgets.toLocaleString(),
            description: 'Kế hoạch ngân sách',
            icon: Database,
            color: 'bg-indigo-500'
        }
    ] : []

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('admin.dashboardDescription')}
                </p>
            </div>

            {/* Thêm thông tin người dùng đăng nhập */}
            {user && (
                <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-purple-100">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Shield className={user.role === 'superadmin' ? 'text-red-500' : 'text-blue-500'} />
                            <CardTitle>Thông tin đăng nhập</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-1">
                                <div className="text-sm font-medium">Tên người dùng:</div>
                                <div className="text-sm">{user.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <div className="text-sm font-medium">Email:</div>
                                <div className="text-sm">{user.email}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                                <div className="text-sm font-medium">Vai trò:</div>
                                <div className={`text-sm font-bold ${user.role === 'superadmin' ? 'text-red-600' : 'text-blue-600'}`}>
                                    {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2 text-red-600">
                            <Activity className="h-4 w-4" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    // Loading skeleton
                    [...Array(8)].map((_, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                                <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1"></div>
                                <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    stats_cards.map((card, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">
                                    {card.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${card.color}`}>
                                    <card.icon className="h-4 w-4 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {card.value}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Additional Information Cards */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {/* User Roles Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Phân bố vai trò người dùng</CardTitle>
                        <CardDescription>
                            Thống kê người dùng theo vai trò
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                                        <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : dashboardData ? (
                            <div className="space-y-3">
                                {dashboardData.users.byRole.map((role, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${role._id === 'superadmin' ? 'bg-red-500' :
                                                role._id === 'admin' ? 'bg-blue-500' : 'bg-gray-500'
                                                }`}></div>
                                            <span className="text-sm font-medium capitalize">
                                                {role._id === 'superadmin' ? 'Super Admin' :
                                                    role._id === 'admin' ? 'Admin' : 'Người dùng'}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold">
                                            {role.count.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    Không có dữ liệu
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Admin Activity Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hoạt động quản trị</CardTitle>
                        <CardDescription>
                            {dashboardData?.adminActivity.period || 'Thống kê hoạt động'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                                        <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : dashboardData && dashboardData.adminActivity.recent.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.adminActivity.recent.slice(0, 5).map((activity, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Activity className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm">
                                                {activity._id}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold">
                                                {activity.total}
                                            </div>
                                            <div className="text-xs text-green-600">
                                                {activity.success} thành công
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground text-sm">
                                    Chưa có hoạt động nào được ghi nhận
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 