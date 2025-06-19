'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/services/api'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import {
    Bell,
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Send,
    Eye,
    Trash2,
    AlertTriangle,
    Loader2,
    RefreshCw,
    XCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'

interface Notification {
    _id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'success' | 'error'
    sentTo: 'all' | 'user' | 'admin' | string[]
    isRead: boolean
    createdAt: string
    sentCount?: number
}

interface NewNotification {
    title: string
    message: string
    type: 'info' | 'warning' | 'success' | 'error'
    sendToAll: boolean
    sendToAdmins: boolean
    specificUsers: string
}

export default function AdminNotificationsPage() {
    const t = useTranslations('admin.notifications')
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
    const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false)
    const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)
    const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
    const [newNotification, setNewNotification] = useState<NewNotification>({
        title: '',
        message: '',
        type: 'info',
        sendToAll: true,  // Default to sending to all users
        sendToAdmins: false,
        specificUsers: ''
    })
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        fetchNotifications()
    }, [currentPage, searchTerm])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const response = await api.get('/api/admin/notifications', {
                params: {
                    page: currentPage,
                    limit: 10,
                    search: searchTerm
                }
            })

            // Dữ liệu mẫu cho môi trường dev
            const mockData = {
                notifications: Array.from({ length: 10 }, (_, i) => ({
                    _id: `notif_${i + 1}`,
                    title: `Thông báo quan trọng ${i + 1}`,
                    message: `Đây là nội dung thông báo ${i + 1} được tạo để thử nghiệm.`,
                    type: ['info', 'warning', 'success', 'error'][Math.floor(Math.random() * 4)] as 'info' | 'warning' | 'success' | 'error',
                    sentTo: ['all', 'user', 'admin'][Math.floor(Math.random() * 3)] as 'all' | 'user' | 'admin',
                    isRead: Math.random() > 0.5,
                    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                    sentCount: Math.floor(Math.random() * 100)
                })),
                totalPages: 5
            }

            setNotifications(response?.data?.notifications || mockData.notifications)
            setTotalPages(response?.data?.totalPages || mockData.totalPages)
        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error)

            // Dữ liệu mẫu nếu API gặp lỗi
            const mockData = {
                notifications: Array.from({ length: 10 }, (_, i) => ({
                    _id: `notif_${i + 1}`,
                    title: `Thông báo quan trọng ${i + 1}`,
                    message: `Đây là nội dung thông báo ${i + 1} được tạo để thử nghiệm.`,
                    type: ['info', 'warning', 'success', 'error'][Math.floor(Math.random() * 4)] as 'info' | 'warning' | 'success' | 'error',
                    sentTo: ['all', 'user', 'admin'][Math.floor(Math.random() * 3)] as 'all' | 'user' | 'admin',
                    isRead: Math.random() > 0.5,
                    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                    sentCount: Math.floor(Math.random() * 100)
                })),
                totalPages: 5
            }

            setNotifications(mockData.notifications)
            setTotalPages(mockData.totalPages)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)  // Reset về trang đầu tiên khi tìm kiếm
    }

    const handleViewNotification = (notification: Notification) => {
        setSelectedNotification(notification)
    }

    const handleDeleteNotification = (notificationId: string) => {
        setNotificationToDelete(notificationId)
        setShowDeleteDialog(true)
    }

    const confirmDeleteNotification = async () => {
        if (!notificationToDelete) return

        try {
            setProcessing(true)
            setError(null)

            // Gọi API xóa thông báo
            await api.delete(`/api/admin/notifications/${notificationToDelete}`)

            // Cập nhật UI và auto-refresh
            setNotifications(prev => prev.filter(n => n._id !== notificationToDelete))
            setSelectedNotifications(prev => prev.filter(id => id !== notificationToDelete))
            setSuccess(t('deleteSuccess'))

            // Auto-refresh danh sách sau khi xóa
            setTimeout(() => {
                fetchNotifications()
            }, 1000)

            // Xóa thông báo thành công sau 3 giây
            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (error: any) {
            console.error('Lỗi khi xóa thông báo:', error)

            // Xử lý các loại lỗi khác nhau
            if (error?.response?.status === 404) {
                setError('Thông báo không tồn tại hoặc đã bị xóa')
                // Refresh danh sách để cập nhật UI
                fetchNotifications()
            } else if (error?.response?.status === 403) {
                setError('Bạn không có quyền xóa thông báo này')
            } else if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
                setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet')
            } else {
                setError(error?.response?.data?.message || t('deleteError'))
            }

            setTimeout(() => setError(null), 5000)
        } finally {
            setProcessing(false)
            setShowDeleteDialog(false)
            setNotificationToDelete(null)
        }
    }

    const handleDeleteAllNotifications = () => {
        setShowDeleteAllDialog(true)
    }

    const confirmDeleteAllNotifications = async () => {
        try {
            setProcessing(true)
            setError(null)

            // Gọi API xóa tất cả thông báo
            await api.delete('/api/admin/notifications/all')

            // Cập nhật UI
            setNotifications([])
            setSelectedNotifications([])
            setSuccess('Đã xóa tất cả thông báo thành công')

            // Auto-refresh danh sách sau khi xóa
            setTimeout(() => {
                fetchNotifications()
            }, 1000)

            // Xóa thông báo thành công sau 3 giây
            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (error) {
            console.error('Lỗi khi xóa tất cả thông báo:', error)
            setError('Lỗi khi xóa tất cả thông báo')
            setTimeout(() => setError(null), 5000)
        } finally {
            setProcessing(false)
            setShowDeleteAllDialog(false)
        }
    }

    const handleSelectNotification = (notificationId: string) => {
        setSelectedNotifications(prev => {
            if (prev.includes(notificationId)) {
                return prev.filter(id => id !== notificationId)
            } else {
                return [...prev, notificationId]
            }
        })
    }

    const handleSelectAll = () => {
        if (selectedNotifications.length === notifications.length) {
            setSelectedNotifications([])
        } else {
            setSelectedNotifications(notifications.map(n => n._id))
        }
    }

    const handleDeleteSelected = () => {
        if (selectedNotifications.length === 0) {
            setError('Vui lòng chọn ít nhất một thông báo để xóa')
            setTimeout(() => setError(null), 3000)
            return
        }

        // Kiểm tra xem các thông báo đã chọn có còn tồn tại không
        const validNotifications = selectedNotifications.filter(id =>
            notifications.some(n => n._id === id)
        )

        if (validNotifications.length !== selectedNotifications.length) {
            setSelectedNotifications(validNotifications)
            if (validNotifications.length === 0) {
                setError('Vui lòng chọn ít nhất một thông báo để xóa')
                setTimeout(() => setError(null), 3000)
                return
            }
        }

        setShowDeleteSelectedDialog(true)
    }

    const confirmDeleteSelected = async () => {
        try {
            setProcessing(true)
            setError(null)
            const deleteCount = selectedNotifications.length

            // Gọi API xóa nhiều thông báo
            await api.delete('/api/admin/notifications/bulk', {
                data: { notificationIds: selectedNotifications }
            })

            // Cập nhật UI
            setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n._id)))
            setSelectedNotifications([])
            setSuccess(`Đã xóa ${deleteCount} thông báo thành công`)

            // Auto-refresh danh sách sau khi xóa
            setTimeout(() => {
                fetchNotifications()
            }, 1000)

            // Xóa thông báo thành công sau 3 giây
            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (error: any) {
            console.error('Lỗi khi xóa thông báo đã chọn:', error)

            // Xử lý các loại lỗi khác nhau
            if (error?.response?.status === 404) {
                setError('Một số thông báo không tồn tại hoặc đã bị xóa')
                // Refresh danh sách để cập nhật UI
                fetchNotifications()
            } else if (error?.response?.status === 403) {
                setError('Bạn không có quyền xóa thông báo')
            } else if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
                setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet')
            } else {
                setError(error?.response?.data?.message || 'Lỗi khi xóa thông báo đã chọn')
            }

            setTimeout(() => setError(null), 5000)
        } finally {
            setProcessing(false)
            setShowDeleteSelectedDialog(false)
        }
    }

    const handleCreateNotification = async () => {
        try {
            setProcessing(true)
            setError(null)

            // Validation
            if (!newNotification.title.trim()) {
                setError(t('titleRequired'))
                setProcessing(false)
                return
            }

            if (!newNotification.message.trim()) {
                setError(t('messageRequired'))
                setProcessing(false)
                return
            }

            // Kiểm tra người nhận
            if (!newNotification.sendToAll && !newNotification.sendToAdmins && !newNotification.specificUsers.trim()) {
                setError(t('recipientRequired'))
                setProcessing(false)
                return
            }

            // Chuẩn bị dữ liệu
            let recipients: 'all' | 'admin' | string[] = 'all';

            if (newNotification.sendToAll) {
                recipients = 'all'
            } else if (newNotification.sendToAdmins) {
                recipients = 'admin'
            } else {
                // Parse danh sách email
                recipients = newNotification.specificUsers
                    .split(',')
                    .map(email => email.trim())
                    .filter(email => email)
            }

            await api.post('/api/admin/notifications', {
                title: newNotification.title,
                message: newNotification.message,
                type: newNotification.type,
                sentTo: recipients
            })

            // Reset form
            setNewNotification({
                title: '',
                message: '',
                type: 'info',
                sendToAll: true,  // Default to sending to all users
                sendToAdmins: false,
                specificUsers: ''
            })

            setShowCreateDialog(false)
            setSuccess(t('createSuccess'))
            fetchNotifications()  // Refresh danh sách

            // Xóa thông báo thành công sau 3 giây
            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (error) {
            console.error('Lỗi khi tạo thông báo:', error)
            setError(t('createError'))
        } finally {
            setProcessing(false)
        }
    }

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case 'warning':
                return 'warning'
            case 'success':
                return 'success'
            case 'error':
                return 'destructive'
            default:
                return 'default'
        }
    }

    const getSentToDisplay = (sentTo: 'all' | 'user' | 'admin' | string[]) => {
        if (sentTo === 'all') return t('allUsers')
        if (sentTo === 'admin') return t('adminUsers')
        if (sentTo === 'user') return t('regularUsers')
        if (Array.isArray(sentTo)) return `${sentTo.length} người dùng cụ thể`
        return String(sentTo)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('description')}
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Lỗi</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    <Bell className="h-4 w-4" />
                    <AlertTitle>Thành công</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                    <Input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 sm:w-80"
                    />
                    <Button type="submit" size="icon">
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Tìm kiếm</span>
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={fetchNotifications}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="sr-only">{t('refreshList')}</span>
                    </Button>
                </form>

                <div className="flex flex-wrap gap-2">
                    {selectedNotifications.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleDeleteSelected}
                            className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                            size="sm"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Xóa đã chọn</span>
                            <span className="sm:hidden">{t('delete')}</span>
                            ({selectedNotifications.length})
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleDeleteAllNotifications}
                        className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                        size="sm"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Xóa tất cả</span>
                        <span className="sm:hidden">{t('delete')}</span>
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{t('createNew')}</span>
                        <span className="sm:hidden">Tạo</span>
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Chọn tất cả"
                                        />
                                    </TableHead>
                                    <TableHead>Tiêu đề</TableHead>
                                    <TableHead className="hidden sm:table-cell">{t('type')}</TableHead>
                                    <TableHead className="hidden md:table-cell">Gửi đến</TableHead>
                                    <TableHead className="hidden lg:table-cell">Số người nhận</TableHead>
                                    <TableHead className="hidden sm:table-cell">{t('created')}</TableHead>
                                    <TableHead>{t('actions')}</TableHead>
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
                                ) : notifications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            {t('noNotificationsFound')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    notifications.map((notification) => (
                                        <TableRow key={notification._id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedNotifications.includes(notification._id)}
                                                    onCheckedChange={() => handleSelectNotification(notification._id)}
                                                    aria-label={`Select ${notification.title}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{notification.title}</div>
                                                <div className="text-sm text-muted-foreground sm:hidden">
                                                    <Badge variant={getTypeBadgeVariant(notification.type)} className="mr-2">
                                                        {notification.type}
                                                    </Badge>
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant={getTypeBadgeVariant(notification.type)}>
                                                    {notification.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {getSentToDisplay(notification.sentTo)}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                {notification.sentCount ?? '-'}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewNotification(notification)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">Xem</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                                                        onClick={() => handleDeleteNotification(notification._id)}
                                                        disabled={processing}
                                                    >
                                                        {processing && notificationToDelete === notification._id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                        <span className="sr-only">Xóa</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 p-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage <= 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Trước</span>
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
                            <span className="sr-only">Sau</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog xác nhận xóa thông báo */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('confirmDelete')}</DialogTitle>
                        <DialogDescription>
                            {t('deleteWarning')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={processing}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteNotification}
                            disabled={processing}
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog xác nhận xóa tất cả thông báo */}
            <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa tất cả</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa tất cả thông báo? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDeleteAllDialog(false)}
                            disabled={processing}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteAllNotifications}
                            disabled={processing}
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Xóa tất cả
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog xác nhận xóa thông báo đã chọn */}
            <Dialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa đã chọn</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa {selectedNotifications.length} thông báo đã chọn? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDeleteSelectedDialog(false)}
                            disabled={processing}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteSelected}
                            disabled={processing}
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Xóa đã chọn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog xem chi tiết thông báo */}
            {selectedNotification && (
                <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{selectedNotification.title}</DialogTitle>
                            <DialogDescription>
                                {new Date(selectedNotification.createdAt).toLocaleString()}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('type')}:</div>
                                <div className="col-span-3">
                                    <Badge variant={getTypeBadgeVariant(selectedNotification.type)}>
                                        {selectedNotification.type}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">Gửi đến:</div>
                                <div className="col-span-3">
                                    {getSentToDisplay(selectedNotification.sentTo)}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">Số người nhận:</div>
                                <div className="col-span-3">
                                    {selectedNotification.sentCount ?? '-'}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <div className="text-right font-medium">{t('message')}:</div>
                                <div className="col-span-3 whitespace-pre-wrap">
                                    {selectedNotification.message}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex justify-between">
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setSelectedNotification(null);
                                    handleDeleteNotification(selectedNotification._id);
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                            </Button>
                            <Button variant="secondary" onClick={() => setSelectedNotification(null)}>
                                Đóng
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Dialog tạo thông báo mới */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('createTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('createDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t('notificationTitle')}</Label>
                            <Input
                                id="title"
                                value={newNotification.title}
                                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">{t('notificationMessage')}</Label>
                            <Textarea
                                id="message"
                                rows={4}
                                value={newNotification.message}
                                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">{t('notificationType')}</Label>
                            <Select
                                value={newNotification.type}
                                onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder={t('selectType')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">{t('typeInfo')}</SelectItem>
                                    <SelectItem value="warning">{t('typeWarning')}</SelectItem>
                                    <SelectItem value="success">{t('typeSuccess')}</SelectItem>
                                    <SelectItem value="error">{t('typeError')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label>{t('recipients')}</Label>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="sendToAll"
                                        checked={newNotification.sendToAll}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setNewNotification({
                                                    ...newNotification,
                                                    sendToAll: true,
                                                    sendToAdmins: false
                                                })
                                            } else {
                                                setNewNotification({
                                                    ...newNotification,
                                                    sendToAll: false
                                                })
                                            }
                                        }}
                                    />
                                    <Label htmlFor="sendToAll">{t('sendToAll')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="sendToAdmins"
                                        checked={newNotification.sendToAdmins}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setNewNotification({
                                                    ...newNotification,
                                                    sendToAll: false,
                                                    sendToAdmins: true
                                                })
                                            } else {
                                                setNewNotification({
                                                    ...newNotification,
                                                    sendToAdmins: false
                                                })
                                            }
                                        }}
                                    />
                                    <Label htmlFor="sendToAdmins">{t('sendToAdmins')}</Label>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="specificUsers"
                                            checked={!newNotification.sendToAll && !newNotification.sendToAdmins}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setNewNotification({
                                                        ...newNotification,
                                                        sendToAll: false,
                                                        sendToAdmins: false
                                                    })
                                                }
                                            }}
                                        />
                                        <Label htmlFor="specificUsers">{t('specificUsers')}</Label>
                                    </div>
                                    {!newNotification.sendToAll && !newNotification.sendToAdmins && (
                                        <div>
                                            <Textarea
                                                placeholder={t('specificUsersDescription')}
                                                value={newNotification.specificUsers}
                                                onChange={(e) => setNewNotification({ ...newNotification, specificUsers: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setShowCreateDialog(false)}
                            disabled={processing}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCreateNotification}
                            disabled={processing}
                        >
                            {processing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            {t('sendNotification')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 