'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { useAppDispatch } from '@/redux/hooks'
import { setCredentials, setLoading, setError } from '@/redux/features/authSlice'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Form } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Label } from '@/components/ui/Label'
import { setIncomes, setTotalIncome } from '@/redux/features/incomeSlice'
import { setExpenses, setTotalExpense } from '@/redux/features/expenseSlice'
import { setLoans, setTotalLoan } from '@/redux/features/loanSlice'
import { Income, Expense, Loan } from '@/types'
import { BackToHome } from '@/components/auth/BackToHome'
import Cookies from 'js-cookie'

interface LoginFormData {
    email: string
    password: string
}

export default function LoginPage() {
    const t = useTranslations();
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams?.get('redirect') || '/dashboard'
    const dispatch = useAppDispatch()
    const [showError, setShowError] = useState(false)

    const form = useForm<LoginFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (data: LoginFormData) => {
        try {
            dispatch(setLoading(true))
            setShowError(false)

            console.log('Logging in with:', data.email);

            // Thêm timeout để tránh request quá nhanh
            const response = await authService.login(data.email, data.password)

            console.log('Login successful, response:', response);

            if (response && response.token) {
                // Đảm bảo response có cấu trúc phù hợp với AuthResponse
                const authData = {
                    user: {
                        _id: (response.user as any)._id || (response.user as any).id || '',
                        email: response.user.email,
                        firstName: (response.user as any).firstName || '',
                        lastName: (response.user as any).lastName || '',
                        role: (response.user as any).role || 'user',
                        isEmailVerified: (response.user as any).isEmailVerified || false
                    },
                    token: typeof response.token === 'string'
                        ? { accessToken: response.token, refreshToken: '' }
                        : response.token
                }

                // Token đã được lưu trong authService.login
                console.log('Login successful, redirecting to:', redirectUrl);

                dispatch(setCredentials(authData))
                router.push(redirectUrl)
            } else {
                console.error('Login response missing token or user data');
                dispatch(setError('Phản hồi từ máy chủ không đúng định dạng'))
                setShowError(true)
            }
        } catch (error: any) {
            console.error('Login error (detailed):', error)

            let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại sau.'

            if (error.response) {
                // Nếu server trả về lỗi cụ thể
                errorMessage = error.response.data?.message || errorMessage
            } else if (error.request) {
                // Nếu không nhận được phản hồi từ server
                errorMessage = 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.'
            } else if (error.message) {
                // Lỗi từ việc thiết lập request
                errorMessage = error.message
            }

            dispatch(setError(errorMessage))
            setShowError(true)
        } finally {
            dispatch(setLoading(false))
        }
    }

    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle>{t('auth.login')}</CardTitle>
                    <CardDescription>
                        {t('app.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BackToHome />
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {showError && (
                                <Alert variant="destructive">
                                    {t('auth.loginError')}
                                </Alert>
                            )}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('auth.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        {...form.register('email', { required: true })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">{t('auth.password')}</Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                                        >
                                            {t('auth.forgotPassword')}
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...form.register('password', { required: true })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button type="submit" className="w-full">
                                    {t('auth.login')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                        {t('auth.dontHaveAccount')}{' '}
                        <Link
                            href="/register"
                            className="font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                            {t('auth.register')}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
} 