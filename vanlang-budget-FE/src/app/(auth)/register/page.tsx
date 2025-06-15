'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useTranslations, useLocale } from 'next-intl'
import { useAppDispatch } from '@/redux/hooks'
import { setCredentials, setLoading, setError } from '@/redux/features/authSlice'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Form } from '@/components/ui/Form'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Label } from '@/components/ui/Label'
import { BackToHome } from '@/components/auth/BackToHome'
import { Mail, CheckCircle } from 'lucide-react'
import OTPVerification from '@/components/auth/OTPVerification'
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator'

interface RegisterFormData {
    name: string
    email: string
    password: string
    confirmPassword: string
    locale?: string;
}

export default function RegisterPage() {
    const t = useTranslations();
    const locale = useLocale() as string;
    const router = useRouter()
    const dispatch = useAppDispatch()
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [showOTPVerification, setShowOTPVerification] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')

    const form = useForm<RegisterFormData>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (data: RegisterFormData) => {
        if (data.password !== data.confirmPassword) {
            setErrorMessage(t('error.passwordsDoNotMatch'))
            setShowError(true)
            return
        }

        try {
            dispatch(setLoading(true))
            setShowError(false)
            const response = await authService.register({
                name: data.name,
                email: data.email,
                password: data.password,
                locale: locale
            })

            // Lưu email để sử dụng cho OTP
            setRegisteredEmail(data.email)

            // Hiện màn hình nhập OTP thay vì chuyển thẳng đến dashboard
            setShowOTPVerification(true)

            // Không đặt thông tin vào redux store ngay lập tức
            // Redux store sẽ được cập nhật sau khi xác thực OTP thành công
        } catch (error: any) {
            console.error('Register error:', error)

            // Xử lý lỗi validation từ backend
            if (error.response?.data?.errors) {
                const backendErrors = error.response.data.errors;

                // Set lỗi cho từng field
                Object.keys(backendErrors).forEach(field => {
                    form.setError(field as keyof RegisterFormData, {
                        type: 'server',
                        message: backendErrors[field]
                    });
                });

                setErrorMessage('Vui lòng kiểm tra và sửa các lỗi bên dưới')
            } else {
                setErrorMessage(error.response?.data?.message || t('error.registrationFailed'))
            }

            setShowError(true)
            dispatch(setError(error.response?.data?.message || t('error.registrationFailed')))
        } finally {
            dispatch(setLoading(false))
        }
    }

    const handleResendVerification = async () => {
        if (!registeredEmail) return;

        try {
            dispatch(setLoading(true))
            await authService.resendVerificationEmail(registeredEmail, locale);
            // Hiển thị thông báo thành công
            setErrorMessage('');
            setShowError(false);
        } catch (error: any) {
            console.error('Resend verification error:', error);
            setErrorMessage(error.response?.data?.message || t('error.resendVerificationFailed'));
            setShowError(true);
        } finally {
            dispatch(setLoading(false))
        }
    }

    // Nếu đang hiển thị màn hình xác thực OTP
    if (showOTPVerification) {
        return (
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="w-full">
                    <CardHeader className="text-center">
                        <CardTitle>{t('auth.verifyAccount')}</CardTitle>
                        <CardDescription>
                            {t('auth.otpVerificationNeeded')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OTPVerification
                            email={registeredEmail}
                            onBack={() => setShowOTPVerification(false)}
                        />
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Màn hình đăng ký bình thường
    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle>{t('auth.register')}</CardTitle>
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
                                    {errorMessage}
                                </Alert>
                            )}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('auth.fullName')}</Label>
                                    <Input
                                        id="name"
                                        {...form.register('name', {
                                            required: 'Họ và tên là bắt buộc',
                                            minLength: {
                                                value: 2,
                                                message: 'Họ và tên phải có ít nhất 2 ký tự',
                                            },
                                            maxLength: {
                                                value: 100,
                                                message: 'Họ và tên không được vượt quá 100 ký tự',
                                            },
                                            pattern: {
                                                value: /^[a-zA-ZÀ-ỹ\s]+$/,
                                                message: 'Họ và tên chỉ được chứa chữ cái và khoảng trắng',
                                            },
                                        })}
                                        className={form.formState.errors.name ? 'border-red-500' : ''}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <span className="text-red-500">⚠</span>
                                            {form.formState.errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('auth.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...form.register('email', {
                                            required: 'Email là bắt buộc',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Email không đúng định dạng. Ví dụ: example@gmail.com',
                                            },
                                            maxLength: {
                                                value: 255,
                                                message: 'Email không được vượt quá 255 ký tự',
                                            },
                                        })}
                                        className={form.formState.errors.email ? 'border-red-500' : ''}
                                        placeholder="example@gmail.com"
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <span className="text-red-500">⚠</span>
                                            {form.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">{t('auth.password')}</Label>
                                    <PasswordInput
                                        id="password"
                                        {...form.register('password', {
                                            required: 'Mật khẩu là bắt buộc',
                                            minLength: {
                                                value: 8,
                                                message: 'Mật khẩu phải có ít nhất 8 ký tự',
                                            },
                                            maxLength: {
                                                value: 128,
                                                message: 'Mật khẩu không được vượt quá 128 ký tự',
                                            },
                                            validate: {
                                                hasLowerCase: (value) =>
                                                    /[a-z]/.test(value) || 'Mật khẩu phải có ít nhất 1 chữ thường (a-z)',
                                                hasUpperCase: (value) =>
                                                    /[A-Z]/.test(value) || 'Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)',
                                                hasNumber: (value) =>
                                                    /[0-9]/.test(value) || 'Mật khẩu phải có ít nhất 1 số (0-9)',
                                                hasSpecialChar: (value) =>
                                                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(value) || 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*)',
                                            },
                                        })}
                                        className={form.formState.errors.password ? 'border-red-500' : ''}
                                        placeholder="Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt"
                                    />
                                    {form.formState.errors.password && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <span className="text-red-500">⚠</span>
                                                {form.formState.errors.password.message}
                                            </p>
                                        </div>
                                    )}
                                    {/* Password strength indicator */}
                                    <PasswordStrengthIndicator password={form.watch('password') || ''} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        {...form.register('confirmPassword', {
                                            required: 'Xác nhận mật khẩu là bắt buộc',
                                            validate: (value: string) =>
                                                value === form.watch('password') ||
                                                'Mật khẩu xác nhận không khớp với mật khẩu đã nhập',
                                        })}
                                        className={form.formState.errors.confirmPassword ? 'border-red-500' : ''}
                                        placeholder="Nhập lại mật khẩu để xác nhận"
                                    />
                                    {form.formState.errors.confirmPassword && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <span className="text-red-500">⚠</span>
                                            {form.formState.errors.confirmPassword.message}
                                        </p>
                                    )}
                                    {/* Password match indicator */}
                                    {form.watch('confirmPassword') && (
                                        <div className={`text-xs flex items-center gap-1 ${form.watch('confirmPassword') === form.watch('password')
                                            ? 'text-green-600'
                                            : 'text-red-500'
                                            }`}>
                                            <span>
                                                {form.watch('confirmPassword') === form.watch('password') ? '✓' : '✗'}
                                            </span>
                                            {form.watch('confirmPassword') === form.watch('password')
                                                ? 'Mật khẩu khớp'
                                                : 'Mật khẩu không khớp'
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full">
                                {t('auth.register')}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm">
                        {t('auth.alreadyHaveAccount')} <Link href="/login" className="text-primary hover:underline">{t('auth.login')}</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
} 