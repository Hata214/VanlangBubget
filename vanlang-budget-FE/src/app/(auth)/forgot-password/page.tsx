'use client'

import { useState } from 'react'
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

interface ForgotPasswordFormData {
    email: string
}

export default function ForgotPasswordPage() {
    const t = useTranslations();
    const dispatch = useAppDispatch()
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const form = useForm<ForgotPasswordFormData>({
        defaultValues: {
            email: '',
        },
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            dispatch(setLoading(true))
            setShowError(false)
            setShowSuccess(false)
            await authService.forgotPassword(data.email)
            setShowSuccess(true)
            form.reset()
        } catch (error: any) {
            console.error('Forgot password error:', error)
            setErrorMessage(error.response?.data?.message || 'Gửi yêu cầu thất bại')
            setShowError(true)
        } finally {
            dispatch(setLoading(false))
        }
    }

    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle>{t('auth.forgotPassword')}</CardTitle>
                    <CardDescription>
                        Nhập email của bạn để nhận liên kết đặt lại mật khẩu
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BackToHome />
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {showSuccess && (
                                <Alert variant="success">
                                    Liên kết đặt lại mật khẩu đã được gửi đến email của bạn
                                </Alert>
                            )}

                            {showError && (
                                <Alert variant="destructive">
                                    {errorMessage}
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...form.register('email', {
                                        required: 'Email là bắt buộc',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Email không hợp lệ',
                                        },
                                    })}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.formState.isSubmitting}
                            >
                                Gửi yêu cầu
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