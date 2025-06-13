'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
    FileUp,
    X
} from 'lucide-react'
import { format } from 'date-fns'
import userService from '@/services/userService'
import { toast } from 'react-hot-toast'

interface UserData {
    _id: string
    email: string
    firstName: string
    lastName: string
    role: string
    active: boolean
    isEmailVerified: boolean
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

    // Ref để maintain focus trên search input
    const searchInputRef = useRef<HTMLInputElement>(null)

    const isSuperAdmin = currentUser?.role === 'superadmin'

    // Load users khi component mount và khi pagination/sorting thay đổi
    useEffect(() => {
        fetchUsersWithParams(currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortDirection)
    }, [currentPage, sortBy, sortDirection]) // Không include fetchUsersWithParams để tránh infinite loop

    useEffect(() => {
        const currentUserRole = localStorage.getItem('user_role');
        const isSuperAdminUser = currentUserRole === 'superadmin';
        console.log('Current user role from localStorage:', currentUserRole);
        console.log('Is SuperAdmin:', isSuperAdminUser);
    }, []);

    // Function để fetch users với parameters cụ thể (tránh dependency issues)
    const fetchUsersWithParams = useCallback(async (
        page = currentPage,
        search = searchTerm,
        role = roleFilter,
        status = statusFilter,
        sort = sortBy,
        direction = sortDirection
    ) => {
        try {
            setLoading(true)
            const response = await userService.getUsers({
                page,
                limit: 10,
                search: search.trim(),
                role,
                status,
                sortBy: sort,
                sortDirection: direction
            })

            // Handle response format from backend - ensure data is array
            const responseData = response?.data;
            const responseStatus = response?.status;

            console.log('API Response:', { responseStatus, responseData, response });

            if ((responseStatus === 'success' || response.success) && Array.isArray(responseData)) {
                const mappedUsers = responseData.map((user: any) => ({
                    _id: user._id || user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    active: user.active !== undefined ? user.active : true,
                    isEmailVerified: user.isEmailVerified || false,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }))
                setUsers(mappedUsers)
                setTotalUsers(response.total || responseData.length || 0)
                setTotalPages(response.totalPages || Math.ceil((response.total || responseData.length || 0) / 10))
            } else {
                // Fallback - ensure we handle all possible response formats
                console.warn('Unexpected response format:', response);
                const fallbackData = responseData || response || [];
                const dataArray = Array.isArray(fallbackData) ? fallbackData : [];

                const mappedUsers = dataArray.map((user: any) => ({
                    _id: user._id || user.id,
                    email: user.email || '',
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    role: user.role || 'user',
                    active: user.active !== undefined ? user.active : true,
                    isEmailVerified: user.isEmailVerified || false,
                    createdAt: user.createdAt || new Date().toISOString(),
                    lastLogin: user.lastLogin
                }))
                setUsers(mappedUsers)
                setTotalUsers(dataArray.length || 0)
                setTotalPages(Math.ceil((dataArray.length || 0) / 10))
            }
        } catch (err: any) {
            console.error('Error fetching users:', err)
            setError('Không thể tải danh sách người dùng')
            const errorMessage = err?.response?.data?.message || 'Lỗi khi tải danh sách người dùng'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
            // Maintain focus trên search input sau khi API call hoàn thành
            if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
                // Chỉ restore focus nếu user đang focus vào search input trước đó
                const wasSearchFocused = document.activeElement?.getAttribute('data-search-input') === 'true'
                if (wasSearchFocused) {
                    setTimeout(() => {
                        searchInputRef.current?.focus()
                    }, 0)
                }
            }
        }
    }, []) // Empty dependencies vì chúng ta truyền tất cả params vào function

    // Wrapper function để giữ tương thích với code hiện tại
    const fetchUsers = () => {
        fetchUsersWithParams(currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortDirection)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)  // Reset về trang đầu tiên khi tìm kiếm
        fetchUsersWithParams(1, searchTerm, roleFilter, statusFilter, sortBy, sortDirection)
    }

    // Function để clear search term
    const handleClearSearch = () => {
        setSearchTerm('')
        setCurrentPage(1)
        fetchUsersWithParams(1, '', roleFilter, statusFilter, sortBy, sortDirection)
        // Focus lại vào search input sau khi clear
        setTimeout(() => {
            searchInputRef.current?.focus()
        }, 0)
    }

    // Debounced search để tự động tìm kiếm khi người dùng nhập (3 giây)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Lưu trạng thái focus trước khi gọi API
            const wasSearchFocused = document.activeElement === searchInputRef.current

            if (searchTerm.trim() !== '') {
                setCurrentPage(1)
                // Gọi fetchUsers với parameters hiện tại
                fetchUsersWithParams(1, searchTerm.trim(), roleFilter, statusFilter, sortBy, sortDirection)
            } else if (searchTerm === '') {
                // Nếu search term rỗng, load lại tất cả users
                setCurrentPage(1)
                fetchUsersWithParams(1, '', roleFilter, statusFilter, sortBy, sortDirection)
            }

            // Restore focus sau khi API call hoàn thành
            if (wasSearchFocused) {
                setTimeout(() => {
                    searchInputRef.current?.focus()
                }, 100)
            }
        }, 1000) // 1000ms (1giây)

        return () => clearTimeout(timeoutId)
    }, [searchTerm]) // Chỉ depend vào searchTerm để tránh infinite loop

    const handleUpdateRole = async () => {
        if (!selectedUser || !selectedUser.role) return

        try {
            await api.patch(`/api/users/${selectedUser._id}/role`, { role: selectedUser.role })

            // Cập nhật local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === selectedUser._id ? { ...user, role: selectedUser.role } : user
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
            setSelectedUsers(users.map(user => user._id))
        }
    }

    const toggleDropdown = (userId: string) => {
        setDropdownOpen(dropdownOpen === userId ? null : userId)
    }

    const handleRoleChange = (userId: string, newRole: string) => {
        console.log(`Thay đổi role của người dùng ${userId} thành ${newRole}`)
        setUsers(prev => prev.map(user =>
            user._id === userId ? { ...user, role: newRole } : user
        ))
        setDropdownOpen(null)
    }

    const handleToggleActive = (userId: string) => {
        console.log(`Thay đổi trạng thái active của người dùng ${userId}`)
        setUsers(prev => prev.map(user =>
            user._id === userId ? { ...user, active: !user.active } : user
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

        // Kiểm tra số lượng admin hiện tại
        const currentAdminCount = users.filter(user => user.role === 'admin').length
        if (currentAdminCount >= 3) {
            toast.error('Đã đạt giới hạn tối đa số lượng admin (3)')
            return
        }

        try {
            setProcessingUser(userId)
            await userService.promoteToAdmin(userId)
            toast.success('Đã thăng cấp người dùng thành Admin')
            await fetchUsers() // Refresh data
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
            await fetchUsers() // Refresh data
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

            await fetchUsers() // Refresh data
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

        // Validation
        if (!newUserData.email || !newUserData.firstName || !newUserData.lastName || !newUserData.password) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        // Kiểm tra số lượng admin nếu tạo admin
        if (newUserData.role === 'admin') {
            const currentAdminCount = users.filter(user => user.role === 'admin').length
            if (currentAdminCount >= 3) {
                toast.error('Đã đạt giới hạn tối đa số lượng admin (3)')
                return
            }
        }

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
            await fetchUsers() // Refresh data
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
            const headers = ['Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Xác thực email', 'Ngày tạo']
            const data = users.map(user => [
                `${user.firstName} ${user.lastName}`,
                user.email,
                user.role,
                user.active ? 'Hoạt động' : 'Vô hiệu hóa',
                user.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực',
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
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={loading || users.length === 0}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Xuất CSV
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowCreateUserModal(true)}
                        disabled={loading}
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
                                {loading ? (
                                    'Đang tải...'
                                ) : (
                                    <>
                                        {`Tổng cộng ${totalUsers} người dùng`}
                                        {(searchTerm || roleFilter || statusFilter) && (
                                            <span className="text-blue-600 dark:text-blue-400">
                                                {' '}(đã lọc
                                                {searchTerm && ` theo "${searchTerm}"`}
                                                {roleFilter && ` vai trò: ${roleFilter}`}
                                                {statusFilter && ` trạng thái: ${statusFilter === 'active' ? 'hoạt động' : 'vô hiệu hóa'}`}
                                                )
                                            </span>
                                        )}
                                    </>
                                )}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                        <form onSubmit={handleSearch} className="flex flex-1 max-w-sm items-center space-x-2">
                            <div className="relative flex-1">
                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={t('admin.users.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-8"
                                    disabled={loading}
                                    data-search-input="true"
                                />
                                {/* Clear icon - chỉ hiển thị khi có text với smooth animation */}
                                <div className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-200 ${searchTerm ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                                    }`}>
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handleClearSearch()
                                            }
                                        }}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                        aria-label="Xóa tìm kiếm"
                                        tabIndex={searchTerm ? 0 : -1}
                                    >
                                        <X className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" size="icon" disabled={loading}>
                                <Search className="h-4 w-4" />
                                <span className="sr-only">{t('common.search')}</span>
                            </Button>
                        </form>

                        <div className="flex flex-col md:flex-row gap-2">
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    const newRole = e.target.value
                                    setRoleFilter(newRole)
                                    setCurrentPage(1)
                                    fetchUsersWithParams(1, searchTerm, newRole, statusFilter, sortBy, sortDirection)
                                }}
                                className="h-10 w-full md:w-40 rounded-md border border-input bg-background px-3 py-2"
                                disabled={loading}
                            >
                                <option value="">Tất cả vai trò</option>
                                <option value="user">Người dùng</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">SuperAdmin</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    const newStatus = e.target.value
                                    setStatusFilter(newStatus)
                                    setCurrentPage(1)
                                    fetchUsersWithParams(1, searchTerm, roleFilter, newStatus, sortBy, sortDirection)
                                }}
                                className="h-10 w-full md:w-40 rounded-md border border-input bg-background px-3 py-2"
                                disabled={loading}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Vô hiệu hóa</option>
                            </select>

                            {/* Reset filters button - chỉ cho role và status filters */}
                            {(roleFilter || statusFilter) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setRoleFilter('')
                                        setStatusFilter('')
                                        setCurrentPage(1)
                                        fetchUsersWithParams(1, searchTerm, '', '', sortBy, sortDirection)
                                    }}
                                    disabled={loading}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Xóa bộ lọc
                                </Button>
                            )}
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
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Xác thực email</TableHead>
                                    <TableHead>{t('admin.users.created')}</TableHead>
                                    <TableHead>{t('admin.users.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    // Loading skeleton
                                    [...Array(5)].map((_, index) => (
                                        <TableRow key={index}>
                                            {[...Array(7)].map((_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center space-y-2">
                                                <UserIcon className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-muted-foreground">
                                                    {searchTerm || roleFilter || statusFilter
                                                        ? 'Không tìm thấy người dùng phù hợp với bộ lọc'
                                                        : 'Chưa có người dùng nào'
                                                    }
                                                </p>
                                                {(searchTerm || roleFilter || statusFilter) && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSearchTerm('')
                                                            setRoleFilter('')
                                                            setStatusFilter('')
                                                            setCurrentPage(1)
                                                            fetchUsersWithParams(1, '', '', '', sortBy, sortDirection)
                                                            // Focus lại vào search input
                                                            setTimeout(() => {
                                                                searchInputRef.current?.focus()
                                                            }, 0)
                                                        }}
                                                    >
                                                        Xóa tất cả bộ lọc
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user._id}>
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
                                                {user.active ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Hoạt động
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                        Vô hiệu hóa
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {user.isEmailVerified ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        Đã xác thực
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                        Chưa xác thực
                                                    </Badge>
                                                )}
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

                                                        {/* Chỉ SuperAdmin mới có quyền thăng/hạ cấp */}
                                                        {isSuperAdmin && user.role !== 'superadmin' && (
                                                            <>
                                                                {user.role === 'user' && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handlePromoteUser(user._id)}
                                                                        disabled={processingUser === user._id}
                                                                    >
                                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                                        {processingUser === user._id ? 'Đang xử lý...' : 'Nâng cấp lên Admin'}
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {user.role === 'admin' && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDemoteAdmin(user._id)}
                                                                        disabled={processingUser === user._id}
                                                                    >
                                                                        <UserMinus className="mr-2 h-4 w-4" />
                                                                        {processingUser === user._id ? 'Đang xử lý...' : 'Hạ cấp xuống User'}
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Kích hoạt/Vô hiệu hóa tài khoản - không áp dụng cho SuperAdmin */}
                                                        {user.role !== 'superadmin' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleUserStatus(user._id, user.active)}
                                                                disabled={processingUser === user._id}
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
                    {(users.length > 0 || totalPages > 1) && (
                        <div className="flex items-center justify-between py-4">
                            <div className="text-sm text-muted-foreground">
                                {loading ? (
                                    'Đang tải...'
                                ) : (
                                    `Hiển thị ${((currentPage - 1) * 10) + 1}-${Math.min(currentPage * 10, totalUsers)} trong tổng số ${totalUsers} người dùng`
                                )}
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
                                <div className="text-right font-medium">Xác thực email:</div>
                                <div className="col-span-3">
                                    {selectedUser.isEmailVerified ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            Đã xác thực
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            Chưa xác thực
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">Trạng thái tài khoản:</div>
                                <div className="col-span-3">
                                    {selectedUser.active ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            Hoạt động
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            Vô hiệu hóa
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.users.created')}:</div>
                                <div className="col-span-3">
                                    {formatDate(selectedUser.createdAt)}
                                </div>
                            </div>
                            {selectedUser.lastLogin && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div className="text-right font-medium">{t('admin.users.lastLogin')}:</div>
                                    <div className="col-span-3">
                                        {formatDate(selectedUser.lastLogin)}
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
                                    onChange={(e) => handleRoleChange(selectedUser?._id || '', e.target.value)}
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
                                        placeholder="example@email.com"
                                        disabled={loading}
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
                                        placeholder="Nguyễn Văn"
                                        disabled={loading}
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
                                        placeholder="An"
                                        disabled={loading}
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
                                        placeholder="Tối thiểu 6 ký tự"
                                        minLength={6}
                                        disabled={loading}
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
                                        disabled={loading}
                                    >
                                        <option value="user">Người dùng</option>
                                        {isSuperAdmin && <option value="admin">Admin</option>}
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