'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
    Card,
    CardContent,
    CardDescription,
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
    FileText,
    RefreshCw,
    CheckCircle,
    Clock,
    Eye
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { adminService } from '@/services/adminService'
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
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

    // Load dashboard data from backend
    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            const response = await adminService.getDashboardData()

            if (response.status === 'success' && response.data) {
                setDashboardData(response.data)
                setLastRefresh(new Date())
                toast.success('Tải dữ liệu dashboard thành công')
            } else {
                throw new Error('Invalid response format')
            }
        } catch (err: any) {
            console.error('Lỗi khi tải dữ liệu dashboard:', err)
            toast.error(err.response?.data?.message || 'Không thể kết nối với backend')
        } finally {
            setLoading(false)
        }
    }

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
            }
        }

        // Load initial data
        fetchDashboardData()
    }, [])

    const stats_cards = dashboardData ? [
        {
            title: 'Tổng số người dùng',
            value: dashboardData.users.total.toLocaleString(),
            description: 'Người dùng đã đăng ký',
            icon: Users,
            iconBg: 'bg-blue-500'
        },
        {
            title: 'Người dùng mới',
            value: dashboardData.users.new.toLocaleString(),
            description: '30 ngày qua',
            icon: TrendingUp,
            iconBg: 'bg-green-500'
        },
        {
            title: 'Người dùng hoạt động',
            value: dashboardData.users.active.toLocaleString(),
            description: 'Đang hoạt động',
            icon: Activity,
            iconBg: 'bg-yellow-500'
        },
        {
            title: 'Quản trị viên',
            value: dashboardData.users.admin.toLocaleString(),
            description: 'Admin & SuperAdmin',
            icon: Shield,
            iconBg: 'bg-purple-500'
        },
        {
            title: 'Thu nhập',
            value: dashboardData.financialData.incomes.toLocaleString(),
            description: 'Bản ghi thu nhập',
            icon: DollarSign,
            iconBg: 'bg-green-500'
        },
        {
            title: 'Chi tiêu',
            value: dashboardData.financialData.expenses.toLocaleString(),
            description: 'Bản ghi chi tiêu',
            icon: FileText,
            iconBg: 'bg-red-500'
        },
        {
            title: 'Khoản vay',
            value: dashboardData.financialData.loans.toLocaleString(),
            description: 'Khoản vay đang quản lý',
            icon: BarChart3,
            iconBg: 'bg-orange-500'
        },
        {
            title: 'Ngân sách',
            value: dashboardData.financialData.budgets.toLocaleString(),
            description: 'Kế hoạch ngân sách',
            icon: Database,
            iconBg: 'bg-blue-500'
        }
    ] : []

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Dữ liệu thời gian thực từ MongoDB Database
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchDashboardData} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </Button>
                </div>
            </div>

            {/* Thông tin người dùng đăng nhập */}
            {user && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                            <Shield className={user.role === 'superadmin' ? 'text-red-500' : 'text-blue-500'} />
                            <CardTitle className="text-lg">Thông tin đăng nhập</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <div className="text-sm text-muted-foreground">Tên người dùng</div>
                                <div className="font-medium">{user.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="font-medium">{user.email}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Vai trò</div>
                                <Badge variant={user.role === 'superadmin' ? 'destructive' : 'default'}>
                                    {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards - 8 cards nằm ngang trên một hàng */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {loading ? (
                    // Loading skeleton cho tất cả 8 cards
                    [...Array(8)].map((_, index) => (
                        <Card key={index} className="border-0 shadow-sm bg-white">
                            <CardContent className="p-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="h-2 w-12 bg-gray-200 animate-pulse rounded"></div>
                                        <div className="h-5 w-5 bg-gray-200 animate-pulse rounded-full"></div>
                                    </div>
                                    <div>
                                        <div className="h-5 w-8 bg-gray-200 animate-pulse rounded mb-1"></div>
                                        <div className="h-2 w-10 bg-gray-200 animate-pulse rounded"></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    stats_cards.map((card, index) => (
                        <Card key={index} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-gray-600 truncate">
                                            {card.title}
                                        </p>
                                        <div className={`p-1.5 rounded-full ${card.iconBg}`}>
                                            <card.icon className="h-3 w-3 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 mb-1">
                                            {card.value}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {card.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Bottom Section - User Roles and Admin Activity */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Phân bố vai trò người dùng */}
                <Card className="border-0 shadow-sm bg-white">
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
                                        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                                        <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : dashboardData ? (
                            <div className="space-y-4">
                                {dashboardData.users.byRole.map((role, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-4 h-4 rounded-full ${role._id === 'superadmin' ? 'bg-red-500' :
                                                role._id === 'admin' ? 'bg-blue-500' : 'bg-gray-500'
                                                }`}></div>
                                            <span className="font-medium">
                                                {role._id === 'superadmin' ? 'Super Admin' :
                                                    role._id === 'admin' ? 'Admin' : 'Người dùng'}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="font-bold">
                                            {role.count.toLocaleString()}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Không có dữ liệu</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hoạt động quản trị */}
                <Card className="border-0 shadow-sm bg-white">
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
                                        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                                        <div className="h-4 w-8 bg-gray-200 animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : dashboardData && dashboardData.adminActivity.recent.length > 0 ? (
                            <div className="space-y-4">
                                {dashboardData.adminActivity.recent.slice(0, 5).map((activity, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            <Activity className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium">
                                                {activity._id}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="font-bold">
                                                {activity.total}
                                            </Badge>
                                            <div className="text-xs text-green-600 mt-1">
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