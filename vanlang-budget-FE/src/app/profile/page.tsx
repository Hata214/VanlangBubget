'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { updateProfile, changePassword, fetchUserProfile } from '@/redux/features/authSlice'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/Form'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import MainLayout from '@/components/layout/MainLayout'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AuthDebug from '@/components/debug/AuthDebug'
import ApiTest from '@/components/debug/ApiTest'
import FormDebug from '@/components/debug/FormDebug'
import ProfileDebug from '@/components/debug/ProfileDebug'
import TokenSync from '@/components/debug/TokenSync'
import { useAuthToken } from '@/hooks/useAuthToken'

interface ProfileFormData {
    firstName: string
    lastName: string
    phoneNumber: string
}

interface PasswordFormData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export default function ProfilePage() {
    const t = useTranslations();
    const dispatch = useAppDispatch()
    const { user, isLoading, error } = useAppSelector((state) => state.auth)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showPasswordSuccess, setShowPasswordSuccess] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const { hasToken } = useAuthToken()

    const form = useForm<ProfileFormData>({
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phoneNumber: user?.phoneNumber || '',
        },
    })

    // Load user profile when component mounts and token is available
    useEffect(() => {
        console.log('Profile page mounted, checking token and user state...')
        console.log('Current user state:', user)
        console.log('Has token:', hasToken)

        if (hasToken) {
            console.log('Token available, fetching user profile...')
            dispatch(fetchUserProfile())
        } else {
            console.log('No token available, skipping profile fetch')
        }
    }, [dispatch, hasToken])

    // Update form when user data changes
    useEffect(() => {
        console.log('User data changed:', user)
        if (user) {
            console.log('Updating form with user data:', {
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber
            })
            form.reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
            })
        }
    }, [user, form])

    // Debug loading and error states
    useEffect(() => {
        console.log('Auth state changed:', { isLoading, error, user: !!user })
    }, [isLoading, error, user])

    const passwordForm = useForm<PasswordFormData>({
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (data: ProfileFormData) => {
        try {
            await dispatch(updateProfile(data)).unwrap()
            setShowSuccess(true)
        } catch (error) {
            console.error('Update profile error:', error)
        }
    }

    const onPasswordSubmit = async (data: PasswordFormData) => {
        setPasswordError(null)

        if (data.newPassword !== data.confirmPassword) {
            setPasswordError(t('passwordSettings.passwordsDoNotMatch', { defaultMessage: 'Mật khẩu mới không khớp' }))
            return
        }

        try {
            await dispatch(changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            })).unwrap()

            setShowPasswordSuccess(true)
            passwordForm.reset({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        } catch (error) {
            console.error('Change password error:', error)
            setPasswordError(t('passwordSettings.changeError', { defaultMessage: 'Không thể đổi mật khẩu. Mật khẩu hiện tại có thể không đúng.' }))
        }
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto py-6">
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <Link href="/settings">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">{t('userProfile.title', { defaultMessage: 'Thông tin tài khoản' })}</h1>
                            <p className="mt-2 text-gray-500">
                                {t('userProfile.subtitle', { defaultMessage: 'Quản lý thông tin cá nhân và mật khẩu tài khoản của bạn' })}
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('userProfile.basicInfo', { defaultMessage: 'Thông tin cơ bản' })}</CardTitle>
                            <CardDescription>
                                {t('userProfile.basicInfoDesc', { defaultMessage: 'Cập nhật thông tin cá nhân của bạn' })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading && (
                                <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="ml-2">{t('common.loading', { defaultMessage: 'Đang tải thông tin...' })}</span>
                                </div>
                            )}

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {showSuccess && (
                                        <Alert
                                            variant="success"
                                            message={t('userProfile.updateSuccess', { defaultMessage: 'Cập nhật thông tin thành công' })}
                                            onClose={() => setShowSuccess(false)}
                                        />
                                    )}

                                    {error && (
                                        <Alert
                                            variant="error"
                                            message={error}
                                        />
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('userProfile.firstName', { defaultMessage: 'Họ' })}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('userProfile.lastName', { defaultMessage: 'Tên' })}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <FormLabel>{t('userProfile.email', { defaultMessage: 'Email' })}</FormLabel>
                                        <Input
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-gray-50 dark:bg-gray-800"
                                        />
                                        <p className="text-sm text-gray-500">
                                            {t('userProfile.emailDesc', { defaultMessage: 'Email không thể thay đổi' })}
                                        </p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('userProfile.phoneNumber', { defaultMessage: 'Số điện thoại' })}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="tel"
                                                        placeholder={t('userProfile.phoneNumberPlaceholder', { defaultMessage: 'Nhập số điện thoại (10-11 số)' })}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        rules={{
                                            pattern: {
                                                value: /^[0-9]{10,11}$/,
                                                message: t('userProfile.phoneNumberError', { defaultMessage: 'Số điện thoại phải có 10-11 số' })
                                            }
                                        }}
                                    />

                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        disabled={isLoading}
                                    >
                                        {t('userProfile.saveChanges', { defaultMessage: 'Lưu thay đổi' })}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('passwordSettings.title', { defaultMessage: 'Đổi mật khẩu' })}</CardTitle>
                            <CardDescription>
                                {t('passwordSettings.subtitle', { defaultMessage: 'Cập nhật mật khẩu để bảo vệ tài khoản của bạn' })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                                    {showPasswordSuccess && (
                                        <Alert
                                            variant="success"
                                            message={t('passwordSettings.changeSuccess', { defaultMessage: 'Thay đổi mật khẩu thành công' })}
                                            onClose={() => setShowPasswordSuccess(false)}
                                        />
                                    )}

                                    {passwordError && (
                                        <Alert
                                            variant="error"
                                            message={passwordError}
                                            onClose={() => setPasswordError(null)}
                                        />
                                    )}

                                    <FormField
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('passwordSettings.currentPassword', { defaultMessage: 'Mật khẩu hiện tại' })}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        rules={{
                                            required: t('passwordSettings.currentPasswordRequired', { defaultMessage: 'Mật khẩu hiện tại là bắt buộc' }),
                                        }}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('passwordSettings.newPassword', { defaultMessage: 'Mật khẩu mới' })}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        rules={{
                                            required: t('passwordSettings.newPasswordRequired', { defaultMessage: 'Mật khẩu mới là bắt buộc' }),
                                            minLength: {
                                                value: 8,
                                                message: t('passwordSettings.passwordMinLength', { defaultMessage: 'Mật khẩu phải có ít nhất 8 ký tự' }),
                                            },
                                        }}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('passwordSettings.confirmPassword', { defaultMessage: 'Xác nhận mật khẩu mới' })}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        rules={{
                                            required: t('passwordSettings.confirmPasswordRequired', { defaultMessage: 'Xác nhận mật khẩu là bắt buộc' }),
                                        }}
                                    />

                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                        disabled={isLoading}
                                    >
                                        {t('passwordSettings.updatePassword', { defaultMessage: 'Cập nhật mật khẩu' })}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Debug Components - Chỉ hiển thị trong development */}
            {process.env.NODE_ENV === 'development' && (
                <>
                    <TokenSync />
                    <AuthDebug />
                    <ApiTest />
                    <FormDebug form={form} title="Profile Form" />
                    <ProfileDebug />
                </>
            )}
        </MainLayout>
    )
}