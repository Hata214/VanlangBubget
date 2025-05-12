'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
    UserPlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    active: boolean;
    createdAt: string;
    lastLogin?: string;
}

export default function ManageAdminsPage() {
    const router = useRouter();
    const t = useTranslations();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [processingUser, setProcessingUser] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

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

        // Tải danh sách admin
        fetchAdmins();
    }, [router, currentPage, searchTerm]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);

            // Trong môi trường thực tế, bạn sẽ gọi API để lấy danh sách admin
            // Ví dụ: const response = await fetch('/api/admin/manage-admins?page=${currentPage}&search=${searchTerm}');

            // Giả lập dữ liệu cho mục đích demo
            setTimeout(() => {
                const mockAdmins = [
                    {
                        id: '1',
                        email: 'superadmin@control.vn',
                        firstName: 'Super',
                        lastName: 'Admin',
                        role: 'superadmin',
                        active: true,
                        createdAt: '2023-01-01T00:00:00.000Z',
                        lastLogin: '2023-05-15T10:30:00.000Z'
                    },
                    {
                        id: '2',
                        email: 'admin1@example.com',
                        firstName: 'Admin',
                        lastName: 'One',
                        role: 'admin',
                        active: true,
                        createdAt: '2023-02-15T00:00:00.000Z',
                        lastLogin: '2023-05-14T14:20:00.000Z'
                    },
                    {
                        id: '3',
                        email: 'admin2@example.com',
                        firstName: 'Admin',
                        lastName: 'Two',
                        role: 'admin',
                        active: true,
                        createdAt: '2023-03-10T00:00:00.000Z',
                        lastLogin: '2023-05-10T09:15:00.000Z'
                    }
                ];

                // Lọc theo searchTerm nếu có
                const filteredAdmins = searchTerm
                    ? mockAdmins.filter(admin =>
                        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    : mockAdmins;

                setAdmins(filteredAdmins);
                setTotalPages(1); // Giả sử chỉ có 1 trang
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error('Lỗi khi tải danh sách admin:', error);
            toast.error('Không thể tải danh sách quản trị viên');
            setLoading(false);
        }
    };

    const handleAddAdmin = async () => {
        try {
            if (!newAdminEmail || !newAdminName) {
                toast.error('Vui lòng nhập đầy đủ thông tin');
                return;
            }

            // Giả lập việc thêm admin
            toast.success(`Đã thêm ${newAdminName} (${newAdminEmail}) làm quản trị viên`);
            setShowAddAdminDialog(false);
            setNewAdminEmail('');
            setNewAdminName('');

            // Fetch lại danh sách sau khi thêm
            fetchAdmins();
        } catch (error) {
            console.error('Lỗi khi thêm admin:', error);
            toast.error('Không thể thêm quản trị viên');
        }
    };

    const handleDemoteAdmin = async (adminId: string) => {
        try {
            setProcessingUser(adminId);

            // Giả lập việc hạ cấp admin
            setTimeout(() => {
                toast.success('Đã hạ cấp quản trị viên xuống người dùng thường');
                fetchAdmins();
                setProcessingUser(null);
            }, 800);
        } catch (error) {
            console.error('Lỗi khi hạ cấp admin:', error);
            toast.error('Không thể hạ cấp quản trị viên');
            setProcessingUser(null);
        }
    };

    const handleToggleActive = async (adminId: string, isActive: boolean) => {
        try {
            setProcessingUser(adminId);

            // Giả lập việc vô hiệu hóa/kích hoạt admin
            setTimeout(() => {
                toast.success(isActive
                    ? 'Đã vô hiệu hóa tài khoản quản trị viên'
                    : 'Đã kích hoạt tài khoản quản trị viên'
                );
                fetchAdmins();
                setProcessingUser(null);
            }, 800);
        } catch (error) {
            console.error('Lỗi khi thay đổi trạng thái admin:', error);
            toast.error(`Không thể ${isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản quản trị viên`);
            setProcessingUser(null);
        }
    };

    const confirmDeleteAdmin = (adminId: string) => {
        setSelectedAdminId(adminId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteAdmin = async () => {
        if (!selectedAdminId) return;

        try {
            setProcessingUser(selectedAdminId);

            // Giả lập việc xóa admin
            setTimeout(() => {
                toast.success('Đã xóa quản trị viên thành công');
                fetchAdmins();
                setProcessingUser(null);
                setShowDeleteConfirm(false);
                setSelectedAdminId(null);
            }, 800);
        } catch (error) {
            console.error('Lỗi khi xóa admin:', error);
            toast.error('Không thể xóa quản trị viên');
            setProcessingUser(null);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm
        fetchAdmins();
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
            default:
                return 'secondary';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Admin</h1>
                    <p className="text-muted-foreground mt-2">
                        Quản lý tài khoản quản trị viên hệ thống
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddAdminDialog(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Thêm Quản trị viên
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Quản trị viên</CardTitle>
                    <CardDescription>
                        Quản lý và giám sát các tài khoản quản trị viên trong hệ thống
                    </CardDescription>

                    <form onSubmit={handleSearch} className="mt-4 flex w-full max-w-sm items-center space-x-2">
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
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead>Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Loading skeleton
                                    [...Array(3)].map((_, index) => (
                                        <TableRow key={index}>
                                            {[...Array(6)].map((_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : admins.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Không tìm thấy quản trị viên nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    admins.map((admin) => (
                                        <TableRow key={admin.id}>
                                            <TableCell className="font-medium">
                                                {admin.firstName} {admin.lastName}
                                            </TableCell>
                                            <TableCell>{admin.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(admin.role)}>
                                                    {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {admin.active ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Kích hoạt
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                        Vô hiệu hóa
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(admin.createdAt)}
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
                                                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />

                                                        {/* Không hiển thị tùy chọn hạ cấp cho SuperAdmin */}
                                                        {admin.role === 'admin' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleDemoteAdmin(admin.id)}
                                                                disabled={processingUser === admin.id}
                                                                className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                                                            >
                                                                <UserMinus className="mr-2 h-4 w-4" />
                                                                {processingUser === admin.id ? 'Đang xử lý...' : 'Hạ cấp xuống User'}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Không hiển thị tùy chọn kích hoạt/vô hiệu hóa cho chính mình hoặc SuperAdmin khác */}
                                                        {(admin.role !== 'superadmin' || admin.id === currentUser?.id) && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleActive(admin.id, admin.active)}
                                                                disabled={processingUser === admin.id}
                                                                className={admin.active ? "text-red-600 focus:text-red-600 focus:bg-red-50" : "text-green-600 focus:text-green-600 focus:bg-green-50"}
                                                            >
                                                                {admin.active ? (
                                                                    <>
                                                                        <Ban className="mr-2 h-4 w-4" />
                                                                        {processingUser === admin.id ? 'Đang xử lý...' : 'Vô hiệu hóa tài khoản'}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        {processingUser === admin.id ? 'Đang xử lý...' : 'Kích hoạt tài khoản'}
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Không hiển thị tùy chọn xóa cho SuperAdmin */}
                                                        {admin.role !== 'superadmin' && (
                                                            <DropdownMenuItem
                                                                onClick={() => confirmDeleteAdmin(admin.id)}
                                                                disabled={processingUser === admin.id}
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            >
                                                                <AlertTriangle className="mr-2 h-4 w-4" />
                                                                {processingUser === admin.id ? 'Đang xử lý...' : 'Xóa quản trị viên'}
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
                    {admins.length > 0 && (
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

            {/* Dialog Thêm admin mới */}
            <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Thêm Quản trị viên mới</DialogTitle>
                        <DialogDescription>
                            Nhập thông tin để thêm người dùng mới với vai trò Quản trị viên
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="name" className="text-right font-medium">
                                Họ tên
                            </label>
                            <Input
                                id="name"
                                value={newAdminName}
                                onChange={(e) => setNewAdminName(e.target.value)}
                                className="col-span-3"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="email" className="text-right font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="col-span-3"
                                placeholder="admin@example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleAddAdmin} className="bg-red-600 hover:bg-red-700 text-white">
                            Thêm Quản trị viên
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Xác nhận xóa admin */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa quản trị viên</DialogTitle>
                        <DialogDescription>
                            Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa quản trị viên này không?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                setSelectedAdminId(null);
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleDeleteAdmin}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={processingUser === selectedAdminId}
                        >
                            {processingUser === selectedAdminId ? 'Đang xử lý...' : 'Xác nhận xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 