'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { useAppDispatch } from '@/redux/hooks'
import { setLoading } from '@/redux/features/authSlice'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Form } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Label } from '@/components/ui/Label'
import { BackToHome } from '@/components/auth/BackToHome'

interface ResetPasswordFormData {
    password: string
    confirmPassword: string
}

export default function ResetPasswordPage() {
    const t = useTranslations();
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams ? searchParams.get('token') : null;
    const dispatch = useAppDispatch()
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const form = useForm<ResetPasswordFormData>({
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setErrorMessage('Token không hợp lệ')
            setShowError(true)
            return
        }

        if (data.password !== data.confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp')
            setShowError(true)
            return
        }

        try {
            dispatch(setLoading(true))
            setShowError(false)
            await authService.resetPassword(token, data.password)
            setShowSuccess(true)
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (error: any) {
            console.error('Reset password error:', error)
            setErrorMessage(error.response?.data?.message || 'Đặt lại mật khẩu thất bại')
            setShowError(true)
        } finally {
            dispatch(setLoading(false))
        }
    }

    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle>{t('auth.resetPassword')}</CardTitle>
                    <CardDescription>
                        Nhập mật khẩu mới cho tài khoản của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BackToHome />
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {showSuccess && (
                                <Alert variant="success">
                                    Đặt lại mật khẩu thành công! Bạn sẽ được chuyển hướng đến trang đăng nhập.
                                </Alert>
                            )}

                            {showError && (
                                <Alert variant="destructive">
                                    {errorMessage}
                                </Alert>
                            )}

                            {!token && (
                                <Alert variant="destructive">
                                    Token không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.
                                </Alert>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('auth.password')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...form.register('password', {
                                            required: 'Mật khẩu là bắt buộc',
                                            minLength: {
                                                value: 6,
                                                message: 'Mật khẩu phải có ít nhất 6 ký tự',
                                            },
                                        })}
                                    />
                                    {form.formState.errors.password && (
                                        <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        {...form.register('confirmPassword', {
                                            required: 'Xác nhận mật khẩu là bắt buộc',
                                            validate: (value: string) =>
                                                value === form.watch('password') ||
                                                'Mật khẩu xác nhận không khớp',
                                        })}
                                    />
                                    {form.formState.errors.confirmPassword && (
                                        <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.formState.isSubmitting || !token}
                            >
                                Đặt lại mật khẩu
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link
                        href="/login"
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                        {t('auth.login')}
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
} 