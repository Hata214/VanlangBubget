'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAppDispatch } from '@/redux/hooks'
import { setLoading } from '@/redux/features/authSlice'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { BackToHome } from '@/components/auth/BackToHome'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
    const t = useTranslations();
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams ? searchParams.get('token') : null;
    const email = searchParams ? searchParams.get('email') : null;
    const dispatch = useAppDispatch()
    const [verified, setVerified] = useState(false)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLocalLoading] = useState(true)

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setError(true)
                setErrorMessage(t('auth.emailVerificationInvalid'))
                setLocalLoading(false)
                return
            }

            try {
                dispatch(setLoading(true))
                await authService.verifyEmail(token)
                setVerified(true)
            } catch (err: any) {
                console.error('Email verification error:', err)
                setError(true)
                setErrorMessage(err.response?.data?.message || t('auth.emailVerificationError'))
            } finally {
                dispatch(setLoading(false))
                setLocalLoading(false)
            }
        }

        verifyEmail()
    }, [token, dispatch, t])

    const handleResendVerification = async () => {
        if (!email) return;

        try {
            dispatch(setLoading(true))
            await authService.resendVerificationEmail(email);
            // Hiển thị thông báo thành công
            setErrorMessage('');
            setError(false);
            alert(t('auth.emailVerificationSent'));
        } catch (error: any) {
            console.error('Resend verification error:', error);
            setErrorMessage(error.response?.data?.message || t('auth.emailVerificationError'));
            setError(true);
        } finally {
            dispatch(setLoading(false))
        }
    }

    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {loading && <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />}
                        {!loading && verified && <CheckCircle className="h-16 w-16 text-green-500" />}
                        {!loading && error && <XCircle className="h-16 w-16 text-red-500" />}
                    </div>
                    <CardTitle>{t('auth.emailVerification')}</CardTitle>
                    <CardDescription>
                        {loading
                            ? t('auth.emailVerificationPending')
                            : verified
                                ? t('auth.emailVerificationSuccess')
                                : t('auth.emailVerificationError')
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BackToHome />

                    {loading && (
                        <div className="py-6 text-center flex flex-col items-center">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-500">{t('auth.emailVerificationPending')}</p>
                        </div>
                    )}

                    {!loading && verified && (
                        <div className="bg-green-50 p-4 rounded-md my-6 flex items-start space-x-3">
                            <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-green-800">{t('auth.emailVerificationSuccess')}</h3>
                                <p className="text-sm text-green-600 mt-1">
                                    {email ? `Email ${email} đã được xác thực thành công.` : t('auth.continueToLogin')}
                                </p>
                            </div>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="space-y-4 my-6">
                            <div className="bg-red-50 p-4 rounded-md flex items-start space-x-3">
                                <XCircle className="h-6 w-6 text-red-500 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-red-800">{t('auth.emailVerificationError')}</h3>
                                    <p className="text-sm text-red-600 mt-1">
                                        {errorMessage}
                                    </p>
                                </div>
                            </div>

                            {email && (
                                <div className="flex justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={handleResendVerification}
                                        className="mt-2"
                                    >
                                        <Mail className="h-4 w-4 mr-2" />
                                        {t('auth.resendEmailVerification')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && (
                        <div className="mt-6">
                            <Button
                                className="w-full"
                                onClick={() => router.push('/login')}
                            >
                                {t('auth.continueToLogin')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 