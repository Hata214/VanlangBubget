'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    Search,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    UserIcon,
    UserCheck,
    UserMinus,
    Shield,
    Ban,
    CheckCircle,
    AlertTriangle,
    UserPlus,
    Filter,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '@/services/adminService';

interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'admin' | 'superadmin';
    active: boolean;
    createdAt: string;
    lastLogin?: string;
}

export default function ManageAdminsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [processingUser, setProcessingUser] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    // Filter states - Initialize from URL params
    const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
    const [dateFilter, setDateFilter] = useState(searchParams.get('dateRange') || 'all');
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    useEffect(() => {
        // Kiểm tra xem người dùng hiện tại có phải là SuperAdmin không
        const userRole = localStorage.getItem('user_role');
        if (userRole !== 'superadmin') {
            toast.error('Bạn không có quyền truy cập trang này');
            router.push('/admin/dashboard');
            return;
        }

        // Lấy thông tin người dùng từ localStorage
        setCurrentUser({
            name: localStorage.getItem('user_name') || '',
            email: localStorage.getItem('user_email') || '',
            role: userRole
        });

        // Tải danh sách người dùng
        fetchUsers();
    }, [currentPage, debouncedSearchTerm, roleFilter, dateFilter]); // Include filters

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Calculate active filters count
    useEffect(() => {
        let count = 0;
        if (roleFilter !== 'all') count++;
        if (dateFilter !== 'all') count++;
        setActiveFiltersCount(count);
    }, [roleFilter, dateFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            // Prepare filter parameters
            const filterParams: any = {
                page: currentPage,
                limit: 10,
                search: debouncedSearchTerm
            };

            // Add role filter
            if (roleFilter !== 'all') {
                filterParams.role = roleFilter;
            }

            // Add date filter
            if (dateFilter !== 'all') {
                filterParams.dateRange = dateFilter;
            }

            // Gọi API thực để lấy danh sách tất cả người dùng từ MongoDB
            const response = await adminService.getAllUsers(filterParams);

            if (response.status === 'success' && response.data && Array.isArray(response.data.users)) {
                setUsers(response.data.users);
                setTotalPages(response.pagination?.totalPages || 1);
                console.log('Đã tải danh sách người dùng từ database:', response.data.users);
                toast.success(`Tải thành công ${response.data.users.length} người dùng`);
            } else {
                console.warn('Unexpected response format:', response);
                // Safe fallback
                const users = response?.data?.users || response?.data || [];
                const safeUsers = Array.isArray(users) ? users : [];
                setUsers(safeUsers);
                setTotalPages(1);

                if (safeUsers.length === 0) {
                    toast.success('Không tìm thấy người dùng nào');
                } else {
                    toast.success(`Tải thành công ${safeUsers.length} người dùng`);
                }
            }
        } catch (error: any) {
            console.error('Lỗi khi tải danh sách người dùng:', error);
            toast.error(error.response?.data?.message || 'Không thể tải danh sách người dùng từ database');
            setUsers([]); // Set empty array as fallback
        } finally {
            setLoading(false);
        }
    };

    const handlePromoteToAdmin = async (userId: string) => {
        try {
            setProcessingUser(userId);

            // Kiểm tra số lượng admin hiện tại
            const adminCount = users.filter(user => user.role === 'admin').length;
            if (adminCount >= 3) {
                toast.error('Đã đạt giới hạn tối đa 3 quản trị viên trong hệ thống');
                return;
            }

            // Gọi API để thăng cấp user lên admin
            const response = await adminService.updateUserRole(userId, 'admin');

            if (response.success || response.status === 'success') {
                toast.success('Đã thăng cấp người dùng lên quản trị viên');
                fetchUsers(); // Fetch lại danh sách sau khi cập nhật
            } else {
                throw new Error('Failed to promote user');
            }
        } catch (error: any) {
            console.error('Lỗi khi thăng cấp user:', error);
            toast.error(error.response?.data?.message || 'Không thể thăng cấp người dùng');
        } finally {
            setProcessingUser(null);
        }
    };

    const handleDemoteToUser = async (userId: string) => {
        try {
            setProcessingUser(userId);

            // Gọi API để hạ cấp admin xuống user
            const response = await adminService.updateUserRole(userId, 'user');

            if (response.success || response.status === 'success') {
                toast.success('Đã hạ cấp quản trị viên xuống người dùng thường');
                fetchUsers();
            } else {
                throw new Error('Failed to demote admin');
            }
        } catch (error: any) {
            console.error('Lỗi khi hạ cấp admin:', error);
            toast.error(error.response?.data?.message || 'Không thể hạ cấp quản trị viên');
        } finally {
            setProcessingUser(null);
        }
    };

    const handleToggleActive = async (userId: string, isActive: boolean) => {
        try {
            setProcessingUser(userId);

            // Gọi API thực để toggle trạng thái user
            const response = await adminService.toggleAdminStatus(userId);

            if (response.success || response.status === 'success') {
                toast.success(isActive
                    ? 'Đã vô hiệu hóa tài khoản người dùng'
                    : 'Đã kích hoạt tài khoản người dùng'
                );
                fetchUsers();
            } else {
                throw new Error('Failed to toggle user status');
            }
        } catch (error: any) {
            console.error('Lỗi khi thay đổi trạng thái user:', error);
            toast.error(error.response?.data?.message || `Không thể ${isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản người dùng`);
        } finally {
            setProcessingUser(null);
        }
    };

    const confirmDeleteUser = (userId: string) => {
        setSelectedUserId(userId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteUser = async () => {
        if (!selectedUserId) return;

        try {
            setProcessingUser(selectedUserId);

            // Gọi API thực để xóa user
            const response = await adminService.deleteAdmin(selectedUserId);

            if (response.success || response.status === 'success') {
                toast.success('Đã xóa người dùng thành công');
                fetchUsers();
                setShowDeleteConfirm(false);
                setSelectedUserId(null);
            } else {
                throw new Error('Failed to delete user');
            }
        } catch (error: any) {
            console.error('Lỗi khi xóa user:', error);
            toast.error(error.response?.data?.message || 'Không thể xóa người dùng');
        } finally {
            setProcessingUser(null);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm
        fetchUsers();
    };

    const updateURLParams = (filters: { role?: string; dateRange?: string; search?: string; page?: number }) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                params.set(key, String(value));
            } else {
                params.delete(key);
            }
        });

        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleResetFilters = () => {
        setRoleFilter('all');
        setDateFilter('all');
        setSearchTerm('');
        setCurrentPage(1);

        // Clear URL params
        router.push(window.location.pathname, { scroll: false });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'destructive';
            case 'admin':
                return 'default';
            case 'user':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'Super Admin';
            case 'admin':
                return 'Admin';
            case 'user':
                return 'User';
            default:
                return role;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Quyền Người dùng</h1>
                    <p className="text-muted-foreground mt-2">
                        Thăng/hạ cấp quyền người dùng - Dữ liệu thời gian thực từ MongoDB Database
                    </p>
                </div>
            </div>

            {/* Database connection status */}
            {!loading && users.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            <span>Kết nối thành công với MongoDB Database - Hiển thị dữ liệu thực</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Người dùng</CardTitle>
                    <CardDescription>
                        Quản lý quyền và vai trò của tất cả người dùng trong hệ thống
                    </CardDescription>

                    {/* Filter Controls */}
                    <div className="mt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Bộ lọc:</span>
                                {activeFiltersCount > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {activeFiltersCount} đang áp dụng
                                    </Badge>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {/* Role Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">Vai trò</label>
                                    <Select value={roleFilter} onValueChange={(value) => {
                                        setRoleFilter(value);
                                        setCurrentPage(1);
                                        updateURLParams({ role: value, page: 1 });
                                    }}>
                                        <SelectTrigger className="w-[120px] h-8">
                                            <SelectValue placeholder="Vai trò" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="superadmin">Super Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>



                                {/* Date Filter */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">Thời gian tạo</label>
                                    <Select value={dateFilter} onValueChange={(value) => {
                                        setDateFilter(value);
                                        setCurrentPage(1);
                                        updateURLParams({ dateRange: value, page: 1 });
                                    }}>
                                        <SelectTrigger className="w-[140px] h-8">
                                            <SelectValue placeholder="Thời gian" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả thời gian</SelectItem>
                                            <SelectItem value="7days">7 ngày qua</SelectItem>
                                            <SelectItem value="30days">30 ngày qua</SelectItem>
                                            <SelectItem value="90days">90 ngày qua</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Reset Filters Button */}
                                {activeFiltersCount > 0 && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-transparent">Reset</label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleResetFilters}
                                            className="h-8 px-2"
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Reset
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm theo tên hoặc email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon">
                                <Search className="h-4 w-4" />
                                <span className="sr-only">Tìm kiếm</span>
                            </Button>
                        </form>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead>Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Loading skeleton
                                    [...Array(3)].map((_, index) => (
                                        <TableRow key={index}>
                                            {[...Array(5)].map((_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Không tìm thấy người dùng nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">
                                                {user.firstName} {user.lastName}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                                    {getRoleDisplayName(user.role)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(user.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Mở menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Quản lý Quyền</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />

                                                        {/* Thăng cấp User lên Admin */}
                                                        {user.role === 'user' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handlePromoteToAdmin(user._id)}
                                                                disabled={processingUser === user._id}
                                                                className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                                            >
                                                                <UserPlus className="mr-2 h-4 w-4" />
                                                                {processingUser === user._id ? 'Đang xử lý...' : 'Thăng cấp lên Admin'}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Hạ cấp Admin xuống User */}
                                                        {user.role === 'admin' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleDemoteToUser(user._id)}
                                                                disabled={processingUser === user._id}
                                                                className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                                                            >
                                                                <UserMinus className="mr-2 h-4 w-4" />
                                                                {processingUser === user._id ? 'Đang xử lý...' : 'Hạ cấp xuống User'}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Kích hoạt/Vô hiệu hóa tài khoản - Không áp dụng cho SuperAdmin */}
                                                        {user.role !== 'superadmin' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleActive(user._id, user.active)}
                                                                disabled={processingUser === user._id}
                                                                className={user.active ? "text-red-600 focus:text-red-600 focus:bg-red-50" : "text-green-600 focus:text-green-600 focus:bg-green-50"}
                                                            >
                                                                {user.active ? (
                                                                    <>
                                                                        <Ban className="mr-2 h-4 w-4" />
                                                                        {processingUser === user._id ? 'Đang xử lý...' : 'Vô hiệu hóa tài khoản'}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        {processingUser === user._id ? 'Đang xử lý...' : 'Kích hoạt tài khoản'}
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Xóa người dùng - Không áp dụng cho SuperAdmin */}
                                                        {user.role !== 'superadmin' && (
                                                            <DropdownMenuItem
                                                                onClick={() => confirmDeleteUser(user._id)}
                                                                disabled={processingUser === user._id}
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            >
                                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                                {processingUser === user._id ? 'Đang xử lý...' : 'Xóa người dùng'}
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {users.length > 0 && (
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

            {/* Dialog Xác nhận xóa người dùng */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
                        <DialogDescription>
                            Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa người dùng này không?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                setSelectedUserId(null);
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleDeleteUser}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={processingUser === selectedUserId}
                        >
                            {processingUser === selectedUserId ? 'Đang xử lý...' : 'Xác nhận xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
