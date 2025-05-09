'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { updateProfile, changePassword } from '@/redux/features/authSlice'
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

    const form = useForm<ProfileFormData>({
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phoneNumber: user?.phoneNumber || '',
        },
    })

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
                            <h1 className="text-3xl font-bold">{t('userProfile.title')}</h1>
                            <p className="mt-2 text-gray-500">
                                {t('userProfile.subtitle')}
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('userProfile.basicInfo')}</CardTitle>
                            <CardDescription>
                                {t('userProfile.basicInfoDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                                <FormLabel>{t('userProfile.lastName')}</FormLabel>
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
                                                <FormLabel>{t('userProfile.firstName')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <FormLabel>{t('userProfile.email')}</FormLabel>
                                        <Input
                                            value={user?.email || ''}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-sm text-gray-500">
                                            {t('userProfile.emailDesc')}
                                        </p>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('userProfile.phoneNumber')}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="tel" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        isLoading={isLoading}
                                    >
                                        {t('userProfile.saveChanges')}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('passwordSettings.title')}</CardTitle>
                            <CardDescription>
                                {t('passwordSettings.subtitle')}
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
                                                <FormLabel>{t('passwordSettings.currentPassword')}</FormLabel>
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
                                                <FormLabel>{t('passwordSettings.newPassword')}</FormLabel>
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
                                                <FormLabel>{t('passwordSettings.confirmPassword')}</FormLabel>
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
                                    >
                                        {t('common.save')}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
} 