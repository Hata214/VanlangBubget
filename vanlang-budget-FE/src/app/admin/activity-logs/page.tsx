'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Activity,
    Calendar,
    User,
    Info,
    Download,
    RefreshCw,
    Filter,
    BarChart3,
    TrendingUp,
    Shield,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    FileText,
    Settings,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '@/services/adminService';

interface ActivityLog {
    _id: string;
    adminId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    action: string;
    targetId?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    details: any;
    result: any;
    timestamp: string;
    ipAddress?: string;
}

interface AdminUser {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface ActivityStats {
    totalLogs: number;
    todayLogs: number;
    successfulActions: number;
    failedActions: number;
    topActions: Array<{ action: string; count: number }>;
    adminActivity: Array<{ adminName: string; count: number }>;
}

export default function ActivityLogsPage() {
    const router = useRouter();
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterAction, setFilterAction] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<{ start?: string, end?: string }>({});
    const [stats, setStats] = useState<ActivityStats>({
        totalLogs: 0,
        todayLogs: 0,
        successfulActions: 0,
        failedActions: 0,
        topActions: [],
        adminActivity: []
    });

    useEffect(() => {
        // Lấy thông tin người dùng hiện tại từ localStorage
        const userRole = localStorage.getItem('user_role');
        setCurrentUser({
            _id: localStorage.getItem('user_id') || '',
            name: localStorage.getItem('user_name') || '',
            email: localStorage.getItem('user_email') || '',
            role: userRole
        });

        // Nếu không phải superadmin, chỉ hiển thị lịch sử của chính admin đó
        if (userRole !== 'superadmin') {
            setSelectedAdminId(localStorage.getItem('user_id') || '');
        }

        // Tải danh sách admin nếu là superadmin
        if (userRole === 'superadmin') {
            fetchAdmins();
        }

        // Tải lịch sử hoạt động và thống kê
        fetchActivityLogs();
        fetchActivityStats();
    }, [selectedAdminId, currentPage]);

    const fetchAdmins = async () => {
        try {
            // Sử dụng adminService thay vì fetch trực tiếp
            const response = await adminService.getAdminList();

            console.log('🔍 Admin list response:', response);
            if (response.success) {
                setAdmins(response.data || []);
                console.log('✅ Admin list loaded:', response.data?.length, 'admins');
                console.log('🔍 First admin sample:', response.data?.[0]);
            } else {
                console.error('Lỗi khi lấy danh sách admin:', response.message);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách admin:', error);
        }
    };

    const fetchActivityStats = async () => {
        try {
            setStatsLoading(true);
            const options: any = {};

            // Chỉ thêm adminId nếu không phải 'all'
            if (selectedAdminId && selectedAdminId !== 'all') {
                options.adminId = selectedAdminId;
            }

            // Gọi API thống kê
            const response = await adminService.getActivityStats(options);

            if (response.status === 'success') {
                setStats(response.data || {
                    totalLogs: 0,
                    todayLogs: 0,
                    successfulActions: 0,
                    failedActions: 0,
                    topActions: [],
                    adminActivity: []
                });
            }
        } catch (error: any) {
            console.error('Lỗi khi tải thống kê:', error);
            // Không hiển thị toast error cho stats để tránh làm phiền user
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchActivityLogs = async () => {
        try {
            setLoading(true);

            // Xây dựng options cho adminService
            const options: any = {
                page: currentPage,
                limit: 20
            };

            // Chỉ thêm adminId nếu không phải 'all'
            if (selectedAdminId && selectedAdminId !== 'all') {
                options.adminId = selectedAdminId;
            }

            if (filterAction && filterAction !== 'all') {
                options.actionType = filterAction;
            }

            if (dateRange.start) {
                options.startDate = dateRange.start;
            }

            if (dateRange.end) {
                options.endDate = dateRange.end;
            }

            if (searchTerm.trim()) {
                options.search = searchTerm.trim();
            }

            // Gọi adminService để lấy lịch sử hoạt động
            const response = await adminService.getActivityLogs(options);

            if (response.status === 'success') {
                setActivityLogs(response.data || []);
                setTotalPages(response.pagination?.totalPages || 1);
            } else {
                toast.error('Không thể tải lịch sử hoạt động');
            }
        } catch (error: any) {
            console.error('Lỗi khi tải lịch sử hoạt động:', error);
            const errorMessage = error?.response?.data?.message || 'Đã xảy ra lỗi khi tải dữ liệu';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm
        fetchActivityLogs();
    };

    const handleRefresh = () => {
        fetchActivityLogs();
        fetchActivityStats();
        toast.success('Đã làm mới dữ liệu');
    };

    const handleAdminChange = (value: string) => {
        setSelectedAdminId(value);
        setCurrentPage(1); // Reset về trang đầu tiên
    };

    const handleActionFilterChange = (value: string) => {
        setFilterAction(value);
        setCurrentPage(1);
        fetchActivityLogs();
        fetchActivityStats();
    };

    const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
        setDateRange(prev => ({
            ...prev,
            [type]: value
        }));
        setCurrentPage(1);
        // Tự động fetch lại dữ liệu khi thay đổi date range
        setTimeout(() => {
            fetchActivityLogs();
            fetchActivityStats();
        }, 100);
    };

    const handleExport = async () => {
        try {
            // Xây dựng filters cho export
            const exportFilters: any = {};

            if (selectedAdminId && selectedAdminId !== 'all') {
                exportFilters.adminId = selectedAdminId;
            }

            if (filterAction && filterAction !== 'all') {
                exportFilters.actionType = filterAction;
            }

            if (dateRange.start) {
                exportFilters.startDate = dateRange.start;
            }

            if (dateRange.end) {
                exportFilters.endDate = dateRange.end;
            }

            if (searchTerm.trim()) {
                exportFilters.search = searchTerm.trim();
            }

            // Sử dụng adminService để xuất CSV
            await adminService.exportActivityLogsCSV(exportFilters);
            toast.success('Đã xuất dữ liệu thành công');
        } catch (error: any) {
            console.error('Lỗi khi xuất dữ liệu:', error);
            const errorMessage = error?.response?.data?.message || 'Không thể xuất dữ liệu';
            toast.error(errorMessage);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionLabel = (action: string) => {
        const actionLabels: Record<string, string> = {
            // Dashboard Actions
            DASHBOARD_VIEW: 'Xem dashboard',
            VIEW_DASHBOARD: 'Xem dashboard',

            // Admin Management
            VIEW_ADMIN_LIST: 'Xem danh sách admin',
            CREATE_ADMIN: 'Tạo admin mới',
            UPDATE_ADMIN: 'Cập nhật admin',
            DELETE_ADMIN: 'Xóa admin',
            ACTIVATE_ADMIN: 'Kích hoạt admin',
            DEACTIVATE_ADMIN: 'Vô hiệu hóa admin',

            // Content Management
            VIEW_SITE_CONTENT: 'Xem nội dung site',
            UPDATE_SITE_CONTENT: 'Cập nhật nội dung site',
            APPROVE_CONTENT: 'Phê duyệt nội dung',
            REJECT_CONTENT: 'Từ chối nội dung',
            RESTORE_CONTENT_VERSION: 'Khôi phục phiên bản',

            // User Management
            VIEW_USER_LIST: 'Xem danh sách người dùng',
            UPDATE_USER: 'Cập nhật người dùng',
            DELETE_USER: 'Xóa người dùng',
            RESET_USER_PASSWORD: 'Đặt lại mật khẩu',
            ACTIVATE_USER: 'Kích hoạt người dùng',
            DEACTIVATE_USER: 'Vô hiệu hóa người dùng',

            // Transaction Management
            TRANSACTIONS_VIEW: 'Xem giao dịch',
            TRANSACTIONS_EXPORT: 'Xuất giao dịch',
            TRANSACTION_VIEW: 'Xem chi tiết giao dịch',
            TRANSACTION_UPDATE: 'Cập nhật giao dịch',
            TRANSACTION_DELETE: 'Xóa giao dịch',

            // Authentication
            LOGIN: 'Đăng nhập',
            LOGOUT: 'Đăng xuất',
            FAILED_LOGIN: 'Đăng nhập thất bại',

            // System
            SYSTEM_CONFIG: 'Cấu hình hệ thống',
            EXPORT_DATA: 'Xuất dữ liệu',
            IMPORT_DATA: 'Nhập dữ liệu',
            OTHER: 'Hoạt động khác'
        };

        return actionLabels[action] || action;
    };

    const getAdminName = (adminId: string) => {
        if (!adminId) return 'N/A';
        const admin = admins.find(a => a._id === adminId);
        if (admin) {
            return `${admin.firstName} ${admin.lastName}`;
        }
        return adminId; // Fallback to ID if not found
    };

    const getActionBadgeColor = (action: string | undefined) => {
        if (!action) return 'bg-gray-100 text-gray-800 border-gray-300';
        if (action.includes('CREATE') || action.includes('APPROVE')) return 'bg-green-100 text-green-800 border-green-300';
        if (action.includes('DELETE') || action.includes('REJECT') || action.includes('FAILED')) return 'bg-red-100 text-red-800 border-red-300';
        if (action.includes('UPDATE') || action.includes('RESTORE')) return 'bg-blue-100 text-blue-800 border-blue-300';
        if (action.includes('VIEW')) return 'bg-gray-100 text-gray-800 border-gray-300';
        if (action.includes('ACTIVATE')) return 'bg-green-100 text-green-800 border-green-300';
        if (action.includes('DEACTIVATE')) return 'bg-orange-100 text-orange-800 border-orange-300';
        if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800 border-blue-300';
        if (action.includes('LOGOUT')) return 'bg-purple-100 text-purple-800 border-purple-300';
        return 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getActionIcon = (action: string) => {
        if (action.includes('VIEW')) return <Eye className="h-3 w-3" />;
        if (action.includes('CREATE')) return <Activity className="h-3 w-3" />;
        if (action.includes('UPDATE')) return <Activity className="h-3 w-3" />;
        if (action.includes('DELETE')) return <XCircle className="h-3 w-3" />;
        if (action.includes('LOGIN')) return <User className="h-3 w-3" />;
        if (action.includes('LOGOUT')) return <User className="h-3 w-3" />;
        if (action.includes('EXPORT')) return <Download className="h-3 w-3" />;
        if (action.includes('SYSTEM')) return <Settings className="h-3 w-3" />;
        return <Activity className="h-3 w-3" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lịch sử hoạt động</h1>
                    <p className="text-muted-foreground mt-2">
                        Theo dõi và phân tích các hoạt động của quản trị viên trong hệ thống
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading || statsLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={loading}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Xuất CSV
                    </Button>
                </div>
            </div>

            {/* Thống kê tổng quan */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng hoạt động</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                            ) : (
                                stats.totalLogs.toLocaleString()
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số hoạt động được ghi nhận
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hôm nay</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                            ) : (
                                stats.todayLogs.toLocaleString()
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Hoạt động trong ngày hôm nay
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thành công</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                            ) : (
                                stats.successfulActions.toLocaleString()
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Hành động thực hiện thành công
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                            ) : (
                                stats.failedActions.toLocaleString()
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Hành động thực hiện thất bại
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Actions và Admin Activity */}
            {currentUser?.role === 'superadmin' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Hành động phổ biến</CardTitle>
                            <CardDescription>
                                Top 5 hành động được thực hiện nhiều nhất
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                [...Array(5)].map((_, index) => (
                                    <div key={index} className="flex justify-between items-center py-2">
                                        <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                                        <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                                    </div>
                                ))
                            ) : stats.topActions.length > 0 ? (
                                stats.topActions.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-2">
                                        <span className="text-sm">{getActionLabel(item.action)}</span>
                                        <Badge variant="secondary">{item.count}</Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Hoạt động theo Admin</CardTitle>
                            <CardDescription>
                                Số lượng hoạt động của từng admin
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                [...Array(5)].map((_, index) => (
                                    <div key={index} className="flex justify-between items-center py-2">
                                        <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                                        <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                                    </div>
                                ))
                            ) : stats.adminActivity.length > 0 ? (
                                stats.adminActivity.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-2">
                                        <span className="text-sm">{item.adminName}</span>
                                        <Badge variant="outline">{item.count}</Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử hoạt động quản trị viên</CardTitle>
                    <CardDescription>
                        Xem và lọc lịch sử các thao tác được thực hiện bởi quản trị viên
                    </CardDescription>

                    {/* Bộ lọc nâng cao */}
                    <div className="mt-4 space-y-4">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-64">
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm hành động..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            {currentUser?.role === 'superadmin' && (
                                <div className="w-full md:w-64">
                                    <Select
                                        value={selectedAdminId}
                                        onValueChange={handleAdminChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn Admin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả Admin</SelectItem>
                                            {admins.map((admin) => (
                                                <SelectItem key={admin._id} value={admin._id}>
                                                    {admin.firstName} {admin.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="w-full md:w-64">
                                <Select
                                    value={filterAction}
                                    onValueChange={handleActionFilterChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Lọc theo hành động" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả hành động</SelectItem>
                                        <SelectItem value="LOGIN">Đăng nhập</SelectItem>
                                        <SelectItem value="CREATE">Tạo mới</SelectItem>
                                        <SelectItem value="UPDATE">Cập nhật</SelectItem>
                                        <SelectItem value="DELETE">Xóa</SelectItem>
                                        <SelectItem value="VIEW">Xem</SelectItem>
                                        <SelectItem value="ACTIVATE">Kích hoạt</SelectItem>
                                        <SelectItem value="DEACTIVATE">Vô hiệu hóa</SelectItem>
                                        <SelectItem value="EXPORT">Xuất dữ liệu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="mt-0">
                                <Search className="h-4 w-4 mr-2" />
                                Tìm kiếm
                            </Button>
                        </form>

                        {/* Bộ lọc thời gian */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-64">
                                <label className="text-sm font-medium mb-2 block">Từ ngày</label>
                                <Input
                                    type="date"
                                    value={dateRange.start || ''}
                                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-64">
                                <label className="text-sm font-medium mb-2 block">Đến ngày</label>
                                <Input
                                    type="date"
                                    value={dateRange.end || ''}
                                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDateRange({});
                                        setCurrentPage(1);
                                        fetchActivityLogs();
                                    }}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Xóa bộ lọc
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Thời gian</TableHead>
                                    {currentUser?.role === 'superadmin' && <TableHead>Admin</TableHead>}
                                    <TableHead>Hành động</TableHead>
                                    <TableHead>Đối tượng</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Chi tiết</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Loading skeleton
                                    [...Array(5)].map((_, index) => (
                                        <TableRow key={index}>
                                            {[...Array(currentUser?.role === 'superadmin' ? 6 : 5)].map((_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : activityLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={currentUser?.role === 'superadmin' ? 6 : 5} className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                                <p className="text-lg font-medium">Không tìm thấy bản ghi hoạt động nào</p>
                                                <p className="text-sm text-muted-foreground">Thử điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activityLogs.map((log) => (
                                        <TableRow key={log._id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="font-medium">{formatDate(log.timestamp)}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {currentUser?.role === 'superadmin' && (
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {log.adminId ? (
                                                            <div>
                                                                <div className="font-medium">
                                                                    {log.adminId.firstName} {log.adminId.lastName}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {log.adminId.email}
                                                                </div>
                                                            </div>
                                                        ) : 'N/A'}
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={getActionBadgeColor(log.action)}
                                                >
                                                    {getActionIcon(log.action)}
                                                    <span className="ml-1">{getActionLabel(log.action)}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.targetId ? (
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium">
                                                                {log.targetId.firstName} {log.targetId.lastName}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {log.targetId.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-mono">
                                                        {log.ipAddress || 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        // Hiển thị chi tiết trong toast
                                                        toast((t) => (
                                                            <div className="max-w-md">
                                                                <h3 className="font-bold mb-2">Chi tiết hoạt động</h3>
                                                                <div className="text-sm space-y-2">
                                                                    <div>
                                                                        <span className="font-semibold">Hành động:</span> {getActionLabel(log.action)}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-semibold">Thời gian:</span> {formatDate(log.timestamp)}
                                                                    </div>
                                                                    {log.adminId && (
                                                                        <div>
                                                                            <span className="font-semibold">Admin:</span> {log.adminId.firstName} {log.adminId.lastName}
                                                                        </div>
                                                                    )}
                                                                    {log.ipAddress && (
                                                                        <div>
                                                                            <span className="font-semibold">IP:</span> {log.ipAddress}
                                                                        </div>
                                                                    )}
                                                                    {log.targetId && (
                                                                        <div>
                                                                            <span className="font-semibold">Đối tượng:</span> {log.targetId.firstName} {log.targetId.lastName}
                                                                        </div>
                                                                    )}
                                                                    {log.details && Object.keys(log.details).length > 0 && (
                                                                        <div className="mt-2">
                                                                            <p className="font-semibold">Chi tiết kỹ thuật:</p>
                                                                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto max-h-32">
                                                                                {JSON.stringify(log.details, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                    {log.result && Object.keys(log.result).length > 0 && (
                                                                        <div className="mt-2">
                                                                            <p className="font-semibold">Kết quả:</p>
                                                                            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto max-h-32">
                                                                                {JSON.stringify(log.result, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    onClick={() => toast.dismiss(t.id)}
                                                                    className="mt-3 w-full"
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    Đóng
                                                                </Button>
                                                            </div>
                                                        ), {
                                                            duration: 15000,
                                                            position: 'bottom-center'
                                                        });
                                                    }}
                                                >
                                                    <Info className="h-4 w-4" />
                                                    <span className="sr-only">Chi tiết</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {activityLogs.length > 0 && (
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Hiển thị {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, activityLogs.length)} trong tổng số {stats.totalLogs} bản ghi
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage <= 1 || loading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="sr-only">Trang trước</span>
                                </Button>
                                <div className="text-sm font-medium">
                                    Trang {currentPage} / {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages || loading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="sr-only">Trang sau</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
