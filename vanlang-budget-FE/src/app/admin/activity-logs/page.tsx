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
    Clock,
    Globe,
    Monitor,
    Target,
    CheckCircle,
    XCircle,
    AlertCircle,
    Copy,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '@/services/adminService';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/Tooltip';

interface ActivityLog {
    _id: string;
    adminId: string;
    admin?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
    actionType: string;
    targetId?: string;
    targetType?: string;
    inputData?: any;
    result: string;
    resultDetails?: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
}

interface AdminUser {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export default function ActivityLogsPage() {
    const router = useRouter();
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [selectedAdminId, setSelectedAdminId] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterAction, setFilterAction] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<{ start?: string, end?: string }>({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

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

        // Tải lịch sử hoạt động
        fetchActivityLogs();
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
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        // Hiển thị thời gian relative nếu trong vòng 24h
        if (diffInSeconds < 86400) { // 24 hours
            if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
            return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        }

        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionLabel = (action: string) => {
        const actionLabels: Record<string, string> = {
            // User Management Actions
            'USER_CREATE': 'Tạo người dùng',
            'USER_UPDATE': 'Cập nhật người dùng',
            'USER_DELETE': 'Xóa người dùng',
            'USER_ACTIVATE': 'Kích hoạt người dùng',
            'USER_DEACTIVATE': 'Vô hiệu hóa người dùng',
            'USER_PROMOTE': 'Thăng cấp người dùng',
            'USER_DEMOTE': 'Hạ cấp người dùng',
            'USER_RESET_PASSWORD': 'Đặt lại mật khẩu',
            'USER_VIEW': 'Xem người dùng',

            // Content Management Actions
            'CONTENT_CREATE': 'Tạo nội dung',
            'CONTENT_UPDATE': 'Cập nhật nội dung',
            'CONTENT_DELETE': 'Xóa nội dung',
            'CONTENT_APPROVE': 'Phê duyệt nội dung',
            'CONTENT_REJECT': 'Từ chối nội dung',
            'CONTENT_PUBLISH': 'Xuất bản nội dung',
            'CONTENT_RESTORE': 'Khôi phục nội dung',

            // Transaction Management Actions
            'TRANSACTIONS_VIEW': 'Xem giao dịch',
            'TRANSACTIONS_EXPORT': 'Xuất giao dịch',
            'TRANSACTION_VIEW': 'Xem chi tiết giao dịch',
            'TRANSACTION_UPDATE': 'Cập nhật giao dịch',
            'TRANSACTION_DELETE': 'Xóa giao dịch',

            // Admin Management Actions
            'ADMIN_CREATE': 'Tạo admin',
            'ADMIN_UPDATE': 'Cập nhật admin',
            'ADMIN_DELETE': 'Xóa admin',
            'ADMIN_TOGGLE_STATUS': 'Thay đổi trạng thái admin',
            'ADMIN_LIST_VIEW': 'Xem danh sách admin',

            // System Actions
            'LOGIN': 'Đăng nhập',
            'LOGOUT': 'Đăng xuất',
            'DASHBOARD_VIEW': 'Xem dashboard',
            'EXPORT_DATA': 'Xuất dữ liệu',
            'IMPORT_DATA': 'Nhập dữ liệu',

            // Dashboard Actions (legacy)
            'VIEW_DASHBOARD': 'Xem dashboard',

            // Admin Management (legacy)
            'VIEW_ADMIN_LIST': 'Xem danh sách admin',
            'CREATE_ADMIN': 'Tạo admin mới',
            'UPDATE_ADMIN': 'Cập nhật admin',
            'DELETE_ADMIN': 'Xóa admin',
            'ACTIVATE_ADMIN': 'Kích hoạt admin',
            'DEACTIVATE_ADMIN': 'Vô hiệu hóa admin',

            // Content Management (legacy)
            'VIEW_SITE_CONTENT': 'Xem nội dung site',
            'UPDATE_SITE_CONTENT': 'Cập nhật nội dung site',
            'APPROVE_CONTENT': 'Phê duyệt nội dung',
            'REJECT_CONTENT': 'Từ chối nội dung',
            'RESTORE_CONTENT_VERSION': 'Khôi phục phiên bản',

            // User Management (legacy)
            'VIEW_USER_LIST': 'Xem danh sách người dùng',
            'UPDATE_USER': 'Cập nhật người dùng',
            'DELETE_USER': 'Xóa người dùng',
            'RESET_USER_PASSWORD': 'Đặt lại mật khẩu',
            'ACTIVATE_USER': 'Kích hoạt người dùng',
            'DEACTIVATE_USER': 'Vô hiệu hóa người dùng',

            // Authentication (legacy)
            'FAILED_LOGIN': 'Đăng nhập thất bại',

            // System (legacy)
            'SYSTEM_CONFIG': 'Cấu hình hệ thống',
            'OTHER': 'Hoạt động khác'
        };

        return actionLabels[action] || action;
    };

    const getAdminName = (adminId: string) => {
        // Tìm log có admin data được populate
        const logWithAdmin = activityLogs.find(log => log.adminId === adminId && log.admin);
        if (logWithAdmin?.admin) {
            return `${logWithAdmin.admin.firstName} ${logWithAdmin.admin.lastName}`;
        }

        // Fallback: tìm trong danh sách admins
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
        return 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const handleOpenDialog = (log: ActivityLog) => {
        setSelectedLog(log);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setSelectedLog(null);
        setIsDialogOpen(false);
    };

    const handleCopyLogInfo = async () => {
        if (!selectedLog) return;

        const logInfo = {
            id: selectedLog._id,
            action: getActionLabel(selectedLog.actionType),
            timestamp: formatDate(selectedLog.timestamp),
            result: selectedLog.result,
            admin: selectedLog.admin ? `${selectedLog.admin.firstName} ${selectedLog.admin.lastName}` : 'N/A',
            targetType: selectedLog.targetType || 'N/A',
            targetId: selectedLog.targetId || 'N/A',
            ipAddress: selectedLog.ipAddress || 'N/A',
            userAgent: selectedLog.userAgent || 'N/A',
            inputData: selectedLog.inputData ? JSON.stringify(selectedLog.inputData, null, 2) : 'N/A',
            resultDetails: selectedLog.resultDetails || 'N/A',
            metadata: selectedLog.metadata ? JSON.stringify(selectedLog.metadata, null, 2) : 'N/A'
        };

        const textToCopy = `
=== CHI TIẾT HOẠT ĐỘNG ===
ID: ${logInfo.id}
Hành động: ${logInfo.action}
Thời gian: ${logInfo.timestamp}
Kết quả: ${logInfo.result}
Quản trị viên: ${logInfo.admin}
Loại đối tượng: ${logInfo.targetType}
ID đối tượng: ${logInfo.targetId}
Địa chỉ IP: ${logInfo.ipAddress}
User Agent: ${logInfo.userAgent}

=== DỮ LIỆU ĐẦU VÀO ===
${logInfo.inputData}

=== CHI TIẾT KẾT QUẢ ===
${logInfo.resultDetails}

=== METADATA ===
${logInfo.metadata}
        `.trim();

        try {
            await navigator.clipboard.writeText(textToCopy);
            toast.success('Đã copy thông tin vào clipboard');
        } catch (error) {
            toast.error('Không thể copy thông tin');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lịch sử hoạt động</h1>
                    <p className="text-muted-foreground mt-2">
                        Theo dõi các hoạt động của quản trị viên trong hệ thống
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
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

            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử hoạt động quản trị viên</CardTitle>
                    <CardDescription>
                        Xem lịch sử các thao tác được thực hiện bởi quản trị viên
                    </CardDescription>

                    <form onSubmit={handleSearch} className="mt-4 flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-64">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm hành động..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <Input
                                type="date"
                                placeholder="Từ ngày"
                                value={dateRange.start || ''}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="w-full"
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <Input
                                type="date"
                                placeholder="Đến ngày"
                                value={dateRange.end || ''}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
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
                                    <SelectItem value="USER_">Quản lý người dùng</SelectItem>
                                    <SelectItem value="ADMIN_">Quản lý admin</SelectItem>
                                    <SelectItem value="CONTENT_">Quản lý nội dung</SelectItem>
                                    <SelectItem value="TRANSACTION">Quản lý giao dịch</SelectItem>
                                    <SelectItem value="LOGIN">Đăng nhập</SelectItem>
                                    <SelectItem value="DASHBOARD_VIEW">Xem dashboard</SelectItem>
                                    <SelectItem value="EXPORT_DATA">Xuất dữ liệu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="mt-0">
                            <Search className="h-4 w-4 mr-2" />
                            Tìm kiếm
                        </Button>
                    </form>
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
                                    <TableHead>Kết quả</TableHead>
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
                                            Không tìm thấy bản ghi hoạt động nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activityLogs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                                    <div>
                                                        <div>{formatDate(log.timestamp)}</div>
                                                        {log.ipAddress && (
                                                            <div className="text-xs text-gray-500">
                                                                IP: {log.ipAddress}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {currentUser?.role === 'superadmin' && (
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-gray-500" />
                                                        {log.admin ? (
                                                            <span>
                                                                {log.admin.firstName} {log.admin.lastName}
                                                            </span>
                                                        ) : (
                                                            <span>
                                                                {getAdminName(log.adminId)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={getActionBadgeColor(log.actionType)}
                                                >
                                                    <Activity className="mr-1 h-3 w-3" />
                                                    {getActionLabel(log.actionType)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.targetType ? (
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-gray-500" />
                                                        <span className="capitalize">
                                                            {log.targetType === 'User' ? 'Người dùng' :
                                                                log.targetType === 'Admin' ? 'Quản trị viên' :
                                                                    log.targetType === 'SiteContent' ? 'Nội dung site' :
                                                                        log.targetType === 'System' ? 'Hệ thống' :
                                                                            log.targetType}
                                                        </span>
                                                        {log.targetId && (
                                                            <span className="ml-1 text-xs text-gray-500">
                                                                ({log.targetId.slice(-6)})
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        log.result === 'SUCCESS' ? 'bg-green-100 text-green-800 border-green-300' :
                                                            log.result === 'FAILED' ? 'bg-red-100 text-red-800 border-red-300' :
                                                                'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                    }
                                                >
                                                    {log.result === 'SUCCESS' ? '✓ Thành công' :
                                                        log.result === 'FAILED' ? '✗ Thất bại' : '⚠ Một phần'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                                                onClick={() => handleOpenDialog(log)}
                                                                aria-label={`Xem chi tiết hoạt động ${getActionLabel(log.actionType)}`}
                                                            >
                                                                <Info className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Xem chi tiết hoạt động</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {activityLogs.length > 0 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage <= 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Trang trước</span>
                            </Button>
                            <div>
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
                    )}
                </CardContent>
            </Card>

            {/* Dialog for displaying activity log details */}
            {isDialogOpen && selectedLog && (
                <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                Chi tiết hoạt động
                            </DialogTitle>
                            <DialogDescription>
                                Thông tin chi tiết về hoạt động được thực hiện bởi quản trị viên
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Thông tin cơ bản</h3>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Hành động</p>
                                            <p className="text-sm text-gray-600">{getActionLabel(selectedLog.actionType)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Clock className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Thời gian thực hiện</p>
                                            <p className="text-sm text-gray-600">{formatDate(selectedLog.timestamp)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        {selectedLog.result === 'SUCCESS' ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : selectedLog.result === 'FAILED' ? (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">Kết quả</p>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    selectedLog.result === 'SUCCESS' ? 'bg-green-100 text-green-800 border-green-300' :
                                                        selectedLog.result === 'FAILED' ? 'bg-red-100 text-red-800 border-red-300' :
                                                            'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                }
                                            >
                                                {selectedLog.result === 'SUCCESS' ? '✓ Thành công' :
                                                    selectedLog.result === 'FAILED' ? '✗ Thất bại' : '⚠ Một phần'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {selectedLog.admin && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <User className="h-5 w-5 text-indigo-600" />
                                            <div>
                                                <p className="font-medium text-gray-900">Quản trị viên</p>
                                                <p className="text-sm text-gray-600">
                                                    {selectedLog.admin.firstName} {selectedLog.admin.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">{selectedLog.admin.email}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Target Information */}
                            {selectedLog.targetType && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2">Đối tượng tác động</h3>
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                        <Target className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Loại đối tượng</p>
                                            <p className="text-sm text-gray-600">
                                                {selectedLog.targetType === 'User' ? 'Người dùng' :
                                                    selectedLog.targetType === 'Admin' ? 'Quản trị viên' :
                                                        selectedLog.targetType === 'SiteContent' ? 'Nội dung site' :
                                                            selectedLog.targetType === 'System' ? 'Hệ thống' :
                                                                selectedLog.targetType}
                                            </p>
                                            {selectedLog.targetId && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    ID: {selectedLog.targetId}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Technical Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">Thông tin kỹ thuật</h3>

                                {selectedLog.ipAddress && (
                                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                                        <Globe className="h-5 w-5 text-orange-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Địa chỉ IP</p>
                                            <p className="text-sm text-gray-600 font-mono">{selectedLog.ipAddress}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedLog.userAgent && (
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Monitor className="h-5 w-5 text-gray-600 mt-1" />
                                        <div>
                                            <p className="font-medium text-gray-900">User Agent</p>
                                            <p className="text-xs text-gray-600 break-all">{selectedLog.userAgent}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Data */}
                            {selectedLog.inputData && Object.keys(selectedLog.inputData).length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2">Dữ liệu đầu vào</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                                            {JSON.stringify(selectedLog.inputData, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Result Details */}
                            {selectedLog.resultDetails && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2">Chi tiết kết quả</h3>
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-700">{selectedLog.resultDetails}</p>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2">Metadata</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={handleCloseDialog}>
                                Đóng
                            </Button>
                            <Button variant="outline" onClick={handleCopyLogInfo}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy thông tin
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
