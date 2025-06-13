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
    FileText,
    RefreshCw,
    AlertTriangle,
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

interface RecentUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
    lastLogin?: string;
}

interface RecentTransaction {
    id: string;
    type: 'income' | 'expense' | 'loan' | 'investment';
    amount: number;
    description: string;
    category: string;
    date: string;
    userName: string;
    userEmail: string;
    createdAt: string;
}

export default function AdminDashboardPage() {
    const t = useTranslations()
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
    const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [loadingTransactions, setLoadingTransactions] = useState(false)
    const [user, setUser] = useState<UserInfo | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

    // Load dashboard data from backend
    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)

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
            setError('Không thể tải dữ liệu dashboard từ server')
            toast.error(err.response?.data?.message || 'Không thể kết nối với backend')
        } finally {
            setLoading(false)
        }
    }

    // Load recent users from backend
    const fetchRecentUsers = async () => {
        try {
            setLoadingUsers(true)
            const response = await adminService.getUsers({
                page: 1,
                limit: 5,
                sortBy: 'createdAt',
                sortDirection: 'desc'
            })

            if (response.status === 'success' && response.data) {
                setRecentUsers(response.data)
            }
        } catch (err: any) {
            console.error('Lỗi khi tải danh sách người dùng:', err)
            toast.error('Không thể tải danh sách người dùng gần đây')
        } finally {
            setLoadingUsers(false)
        }
    }

    // Load recent transactions from backend
    const fetchRecentTransactions = async () => {
        try {
            setLoadingTransactions(true)
            const response = await adminService.getAllTransactions({
                page: 1,
                limit: 5,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            })

            if (response.status === 'success' && response.data) {
                setRecentTransactions(response.data.transactions)
            }
        } catch (err: any) {
            console.error('Lỗi khi tải danh sách giao dịch:', err)
            toast.error('Không thể tải danh sách giao dịch gần đây')
        } finally {
            setLoadingTransactions(false)
        }
    }

    // Refresh all data
    const refreshAllData = async () => {
        await Promise.all([
            fetchDashboardData(),
            fetchRecentUsers(),
            fetchRecentTransactions()
        ])
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
        refreshAllData()
    }, [])

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            refreshAllData()
        }, 30000) // Refresh every 30 seconds

        return () => clearInterval(interval)
    }, [autoRefresh])

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

    // Show error state if failed to load data
    if (!loading && error && !dashboardData) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">
                            Không thể kết nối với backend database
                        </p>
                    </div>
                    <Button onClick={refreshAllData} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử lại
                    </Button>
                </div>

                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{error}. Vui lòng kiểm tra kết nối backend và thử lại.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Dữ liệu thời gian thực từ MongoDB Database
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        variant={autoRefresh ? "default" : "outline"}
                        size="sm"
                    >
                        <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                        {autoRefresh ? 'Tự động làm mới' : 'Bật tự động làm mới'}
                    </Button>
                    <Button onClick={refreshAllData} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </Button>
                </div>
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

            {/* Status indicators */}
            <div className="space-y-4">
                {/* Backend connection status */}
                {!error && dashboardData && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-green-800">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Kết nối thành công với MongoDB Database - Dữ liệu thời gian thực</span>
                                </div>
                                {lastRefresh && (
                                    <div className="flex items-center gap-1 text-green-600 text-sm">
                                        <Clock className="h-3 w-3" />
                                        <span>Cập nhật: {lastRefresh.toLocaleTimeString()}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error Display */}
                {error && dashboardData && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-2 text-orange-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-medium">Một số dữ liệu có thể không cập nhật: {error}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

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

            {/* Recent Data Tables */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Recent Users */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Người dùng gần đây</CardTitle>
                                <CardDescription>
                                    5 người dùng đăng ký mới nhất
                                </CardDescription>
                            </div>
                            <Button
                                onClick={fetchRecentUsers}
                                variant="outline"
                                size="sm"
                                disabled={loadingUsers}
                            >
                                <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingUsers ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                                            <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                                        </div>
                                        <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : recentUsers.length > 0 ? (
                            <div className="space-y-3">
                                {recentUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {user.firstName} {user.lastName}
                                                </span>
                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                    {user.role}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {user.email}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Đăng ký: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={user.active ? 'default' : 'destructive'}>
                                                {user.active ? 'Hoạt động' : 'Không hoạt động'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground text-sm">
                                    Chưa có người dùng nào
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Giao dịch gần đây</CardTitle>
                                <CardDescription>
                                    5 giao dịch mới nhất trong hệ thống
                                </CardDescription>
                            </div>
                            <Button
                                onClick={fetchRecentTransactions}
                                variant="outline"
                                size="sm"
                                disabled={loadingTransactions}
                            >
                                <RefreshCw className={`h-4 w-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingTransactions ? (
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                                            <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                                        </div>
                                        <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : recentTransactions.length > 0 ? (
                            <div className="space-y-3">
                                {recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {transaction.description}
                                                </span>
                                                <Badge variant={
                                                    transaction.type === 'income' ? 'default' :
                                                        transaction.type === 'expense' ? 'destructive' :
                                                            transaction.type === 'loan' ? 'secondary' : 'outline'
                                                }>
                                                    {transaction.type === 'income' ? 'Thu nhập' :
                                                        transaction.type === 'expense' ? 'Chi tiêu' :
                                                            transaction.type === 'loan' ? 'Khoản vay' : 'Đầu tư'}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {transaction.userName} • {transaction.category}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(transaction.date).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${transaction.type === 'income' ? 'text-green-600' :
                                                transaction.type === 'expense' ? 'text-red-600' :
                                                    'text-blue-600'
                                                }`}>
                                                {transaction.amount.toLocaleString('vi-VN')} ₫
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground text-sm">
                                    Chưa có giao dịch nào
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}