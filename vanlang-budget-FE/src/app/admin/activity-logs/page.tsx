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
    Shield,
    Clock,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    Globe,
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
    userAgent?: string;
}

interface AdminUser {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface ActivityStats {
    totalActivities: number;
    todayActivities: number;
    successRate: number;
    topActions: Array<{ action: string; count: number }>;
    activeAdmins: number;
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
    const [filterResult, setFilterResult] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<{ start?: string, end?: string }>({});
    const [stats, setStats] = useState<ActivityStats>({
        totalActivities: 0,
        todayActivities: 0,
        successRate: 0,
        topActions: [],
        activeAdmins: 0
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
    }, [selectedAdminId, currentPage, filterAction, filterResult]);

    // Separate useEffect for stats to avoid dependency issues
    useEffect(() => {
        fetchActivityStats();
    }, [selectedAdminId]);

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
            const options: any = {
                days: 30
            };

            if (selectedAdminId && selectedAdminId !== 'all') {
                options.adminId = selectedAdminId;
            }

            const response = await adminService.getActivityStats(options);

            if (response.status === 'success' && response.data?.stats) {
                setStats({
                    totalActivities: response.data.stats.totalActivities || 0,
                    todayActivities: response.data.stats.todayActivities || 0,
                    successRate: response.data.stats.successRate || 0,
                    topActions: response.data.stats.topActions || [],
                    activeAdmins: response.data.stats.activeAdmins || 0
                });
            } else {
                // Fallback nếu API không trả về dữ liệu đúng format
                setStats({
                    totalActivities: 0,
                    todayActivities: 0,
                    successRate: 0,
                    topActions: [],
                    activeAdmins: 0
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải thống kê:', error);
            // Set default stats khi có lỗi
            setStats({
                totalActivities: 0,
                todayActivities: 0,
                successRate: 0,
                topActions: [],
                activeAdmins: 0
            });
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

            if (filterResult && filterResult !== 'all') {
                options.result = filterResult;
            }

            if (dateRange.start) {
                options.startDate = dateRange.start;
            }

            if (dateRange.end) {
                options.endDate = dateRange.end;
            }

            if (searchTerm) {
                options.search = searchTerm;
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
    };

    const handleResultFilterChange = (value: string) => {
        setFilterResult(value);
        setCurrentPage(1);
    };

    const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
        setDateRange(prev => ({
            ...prev,
            [type]: value
        }));
        setCurrentPage(1);
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

            if (filterResult && filterResult !== 'all') {
                exportFilters.result = filterResult;
            }

            if (dateRange.start) {
                exportFilters.startDate = dateRange.start;
            }

            if (dateRange.end) {
                exportFilters.endDate = dateRange.end;
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
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
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
            TRANSACTIONS_EXPORT: 'Xuất dữ liệu giao dịch',
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
        if (action.includes('LOGOUT')) return 'bg-gray-100 text-gray-800 border-gray-300';
        if (action.includes('EXPORT') || action.includes('IMPORT')) return 'bg-purple-100 text-purple-800 border-purple-300';
        return 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getResultBadgeColor = (result: string) => {
        switch (result) {
            case 'SUCCESS':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'FAILED':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'PARTIAL':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getResultIcon = (result: string) => {
        switch (result) {
            case 'SUCCESS':
                return <CheckCircle className="h-3 w-3" />;
            case 'FAILED':
                return <XCircle className="h-3 w-3" />;
            case 'PARTIAL':
                return <AlertTriangle className="h-3 w-3" />;
            default:
                return <Info className="h-3 w-3" />;
        }
    };

    const getResultLabel = (result: string) => {
        switch (result) {
            case 'SUCCESS':
                return 'Thành công';
            case 'FAILED':
                return 'Thất bại';
            case 'PARTIAL':
                return 'Một phần';
            default:
                return result;
        }
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
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Xuất CSV
                    </Button>
                </div>
            </div>

            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tổng hoạt động</p>
                                <p className="text-2xl font-bold">
                                    {statsLoading ? (
                                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                                    ) : (
                                        (stats?.totalActivities || 0).toLocaleString()
                                    )}
                                </p>
                            </div>
                            <Activity className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Hoạt động hôm nay</p>
                                <p className="text-2xl font-bold">
                                    {statsLoading ? (
                                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                                    ) : (
                                        (stats?.todayActivities || 0).toLocaleString()
                                    )}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tỷ lệ thành công</p>
                                <p className="text-2xl font-bold">
                                    {statsLoading ? (
                                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                                    ) : (
                                        `${(stats?.successRate || 0).toFixed(1)}%`
                                    )}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Admin hoạt động</p>
                                <p className="text-2xl font-bold">
                                    {statsLoading ? (
                                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                                    ) : (
                                        (stats?.activeAdmins || 0).toLocaleString()
                                    )}
                                </p>
                            </div>
                            <Shield className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Lịch sử hoạt động quản trị viên
                    </CardTitle>
                    <CardDescription>
                        Xem chi tiết lịch sử các thao tác được thực hiện bởi quản trị viên với đầy đủ thông tin truy cập
                    </CardDescription>

                    {/* Bộ lọc nâng cao */}
                    <div className="space-y-4">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-64">
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm hành động, IP..."
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
                                        <SelectItem value="LOGOUT">Đăng xuất</SelectItem>
                                        <SelectItem value="CREATE">Tạo mới</SelectItem>
                                        <SelectItem value="UPDATE">Cập nhật</SelectItem>
                                        <SelectItem value="DELETE">Xóa</SelectItem>
                                        <SelectItem value="VIEW">Xem</SelectItem>
                                        <SelectItem value="ACTIVATE">Kích hoạt</SelectItem>
                                        <SelectItem value="DEACTIVATE">Vô hiệu hóa</SelectItem>
                                        <SelectItem value="EXPORT">Xuất dữ liệu</SelectItem>
                                        <SelectItem value="IMPORT">Nhập dữ liệu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-64">
                                <Select
                                    value={filterResult}
                                    onValueChange={handleResultFilterChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Lọc theo kết quả" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả kết quả</SelectItem>
                                        <SelectItem value="SUCCESS">Thành công</SelectItem>
                                        <SelectItem value="FAILED">Thất bại</SelectItem>
                                        <SelectItem value="PARTIAL">Một phần</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="mt-0">
                                <Search className="h-4 w-4 mr-2" />
                                Tìm kiếm
                            </Button>
                        </form>

                        {/* Bộ lọc thời gian */}
                        <div className="flex flex-col md:flex-row gap-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Khoảng thời gian:</span>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    placeholder="Từ ngày"
                                    value={dateRange.start || ''}
                                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                                    className="w-40"
                                />
                                <span className="text-muted-foreground self-center">đến</span>
                                <Input
                                    type="date"
                                    placeholder="Đến ngày"
                                    value={dateRange.end || ''}
                                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                    className="w-40"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setDateRange({});
                                        setCurrentPage(1);
                                        fetchActivityLogs();
                                    }}
                                >
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
                                    <TableHead>Kết quả</TableHead>
                                    <TableHead>Đối tượng</TableHead>
                                    <TableHead>Truy cập</TableHead>
                                    <TableHead>Chi tiết</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Loading skeleton
                                    [...Array(5)].map((_, index) => (
                                        <TableRow key={index}>
                                            {[...Array(currentUser?.role === 'superadmin' ? 7 : 6)].map((_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : activityLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={currentUser?.role === 'superadmin' ? 7 : 6} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <Activity className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-muted-foreground">Không tìm thấy bản ghi hoạt động nào</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activityLogs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                                    {formatDate(log?.timestamp || '')}
                                                </div>
                                            </TableCell>
                                            {currentUser?.role === 'superadmin' && (
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-gray-500" />
                                                        {log?.adminId ? (
                                                            <span className="font-medium">
                                                                {log.adminId.firstName || ''} {log.adminId.lastName || ''}
                                                            </span>
                                                        ) : 'N/A'}
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={getActionBadgeColor(log?.action)}
                                                >
                                                    <Activity className="mr-1 h-3 w-3" />
                                                    {getActionLabel(log?.action || '')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={getResultBadgeColor(log?.result)}
                                                >
                                                    {getResultIcon(log?.result || '')}
                                                    <span className="ml-1">{getResultLabel(log?.result || '')}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log?.targetId ? (
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-gray-500" />
                                                        <span className="text-sm">
                                                            {log.targetId.firstName || ''} {log.targetId.lastName || ''}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Globe className="h-3 w-3" />
                                                    <span className="font-mono text-xs">
                                                        {log?.ipAddress || 'N/A'}
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
                                                                <h3 className="font-bold mb-2 flex items-center gap-2">
                                                                    <Info className="h-4 w-4" />
                                                                    Chi tiết hoạt động
                                                                </h3>
                                                                <div className="text-sm space-y-2">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <span className="font-semibold">Hành động:</span>
                                                                        <span>{getActionLabel(log?.action || '')}</span>

                                                                        <span className="font-semibold">Kết quả:</span>
                                                                        <span>{getResultLabel(log?.result || '')}</span>

                                                                        <span className="font-semibold">Thời gian:</span>
                                                                        <span>{formatDate(log?.timestamp || '')}</span>

                                                                        {log?.ipAddress && (
                                                                            <>
                                                                                <span className="font-semibold">IP:</span>
                                                                                <span className="font-mono text-xs">{log.ipAddress}</span>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {log?.userAgent && (
                                                                        <div className="mt-2">
                                                                            <p className="font-semibold">User Agent:</p>
                                                                            <p className="text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                                                                                {log.userAgent}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {log?.details && Object.keys(log.details).length > 0 && (
                                                                        <div className="mt-2">
                                                                            <p className="font-semibold">Chi tiết kỹ thuật:</p>
                                                                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto max-h-32">
                                                                                {JSON.stringify(log.details, null, 2)}
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
                                                    <Eye className="h-4 w-4" />
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
                                Hiển thị {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, activityLogs.length)}
                                {totalPages > 1 && ` trên tổng số ${totalPages * 20} bản ghi`}
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
                                <div className="text-sm">
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
