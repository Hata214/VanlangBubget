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
    id: string;
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

    useEffect(() => {
        // Lấy thông tin người dùng hiện tại từ localStorage
        const userRole = localStorage.getItem('user_role');
        setCurrentUser({
            id: localStorage.getItem('user_id') || '',
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

            // Authentication
            LOGIN: 'Đăng nhập',
            LOGOUT: 'Đăng xuất',
            FAILED_LOGIN: 'Đăng nhập thất bại',

            // System
            SYSTEM_CONFIG: 'Cấu hình hệ thống',
            OTHER: 'Hoạt động khác'
        };

        return actionLabels[action] || action;
    };

    const getAdminName = (adminId: string) => {
        const admin = admins.find(a => a.id === adminId || a._id === adminId);
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
                                            <SelectItem key={admin.id} value={admin.id}>
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
                                    <SelectItem value="CREATE">Tạo mới</SelectItem>
                                    <SelectItem value="UPDATE">Cập nhật</SelectItem>
                                    <SelectItem value="DELETE">Xóa</SelectItem>
                                    <SelectItem value="VIEW">Xem</SelectItem>
                                    <SelectItem value="ACTIVATE">Kích hoạt</SelectItem>
                                    <SelectItem value="DEACTIVATE">Vô hiệu hóa</SelectItem>
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
                                    <TableHead>Chi tiết</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Loading skeleton
                                    [...Array(5)].map((_, index) => (
                                        <TableRow key={index}>
                                            {[...Array(currentUser?.role === 'superadmin' ? 5 : 4)].map((_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : activityLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={currentUser?.role === 'superadmin' ? 5 : 4} className="text-center py-8">
                                            Không tìm thấy bản ghi hoạt động nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activityLogs.map((log) => (
                                        <TableRow key={log._id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                                                    {formatDate(log.timestamp)}
                                                </div>
                                            </TableCell>
                                            {currentUser?.role === 'superadmin' && (
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-gray-500" />
                                                        {log.adminId ? (
                                                            <span>
                                                                {getAdminName(log.adminId)}
                                                            </span>
                                                        ) : 'N/A'}
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={getActionBadgeColor(log.action)}
                                                >
                                                    <Activity className="mr-1 h-3 w-3" />
                                                    {getActionLabel(log.action)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.targetId ? (
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-gray-500" />
                                                        {log.targetId.firstName} {log.targetId.lastName}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
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
                                                                <div className="text-sm">
                                                                    <p><span className="font-semibold">Hành động:</span> {getActionLabel(log.action)}</p>
                                                                    <p><span className="font-semibold">Thời gian:</span> {formatDate(log.timestamp)}</p>
                                                                    {log.ipAddress && <p><span className="font-semibold">IP:</span> {log.ipAddress}</p>}
                                                                    {log.details && Object.keys(log.details).length > 0 && (
                                                                        <div className="mt-2">
                                                                            <p className="font-semibold">Chi tiết:</p>
                                                                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                                                                {JSON.stringify(log.details, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    onClick={() => toast.dismiss(t.id)}
                                                                    className="mt-2"
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    Đóng
                                                                </Button>
                                                            </div>
                                                        ), {
                                                            duration: 10000,
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
        </div>
    );
} 