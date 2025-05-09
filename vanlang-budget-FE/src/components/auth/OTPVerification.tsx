import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAppDispatch } from '@/redux/hooks'
import { setCredentials, setLoading, setError as setReduxError } from '@/redux/features/authSlice'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Label } from '@/components/ui/Label'
import { Loader2 } from 'lucide-react'

interface OTPVerificationProps {
    email: string
    onBack: () => void
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onBack }) => {
    const t = useTranslations()
    const locale = useLocale() as string
    const router = useRouter()
    const dispatch = useAppDispatch()

    const [otp, setOtp] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [countdown, setCountdown] = useState(60)
    const [isResending, setIsResending] = useState(false)

    // Đếm ngược thời gian để có thể gửi lại OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!otp) {
            setError(t('error.otpRequired'))
            return
        }

        try {
            setIsSubmitting(true)
            setError('')
            dispatch(setLoading(true))

            // Chuyển đổi mã OTP thành chuỗi
            const otpString = String(otp)

            // Bước 1: Xác thực OTP
            try {
                const verifyResponse = await authService.verifyOTP({
                    email,
                    otp: otpString
                })

                // Chỉ tiếp tục nếu yêu cầu xác thực OTP thành công
                if (verifyResponse && verifyResponse.token) {
                    // Bước 2: Lấy thông tin user đầy đủ
                    const currentUserResponse = await authService.getCurrentUser();

                    // Bước 3: Lưu thông tin người dùng và token
                    dispatch(setCredentials({
                        user: currentUserResponse.user,
                        token: verifyResponse.token
                    }));

                    // Chuyển hướng dựa trên role
                    if (currentUserResponse.user && ['admin', 'superadmin'].includes(currentUserResponse.user.role)) {
                        router.push('/admin');
                    } else {
                        router.push('/dashboard');
                    }
                } else {
                    throw new Error('Không nhận được token xác thực');
                }
            } catch (apiError: any) {
                console.error('OTP verification error:', apiError);
                setError(apiError.response?.data?.message || t('error.otpVerificationFailed'))
                dispatch(setReduxError(apiError.response?.data?.message || t('error.otpVerificationFailed')))
                throw apiError // Re-throw để xử lý trong khối catch bên ngoài
            }
        } catch (err: any) {
            // Lỗi đã được xử lý trong khối try bên trong
            console.error('OTP verification process failed:', err)
        } finally {
            setIsSubmitting(false)
            dispatch(setLoading(false))
        }
    }

    const handleResendOTP = async () => {
        if (countdown > 0) return

        try {
            setIsResending(true)
            setError('')
            // Truyền cả locale khi gửi lại OTP
            await authService.resendOTP(email, locale)
            setCountdown(60) // Reset đếm ngược
        } catch (err: any) {
            console.error('Resend OTP error:', err)
            setError(err.response?.data?.message || t('error.resendOtpFailed'))
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mt-1">
                    {t('auth.otpSent')} <span className="font-medium">{email}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    ({t('auth.checkSpamNote')})
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    {error}
                </Alert>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="otp">{t('auth.otpCode')}</Label>
                    <Input
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        disabled={isSubmitting}
                        className="text-center text-lg tracking-widest"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('auth.verifying')}
                        </>
                    ) : (
                        t('auth.verifyAccount')
                    )}
                </Button>
            </form>

            <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">
                    {t('auth.didntReceiveCode')}
                </p>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isResending}
                    className="text-primary hover:text-primary-dark"
                >
                    {isResending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : countdown > 0 ? (
                        `${t('auth.resendCodeIn')} ${countdown}s`
                    ) : (
                        t('auth.resendCode')
                    )}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="mt-4 w-full"
                >
                    {t('common.back')}
                </Button>
            </div>
        </div>
    )
}

export default OTPVerification
