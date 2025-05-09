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
    CheckCircle
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
    const [currentUser, setCurrentUser] = useState<UserData | null>(null)
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [processingUser, setProcessingUser] = useState<string | null>(null)

    const isSuperAdmin = currentUser?.role === 'superadmin'

    useEffect(() => {
        fetchUsers()
    }, [currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortDirection])

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

            setUsers(response.data)
            setTotalUsers(response.totalCount || response.data.length)
            setTotalPages(Math.ceil((response.totalCount || response.data.length) / itemsPerPage))
        } catch (err) {
            console.error('Error fetching users:', err)
            setError('Không thể tải danh sách người dùng')
            toast.error('Lỗi khi tải danh sách người dùng')
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
        if (!currentUser || !currentUser.role) return

        try {
            await api.patch(`/api/users/${currentUser.id}/role`, { role: currentUser.role })

            // Cập nhật local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === currentUser.id ? { ...user, role: currentUser.role } : user
                )
            )

            setIsModalOpen(false)
            setCurrentUser(null)
        } catch (error) {
            console.error('Lỗi khi cập nhật vai trò:', error)
            alert(t('admin.users.roleUpdateError'))
        }
    }

    const handleViewDetails = (user: UserData) => {
        setCurrentUser(user)
    }

    const handleOpenRoleDialog = (user: UserData) => {
        setCurrentUser(user)
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
        setCurrentUser(user)
        setModalType('edit')
        setIsModalOpen(true)
        setDropdownOpen(null)
    }

    const handleDeleteUser = (user: UserData) => {
        setCurrentUser(user)
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

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortDirection('asc')
        }
    }

    const handlePromoteUser = async (userId) => {
        if (!isSuperAdmin) {
            toast.error('Chỉ SuperAdmin mới có quyền thăng cấp người dùng')
            return
        }

        try {
            setProcessingUser(userId)
            await userService.promoteToAdmin(userId)
            toast.success('Đã thăng cấp người dùng thành Admin')
            fetchUsers()
        } catch (err) {
            console.error('Error promoting user:', err)
            toast.error('Không thể thăng cấp người dùng')
        } finally {
            setProcessingUser(null)
        }
    }

    const handleDemoteAdmin = async (userId) => {
        if (!isSuperAdmin) {
            toast.error('Chỉ SuperAdmin mới có quyền hạ cấp Admin')
            return
        }

        try {
            setProcessingUser(userId)
            await userService.demoteFromAdmin(userId)
            toast.success('Đã hạ cấp Admin xuống người dùng thường')
            fetchUsers()
        } catch (err) {
            console.error('Error demoting admin:', err)
            toast.error('Không thể hạ cấp Admin')
        } finally {
            setProcessingUser(null)
        }
    }

    const handleToggleUserStatus = async (userId, isActive) => {
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
        } catch (err) {
            console.error('Error toggling user status:', err)
            toast.error(`Không thể ${isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản người dùng`)
        } finally {
            setProcessingUser(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.users.title')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('admin.users.description')}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('admin.users.userList')}</CardTitle>
                    <CardDescription>
                        {t('admin.users.userListDescription')}
                    </CardDescription>

                    <form onSubmit={handleSearch} className="mt-4 flex w-full max-w-sm items-center space-x-2">
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
                                                        {isSuperAdmin && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleOpenRoleDialog(user)}
                                                                disabled={user.role === 'superadmin' && user.id === currentUser?.id}
                                                            >
                                                                <ShieldAlert className="mr-2 h-4 w-4" />
                                                                {t('admin.users.changeRole')}
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
                    <div className="flex items-center justify-end space-x-2 py-4">
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
                </CardContent>
            </Card>

            {/* Dialog xem chi tiết người dùng */}
            {currentUser && (
                <Dialog open={!!currentUser && !isModalOpen} onOpenChange={(open) => !open && setCurrentUser(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('admin.users.userDetails')}</DialogTitle>
                            <DialogDescription>
                                {currentUser.firstName} {currentUser.lastName}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.email')}:</div>
                                <div className="col-span-3">{currentUser.email}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.role')}:</div>
                                <div className="col-span-3">
                                    <Badge variant={getRoleBadgeVariant(currentUser.role)}>
                                        {currentUser.role}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.verified')}:</div>
                                <div className="col-span-3">
                                    {currentUser.active ? t('common.yes') : t('common.no')}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.created')}:</div>
                                <div className="col-span-3">
                                    {new Date(currentUser.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            {currentUser.lastLogin && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div className="text-right font-medium">{t('admin.users.lastLogin')}:</div>
                                    <div className="col-span-3">
                                        {new Date(currentUser.lastLogin).toLocaleDateString()}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setCurrentUser(null)}>
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
                                {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.email})
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="text-right font-medium">{t('admin.users.currentRole')}:</div>
                            <div className="col-span-3">
                                <Badge variant={getRoleBadgeVariant(currentUser?.role || 'user')}>
                                    {currentUser?.role}
                                </Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <div className="text-right font-medium">{t('admin.users.newRole')}:</div>
                            <div className="col-span-3">
                                <select
                                    value={currentUser?.role || 'user'}
                                    onChange={(e) => handleRoleChange(currentUser?.id || '', e.target.value)}
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
                                setCurrentUser(null)
                            }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleUpdateRole}
                            disabled={!currentUser || currentUser.role === selectedUsers.length > 0}
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 