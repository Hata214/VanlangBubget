'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAppSelector } from '@/redux/hooks'
import api from '@/services/api'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
    Search,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    UserIcon,
    Eye,
    UserPlus,
    Edit,
    Trash2,
    Shield,
    ShieldOff,
    Filter,
    ChevronDown,
    Mail,
    Upload,
    Download,
    MoreVertical,
    ArrowUp,
    ArrowDown,
    UserCheck,
    UserMinus,
    Ban,
    CheckCircle,
    RefreshCw,
    FileUp
} from 'lucide-react'
import { format } from 'date-fns'
import userService from '@/services/userService'
import { toast } from 'react-hot-toast'

interface UserData {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    active: boolean
    createdAt: string
    lastLogin?: string
}

export default function AdminUsersPage() {
    const t = useTranslations()
    const { user: currentUser } = useAppSelector((state) => state.auth)
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [currentFilter, setCurrentFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalUsers, setTotalUsers] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalType, setModalType] = useState<'add' | 'edit' | 'delete'>('add')
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [processingUser, setProcessingUser] = useState<string | null>(null)
    const [showCreateUserModal, setShowCreateUserModal] = useState(false)
    const [newUserData, setNewUserData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'user'
    })

    const isSuperAdmin = currentUser?.role === 'superadmin'

    useEffect(() => {
        fetchUsers()
    }, [currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortDirection])

    useEffect(() => {
        const currentUserRole = localStorage.getItem('user_role');
        const isSuperAdminUser = currentUserRole === 'superadmin';
        console.log('Current user role from localStorage:', currentUserRole);
        console.log('Is SuperAdmin:', isSuperAdminUser);
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await userService.getUsers({
                page: currentPage,
                limit: 10,
                search: searchTerm,
                role: roleFilter,
                status: statusFilter,
                sortBy,
                sortDirection
            })

            // Handle response format from backend
            if (response.success && response.data) {
                setUsers(response.data.map((user: any) => ({
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    active: user.active,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                })))
                setTotalUsers(response.total || response.data.length)
                setTotalPages(response.totalPages || Math.ceil((response.total || response.data.length) / 10))
            } else {
                // Fallback for different response format
                setUsers(response.data || [])
                setTotalUsers(response.totalCount || response.total || response.data?.length || 0)
                setTotalPages(Math.ceil((response.totalCount || response.total || response.data?.length || 0) / 10))
            }
        } catch (err: any) {
            console.error('Error fetching users:', err)
            setError('Không thể tải danh sách người dùng')
            const errorMessage = err?.response?.data?.message || 'Lỗi khi tải danh sách người dùng'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)  // Reset về trang đầu tiên khi tìm kiếm
        fetchUsers()
    }

    const handleUpdateRole = async () => {
        if (!selectedUser || !selectedUser.role) return

        try {
            await api.patch(`/api/users/${selectedUser.id}/role`, { role: selectedUser.role })

            // Cập nhật local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === selectedUser.id ? { ...user, role: selectedUser.role } : user
                )
            )

            setIsModalOpen(false)
            setSelectedUser(null)
        } catch (error) {
            console.error('Lỗi khi cập nhật vai trò:', error)
            alert(t('admin.users.roleUpdateError'))
        }
    }

    const handleViewDetails = (user: UserData) => {
        setSelectedUser(user)
    }

    const handleOpenRoleDialog = (user: UserData) => {
        setSelectedUser(user)
        setModalType('edit')
        setIsModalOpen(true)
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'destructive'
            case 'admin':
                return 'default'
            default:
                return 'secondary'
        }
    }

    const toggleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(users.map(user => user.id))
        }
    }

    const toggleDropdown = (userId: string) => {
        setDropdownOpen(dropdownOpen === userId ? null : userId)
    }

    const handleRoleChange = (userId: string, newRole: string) => {
        console.log(`Thay đổi role của người dùng ${userId} thành ${newRole}`)
        setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
        ))
        setDropdownOpen(null)
    }

    const handleToggleActive = (userId: string) => {
        console.log(`Thay đổi trạng thái active của người dùng ${userId}`)
        setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, active: !user.active } : user
        ))
        setDropdownOpen(null)
    }

    const handleEditUser = (user: UserData) => {
        setSelectedUser(user)
        setModalType('edit')
        setIsModalOpen(true)
        setDropdownOpen(null)
    }

    const handleDeleteUser = (user: UserData) => {
        setSelectedUser(user)
        setModalType('delete')
        setIsModalOpen(true)
        setDropdownOpen(null)
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date)
    }

    const applyFilter = (role = roleFilter, status = statusFilter) => {
        setRoleFilter(role)
        setStatusFilter(status)
        setCurrentPage(1)
        setShowFilterDropdown(false)
    }

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortDirection('asc')
        }
    }

    const handlePromoteUser = async (userId: string) => {
        if (!isSuperAdmin) {
            toast.error('Chỉ SuperAdmin mới có quyền thăng cấp người dùng')
            return
        }

        try {
            setProcessingUser(userId)
            await userService.promoteToAdmin(userId)
            toast.success('Đã thăng cấp người dùng thành Admin')
            fetchUsers()
        } catch (err: any) {
            console.error('Error promoting user:', err)
            const errorMessage = err?.response?.data?.message || 'Không thể thăng cấp người dùng'
            toast.error(errorMessage)
        } finally {
            setProcessingUser(null)
        }
    }

    const handleDemoteAdmin = async (userId: string) => {
        if (!isSuperAdmin) {
            toast.error('Chỉ SuperAdmin mới có quyền hạ cấp Admin')
            return
        }

        try {
            setProcessingUser(userId)
            await userService.demoteFromAdmin(userId)
            toast.success('Đã hạ cấp Admin xuống người dùng thường')
            fetchUsers()
        } catch (err: any) {
            console.error('Error demoting admin:', err)
            const errorMessage = err?.response?.data?.message || 'Không thể hạ cấp Admin'
            toast.error(errorMessage)
        } finally {
            setProcessingUser(null)
        }
    }

    const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
        try {
            setProcessingUser(userId)
            if (isActive) {
                await userService.deactivateUser(userId)
                toast.success('Đã vô hiệu hóa tài khoản người dùng')
            } else {
                await userService.activateUser(userId)
                toast.success('Đã kích hoạt tài khoản người dùng')
            }
            fetchUsers()
        } catch (err: any) {
            console.error('Error toggling user status:', err)
            const errorMessage = err?.response?.data?.message || `Không thể ${isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản người dùng`
            toast.error(errorMessage)
        } finally {
            setProcessingUser(null)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setLoading(true)
            await userService.createUser(newUserData)
            toast.success('Tạo người dùng mới thành công')
            setShowCreateUserModal(false)
            setNewUserData({
                email: '',
                firstName: '',
                lastName: '',
                password: '',
                role: 'user'
            })
            fetchUsers()
        } catch (error: any) {
            console.error('Lỗi khi tạo người dùng:', error)
            const errorMessage = error?.response?.data?.message || 'Không thể tạo người dùng mới'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = () => {
        fetchUsers()
        toast.success('Đã tải lại danh sách người dùng')
    }

    const handleExportCSV = () => {
        try {
            // Tạo dữ liệu CSV
            const headers = ['Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo']
            const data = users.map(user => [
                `${user.firstName} ${user.lastName}`,
                user.email,
                user.role,
                user.active ? 'Hoạt động' : 'Vô hiệu',
                formatDate(user.createdAt)
            ])

            // Ghép headers và dữ liệu
            const csvContent = [
                headers.join(','),
                ...data.map(row => row.join(','))
            ].join('\n')

            // Tạo blob và download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `users-${new Date().toISOString().slice(0, 10)}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success('Xuất dữ liệu thành công')
        } catch (error) {
            console.error('Lỗi khi xuất dữ liệu:', error)
            toast.error('Không thể xuất dữ liệu')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('admin.users.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('admin.users.description')}
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
                        onClick={handleExportCSV}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Xuất CSV
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowCreateUserModal(true)}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Tạo người dùng
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>{t('admin.users.userList')}</CardTitle>
                            <CardDescription>
                                {t('admin.users.userListDescription')}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                        <form onSubmit={handleSearch} className="flex flex-1 max-w-sm items-center space-x-2">
                            <Input
                                type="text"
                                placeholder={t('admin.users.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon">
                                <Search className="h-4 w-4" />
                                <span className="sr-only">{t('common.search')}</span>
                            </Button>
                        </form>

                        <div className="flex flex-col md:flex-row gap-2">
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value)
                                    setCurrentPage(1)
                                    fetchUsers()
                                }}
                                className="h-10 w-full md:w-40 rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="">Tất cả vai trò</option>
                                <option value="user">Người dùng</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">SuperAdmin</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value)
                                    setCurrentPage(1)
                                    fetchUsers()
                                }}
                                className="h-10 w-full md:w-40 rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Vô hiệu hóa</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('admin.users.name')}</TableHead>
                                    <TableHead>{t('admin.users.email')}</TableHead>
                                    <TableHead>{t('admin.users.role')}</TableHead>
                                    <TableHead>{t('admin.users.verified')}</TableHead>
                                    <TableHead>{t('admin.users.created')}</TableHead>
                                    <TableHead>{t('admin.users.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Loading skeleton
                                    [...Array(5)].map((_, index) => (
                                        <TableRow key={index}>
                                            {[...Array(6)].map((_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            {t('admin.users.noUsersFound')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                {user.firstName} {user.lastName}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.active ? t('common.yes') : t('common.no')}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">{t('common.openMenu')}</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>{t('admin.users.actions')}</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t('admin.users.viewDetails')}
                                                        </DropdownMenuItem>

                                                        {isSuperAdmin && user.role !== 'superadmin' && (
                                                            <>
                                                                {user.role === 'user' ? (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handlePromoteUser(user.id)}
                                                                        disabled={processingUser === user.id}
                                                                    >
                                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                                        {processingUser === user.id ? 'Đang xử lý...' : 'Nâng cấp lên Admin'}
                                                                    </DropdownMenuItem>
                                                                ) : user.role === 'admin' && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDemoteAdmin(user.id)}
                                                                        disabled={processingUser === user.id}
                                                                    >
                                                                        <UserMinus className="mr-2 h-4 w-4" />
                                                                        {processingUser === user.id ? 'Đang xử lý...' : 'Hạ cấp xuống User'}
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </>
                                                        )}

                                                        {(isSuperAdmin || (user.role !== 'admin' && user.role !== 'superadmin')) && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleUserStatus(user.id, user.active)}
                                                                disabled={processingUser === user.id || user.role === 'superadmin'}
                                                            >
                                                                {user.active ? (
                                                                    <>
                                                                        <Ban className="mr-2 h-4 w-4" />
                                                                        {processingUser === user.id ? 'Đang xử lý...' : 'Vô hiệu hóa tài khoản'}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        {processingUser === user.id ? 'Đang xử lý...' : 'Kích hoạt tài khoản'}
                                                                    </>
                                                                )}
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
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div>
                            Hiển thị {users.length} trên tổng số {totalUsers} người dùng
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">{t('common.previous')}</span>
                            </Button>
                            <div>
                                {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage >= totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">{t('common.next')}</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog xem chi tiết người dùng */}
            {selectedUser && (
                <Dialog open={!!selectedUser && !isModalOpen} onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('admin.users.userDetails')}</DialogTitle>
                            <DialogDescription>
                                {selectedUser.firstName} {selectedUser.lastName}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.email')}:</div>
                                <div className="col-span-3">{selectedUser.email}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.role')}:</div>
                                <div className="col-span-3">
                                    <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                                        {selectedUser.role}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.verified')}:</div>
                                <div className="col-span-3">
                                    {selectedUser.active ? t('common.yes') : t('common.no')}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.created')}:</div>
                                <div className="col-span-3">
                                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            {selectedUser.lastLogin && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div className="text-right font-medium">{t('admin.users.lastLogin')}:</div>
                                    <div className="col-span-3">
                                        {new Date(selectedUser.lastLogin).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                                {t('common.close')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Dialog thay đổi vai trò */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('admin.users.changeRoleTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.users.changeRoleDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="text-right font-medium">{t('admin.users.user')}:</div>
                            <div className="col-span-3">
                                {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.email})
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="text-right font-medium">{t('admin.users.currentRole')}:</div>
                            <div className="col-span-3">
                                <Badge variant={getRoleBadgeVariant(selectedUser?.role || 'user')}>
                                    {selectedUser?.role}
                                </Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="text-right font-medium">{t('admin.users.newRole')}:</div>
                            <div className="col-span-3">
                                <select
                                    value={selectedUser?.role || 'user'}
                                    onChange={(e) => handleRoleChange(selectedUser?.id || '', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                                >
                                    <option value="user">{t('admin.users.roleUser')}</option>
                                    <option value="admin">{t('admin.users.roleAdmin')}</option>
                                    <option value="superadmin">{t('admin.users.roleSuperadmin')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false)
                                setSelectedUser(null)
                            }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleUpdateRole}
                            disabled={!selectedUser || selectedUser.role === ''}
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal tạo người dùng mới */}
            <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tạo người dùng mới</DialogTitle>
                        <DialogDescription>
                            Nhập thông tin để tạo tài khoản người dùng mới
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">Email:</div>
                                <div className="col-span-3">
                                    <Input
                                        type="email"
                                        value={newUserData.email}
                                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                        className="w-full"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">Họ:</div>
                                <div className="col-span-3">
                                    <Input
                                        type="text"
                                        value={newUserData.firstName}
                                        onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                                        className="w-full"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">Tên:</div>
                                <div className="col-span-3">
                                    <Input
                                        type="text"
                                        value={newUserData.lastName}
                                        onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                                        className="w-full"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">Mật khẩu:</div>
                                <div className="col-span-3">
                                    <Input
                                        type="password"
                                        value={newUserData.password}
                                        onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                        className="w-full"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">Vai trò:</div>
                                <div className="col-span-3">
                                    <select
                                        value={newUserData.role}
                                        onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                                        required
                                    >
                                        <option value="user">Người dùng</option>
                                        {isSuperAdmin && <option value="admin">Admin</option>}
                                        {isSuperAdmin && <option value="superadmin">SuperAdmin</option>}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                onClick={() => setShowCreateUserModal(false)}
                                type="button"
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Đang xử lý...' : 'Tạo người dùng'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
} 