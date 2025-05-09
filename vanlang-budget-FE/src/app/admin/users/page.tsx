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
    Eye
} from 'lucide-react'
import { format } from 'date-fns'

interface User {
    _id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isEmailVerified: boolean
    createdAt: string
    lastLogin?: string
}

export default function AdminUsersPage() {
    const t = useTranslations()
    const { user: currentUser } = useAppSelector((state) => state.auth)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showRoleDialog, setShowRoleDialog] = useState(false)
    const [newRole, setNewRole] = useState<string>('')
    const [processing, setProcessing] = useState(false)

    const isSuperAdmin = currentUser?.role === 'superadmin'

    useEffect(() => {
        fetchUsers()
    }, [currentPage, searchTerm])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await api.get('/api/users', {
                params: {
                    page: currentPage,
                    limit: 10,
                    search: searchTerm
                }
            })

            // Dữ liệu mẫu cho môi trường dev
            const mockData = {
                users: Array.from({ length: 10 }, (_, i) => ({
                    _id: `user_${i + 1}`,
                    email: `user${i + 1}@example.com`,
                    firstName: `Người dùng`,
                    lastName: `${i + 1}`,
                    role: i === 0 ? 'superadmin' : i < 3 ? 'admin' : 'user',
                    isEmailVerified: Math.random() > 0.3,
                    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                    lastLogin: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 1000000000).toISOString() : undefined
                })),
                totalPages: 5
            }

            setUsers(response?.data?.users || mockData.users)
            setTotalPages(response?.data?.totalPages || mockData.totalPages)
        } catch (error) {
            console.error('Lỗi khi tải danh sách người dùng:', error)

            // Dữ liệu mẫu nếu API gặp lỗi
            const mockData = {
                users: Array.from({ length: 10 }, (_, i) => ({
                    _id: `user_${i + 1}`,
                    email: `user${i + 1}@example.com`,
                    firstName: `Người dùng`,
                    lastName: `${i + 1}`,
                    role: i === 0 ? 'superadmin' : i < 3 ? 'admin' : 'user',
                    isEmailVerified: Math.random() > 0.3,
                    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                    lastLogin: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 1000000000).toISOString() : undefined
                })),
                totalPages: 5
            }

            setUsers(mockData.users)
            setTotalPages(mockData.totalPages)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)  // Reset về trang đầu tiên khi tìm kiếm
    }

    const handleUpdateRole = async () => {
        if (!selectedUser || !newRole) return

        try {
            setProcessing(true)
            await api.patch(`/api/users/${selectedUser._id}/role`, { role: newRole })

            // Cập nhật local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === selectedUser._id ? { ...user, role: newRole } : user
                )
            )

            setShowRoleDialog(false)
            setSelectedUser(null)
            setNewRole('')
        } catch (error) {
            console.error('Lỗi khi cập nhật vai trò:', error)
            alert(t('admin.users.roleUpdateError'))
        } finally {
            setProcessing(false)
        }
    }

    const handleViewDetails = (user: User) => {
        setSelectedUser(user)
    }

    const handleOpenRoleDialog = (user: User) => {
        setSelectedUser(user)
        setNewRole(user.role)
        setShowRoleDialog(true)
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
                                                {user.isEmailVerified ? t('common.yes') : t('common.no')}
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
                                                                disabled={user.role === 'superadmin' && user._id === currentUser?._id}
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
            {selectedUser && (
                <Dialog open={!!selectedUser && !showRoleDialog} onOpenChange={(open) => !open && setSelectedUser(null)}>
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
                                    {selectedUser.isEmailVerified ? t('common.yes') : t('common.no')}
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
            <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
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
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
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
                                setShowRoleDialog(false)
                                setSelectedUser(null)
                            }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleUpdateRole}
                            disabled={!newRole || newRole === selectedUser?.role || processing}
                        >
                            {processing ? t('common.processing') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 