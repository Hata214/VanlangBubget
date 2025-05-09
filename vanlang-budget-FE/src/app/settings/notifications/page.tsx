'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
    fetchNotificationSettings,
    updateNotificationSettings
} from '@/redux/features/notificationSlice'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import { Separator } from '@/components/ui/Separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import {
    AlertCircle,
    Bell,
    CheckCircle2,
    Mail,
    MessageSquare
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import MainLayout from '@/components/layout/MainLayout'
import { useToast } from '@/contexts/ToastContext'
import type { EmailFrequency } from '@/types'

export default function NotificationSettingsPage() {
    const t = useTranslations()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { success, error: showError } = useToast()

    const { notificationSettings, isLoading } = useAppSelector(
        (state) => state.notification
    )
    const { user } = useAppSelector((state) => state.auth)

    const [emailVerified, setEmailVerified] = useState(false)
    const [settings, setSettings] = useState({
        emailNotifications: false,
        pushNotifications: true,
        emailFrequency: 'daily' as EmailFrequency,
        notificationTypes: {
            expense: true,
            income: true,
            budget: true,
            system: true,
        },
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Lấy cài đặt thông báo khi component mount
    useEffect(() => {
        dispatch(fetchNotificationSettings())
    }, [dispatch])

    // Cập nhật state khi có dữ liệu từ API
    useEffect(() => {
        if (notificationSettings) {
            setSettings({
                emailNotifications: notificationSettings.emailNotifications,
                pushNotifications: notificationSettings.pushNotifications,
                emailFrequency: notificationSettings.emailFrequency,
                notificationTypes: {
                    ...notificationSettings.notificationTypes,
                },
            })
        }
    }, [notificationSettings])

    // Kiểm tra xem email đã được xác minh chưa
    useEffect(() => {
        if (user) {
            setEmailVerified(user.isEmailVerified || false)
        }
    }, [user])

    // Xử lý khi thay đổi cài đặt
    const handleEmailNotificationsChange = (checked: boolean) => {
        setSettings(prev => ({
            ...prev,
            emailNotifications: checked,
        }))
    }

    const handlePushNotificationsChange = (checked: boolean) => {
        setSettings(prev => ({
            ...prev,
            pushNotifications: checked,
        }))
    }

    const handleEmailFrequencyChange = (value: string) => {
        setSettings(prev => ({
            ...prev,
            emailFrequency: value as EmailFrequency,
        }))
    }

    const handleNotificationTypeChange = (type: string, checked: boolean) => {
        setSettings(prev => ({
            ...prev,
            notificationTypes: {
                ...prev.notificationTypes,
                [type]: checked,
            },
        }))
    }

    // Xử lý khi lưu cài đặt
    const handleSaveSettings = async () => {
        try {
            setIsSubmitting(true)

            // Log settings trước khi gửi
            console.log('Sending notification settings:', settings)

            // Đảm bảo gửi đúng định dạng dữ liệu
            const notificationSettings = {
                emailNotifications: settings.emailNotifications,
                pushNotifications: settings.pushNotifications,
                emailFrequency: settings.emailFrequency,
                notificationTypes: {
                    expense: settings.notificationTypes.expense,
                    income: settings.notificationTypes.income,
                    budget: settings.notificationTypes.budget,
                    system: settings.notificationTypes.system
                }
            }

            // Gọi action updateNotificationSettings
            const result = await dispatch(updateNotificationSettings(notificationSettings)).unwrap()
            console.log('Settings update response:', result)

            success(t('common.success'), t('settings.notifications.saveSuccess'))

            // Cập nhật lại settings từ server
            dispatch(fetchNotificationSettings())
        } catch (error) {
            console.error('Error saving notification settings:', error)
            showError(t('common.error'), t('settings.notifications.saveError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    // Xử lý khi xác minh email
    const handleVerifyEmail = () => {
        router.push('/profile?verifyEmail=true')
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">
                        {t('notifications.settings')}
                    </h1>
                    <Button onClick={handleSaveSettings} isLoading={isSubmitting}>
                        {t('notifications.saveSettings')}
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Email Notifications Card */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <Mail className="w-5 h-5 mr-2 text-blue-500" />
                                <h2 className="text-lg font-semibold">
                                    {t('notifications.emailNotifications')}
                                </h2>
                            </div>
                            <Switch
                                checked={settings.emailNotifications}
                                onCheckedChange={handleEmailNotificationsChange}
                                disabled={!emailVerified}
                            />
                        </div>

                        {!emailVerified && (
                            <Alert variant="warning" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>
                                    {t('notifications.emailVerificationRequired')}
                                </AlertTitle>
                                <AlertDescription>
                                    <p className="mb-2">
                                        {t('auth.emailVerificationRequired')}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleVerifyEmail}
                                    >
                                        {t('notifications.verifyEmail')}
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        {emailVerified && settings.emailNotifications && (
                            <div className="space-y-4">
                                <div>
                                    <Label className="mb-2 block">
                                        {t('notifications.emailFrequency')}
                                    </Label>
                                    <Select
                                        value={settings.emailFrequency}
                                        onValueChange={handleEmailFrequencyChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="immediately">
                                                {t('notifications.emailFrequencyOptions.immediately')}
                                            </SelectItem>
                                            <SelectItem value="daily">
                                                {t('notifications.emailFrequencyOptions.daily')}
                                            </SelectItem>
                                            <SelectItem value="weekly">
                                                {t('notifications.emailFrequencyOptions.weekly')}
                                            </SelectItem>
                                            <SelectItem value="never">
                                                {t('notifications.emailFrequencyOptions.never')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Push Notifications Card */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <Bell className="w-5 h-5 mr-2 text-purple-500" />
                                <h2 className="text-lg font-semibold">
                                    {t('notifications.pushNotifications')}
                                </h2>
                            </div>
                            <Switch
                                checked={settings.pushNotifications}
                                onCheckedChange={handlePushNotificationsChange}
                            />
                        </div>

                        {settings.pushNotifications && (
                            <div className="mt-2">
                                <Alert variant="info" className="mb-4">
                                    <MessageSquare className="h-4 w-4" />
                                    <AlertDescription>
                                        {t('notifications.pushSettings', { defaultMessage: 'Thông báo đẩy sẽ xuất hiện trong ứng dụng khi bạn trực tuyến. Chúng không yêu cầu bất kỳ quyền bổ sung nào.' })}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </Card>

                    {/* Notification Types Card */}
                    <Card className="p-6 md:col-span-2">
                        <div className="flex items-center mb-4">
                            <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                            <h2 className="text-lg font-semibold">
                                {t('notifications.title')}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="expense-notifications"
                                    checked={settings.notificationTypes.expense}
                                    onCheckedChange={(checked) =>
                                        handleNotificationTypeChange('expense', checked as boolean)
                                    }
                                />
                                <Label htmlFor="expense-notifications">
                                    {t('notifications.types.expense')}
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="income-notifications"
                                    checked={settings.notificationTypes.income}
                                    onCheckedChange={(checked) =>
                                        handleNotificationTypeChange('income', checked as boolean)
                                    }
                                />
                                <Label htmlFor="income-notifications">
                                    {t('notifications.types.income')}
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="budget-notifications"
                                    checked={settings.notificationTypes.budget}
                                    onCheckedChange={(checked) =>
                                        handleNotificationTypeChange('budget', checked as boolean)
                                    }
                                />
                                <Label htmlFor="budget-notifications">
                                    {t('notifications.types.budget')}
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="system-notifications"
                                    checked={settings.notificationTypes.system}
                                    onCheckedChange={(checked) =>
                                        handleNotificationTypeChange('system', checked as boolean)
                                    }
                                />
                                <Label htmlFor="system-notifications">
                                    {t('notifications.types.system')}
                                </Label>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
} 