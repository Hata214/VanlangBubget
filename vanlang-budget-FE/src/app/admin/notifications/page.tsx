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
    AlertTriangle
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { format } from 'date-fns'
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
    const t = useTranslations()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
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

    const handleCreateNotification = async () => {
        try {
            setProcessing(true)
            setError(null)

            // Validation
            if (!newNotification.title.trim()) {
                setError(t('admin.notifications.titleRequired'))
                setProcessing(false)
                return
            }

            if (!newNotification.message.trim()) {
                setError(t('admin.notifications.messageRequired'))
                setProcessing(false)
                return
            }

            // Kiểm tra người nhận
            if (!newNotification.sendToAll && !newNotification.sendToAdmins && !newNotification.specificUsers.trim()) {
                setError(t('admin.notifications.recipientRequired'))
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
            setSuccess(t('admin.notifications.createSuccess'))
            fetchNotifications()  // Refresh danh sách

            // Xóa thông báo thành công sau 3 giây
            setTimeout(() => {
                setSuccess(null)
            }, 3000)
        } catch (error) {
            console.error('Lỗi khi tạo thông báo:', error)
            setError(t('admin.notifications.createError'))
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
        if (sentTo === 'all') return t('admin.notifications.allUsers')
        if (sentTo === 'admin') return t('admin.notifications.adminUsers')
        if (sentTo === 'user') return t('admin.notifications.regularUsers')
        if (Array.isArray(sentTo)) return `${sentTo.length} ${t('admin.notifications.specificUsers')}`
        return String(sentTo)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.notifications.title')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('admin.notifications.description')}
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('common.error')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert variant="default" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <Bell className="h-4 w-4" />
                    <AlertTitle>{t('common.success')}</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            <div className="flex justify-between items-center">
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                    <Input
                        type="text"
                        placeholder={t('admin.notifications.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                    />
                    <Button type="submit" size="icon">
                        <Search className="h-4 w-4" />
                        <span className="sr-only">{t('common.search')}</span>
                    </Button>
                </form>

                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.notifications.createNew')}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('admin.notifications.title')}</TableHead>
                                    <TableHead>{t('admin.notifications.type')}</TableHead>
                                    <TableHead>{t('admin.notifications.sentTo')}</TableHead>
                                    <TableHead>{t('admin.notifications.sentCount')}</TableHead>
                                    <TableHead>{t('admin.notifications.created')}</TableHead>
                                    <TableHead>{t('admin.notifications.actions')}</TableHead>
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
                                ) : notifications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            {t('admin.notifications.noNotificationsFound')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    notifications.map((notification) => (
                                        <TableRow key={notification._id}>
                                            <TableCell>
                                                <div className="font-medium">{notification.title}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getTypeBadgeVariant(notification.type)}>
                                                    {notification.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {getSentToDisplay(notification.sentTo)}
                                            </TableCell>
                                            <TableCell>
                                                {notification.sentCount ?? '-'}
                                            </TableCell>
                                            <TableCell>
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
                                                        <span className="sr-only">{t('common.view')}</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">{t('common.delete')}</span>
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
                            <span className="sr-only">{t('common.previous')}</span>
                        </Button>
                        <div>
                            {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage >= totalPages || loading}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">{t('common.next')}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
                                <div className="text-right font-medium">{t('admin.notifications.type')}:</div>
                                <div className="col-span-3">
                                    <Badge variant={getTypeBadgeVariant(selectedNotification.type)}>
                                        {selectedNotification.type}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.notifications.sentTo')}:</div>
                                <div className="col-span-3">
                                    {getSentToDisplay(selectedNotification.sentTo)}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <div className="text-right font-medium">{t('admin.notifications.sentCount')}:</div>
                                <div className="col-span-3">
                                    {selectedNotification.sentCount ?? '-'}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <div className="text-right font-medium">{t('admin.notifications.message')}:</div>
                                <div className="col-span-3 whitespace-pre-wrap">
                                    {selectedNotification.message}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setSelectedNotification(null)}>
                                {t('common.close')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Dialog tạo thông báo mới */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('admin.notifications.createTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.notifications.createDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{t('admin.notifications.notificationTitle')}</Label>
                            <Input
                                id="title"
                                value={newNotification.title}
                                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">{t('admin.notifications.notificationMessage')}</Label>
                            <Textarea
                                id="message"
                                rows={4}
                                value={newNotification.message}
                                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">{t('admin.notifications.notificationType')}</Label>
                            <Select
                                value={newNotification.type}
                                onValueChange={(value) => setNewNotification({
                                    ...newNotification,
                                    type: value as 'info' | 'warning' | 'success' | 'error'
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.notifications.selectType')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="warning">Warning</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>{t('admin.notifications.recipients')}</Label>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sendToAll"
                                    checked={newNotification.sendToAll}
                                    onCheckedChange={(checked) => {
                                        setNewNotification({
                                            ...newNotification,
                                            sendToAll: checked as boolean,
                                            sendToAdmins: false,
                                            specificUsers: ''
                                        })
                                    }}
                                />
                                <Label
                                    htmlFor="sendToAll"
                                    className="text-sm font-normal leading-none cursor-pointer"
                                >
                                    {t('admin.notifications.sendToAll')}
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sendToAdmins"
                                    checked={newNotification.sendToAdmins}
                                    onCheckedChange={(checked) => {
                                        setNewNotification({
                                            ...newNotification,
                                            sendToAdmins: checked as boolean,
                                            sendToAll: false,
                                            specificUsers: ''
                                        })
                                    }}
                                />
                                <Label
                                    htmlFor="sendToAdmins"
                                    className="text-sm font-normal leading-none cursor-pointer"
                                >
                                    {t('admin.notifications.sendToAdmins')}
                                </Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specificUsers">{t('admin.notifications.specificUsers')}</Label>
                                <Textarea
                                    id="specificUsers"
                                    placeholder={t('admin.notifications.emailsPlaceholder')}
                                    rows={2}
                                    value={newNotification.specificUsers}
                                    onChange={(e) => {
                                        setNewNotification({
                                            ...newNotification,
                                            specificUsers: e.target.value,
                                            sendToAll: false,
                                            sendToAdmins: false
                                        })
                                    }}
                                    disabled={newNotification.sendToAll || newNotification.sendToAdmins}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="secondary"
                            onClick={() => setShowCreateDialog(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleCreateNotification}
                            disabled={processing}
                            className="gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {processing ? t('common.processing') : t('admin.notifications.send')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 