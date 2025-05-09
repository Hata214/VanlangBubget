'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { Alert } from '@/components/ui/Alert'
import { fetchEmailPreferences, updateEmailPreferences } from '@/redux/features/emailSlice'
import { Loading } from '@/components/ui/Loading'

interface EmailPreferences {
    verificationEmails: boolean
    paymentReminders: boolean
    monthlyReports: boolean
    budgetAlerts: boolean
}

export function EmailSettings() {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const { preferences, isLoading, error } = useAppSelector((state) => state.email)

    useEffect(() => {
        dispatch(fetchEmailPreferences())
    }, [dispatch])

    const handleToggle = async (key: keyof EmailPreferences) => {
        if (!preferences) return

        const updatedPreferences = {
            ...preferences,
            [key]: !preferences[key],
        }

        await dispatch(updateEmailPreferences(updatedPreferences))
    }

    if (isLoading && !preferences) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loading />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('notifications.emailSettings.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <Alert variant="error" message={error} />
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium">{t('notifications.emailSettings.verificationEmails.title')}</h4>
                            <p className="text-sm text-gray-500">
                                {t('notifications.emailSettings.verificationEmails.description')}
                            </p>
                        </div>
                        <Switch
                            checked={preferences?.verificationEmails}
                            onCheckedChange={() => handleToggle('verificationEmails')}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium">{t('notifications.emailSettings.paymentReminders.title')}</h4>
                            <p className="text-sm text-gray-500">
                                {t('notifications.emailSettings.paymentReminders.description')}
                            </p>
                        </div>
                        <Switch
                            checked={preferences?.paymentReminders}
                            onCheckedChange={() => handleToggle('paymentReminders')}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium">{t('notifications.emailSettings.monthlyReports.title')}</h4>
                            <p className="text-sm text-gray-500">
                                {t('notifications.emailSettings.monthlyReports.description')}
                            </p>
                        </div>
                        <Switch
                            checked={preferences?.monthlyReports}
                            onCheckedChange={() => handleToggle('monthlyReports')}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium">{t('notifications.emailSettings.budgetAlerts.title')}</h4>
                            <p className="text-sm text-gray-500">
                                {t('notifications.emailSettings.budgetAlerts.description')}
                            </p>
                        </div>
                        <Switch
                            checked={preferences?.budgetAlerts}
                            onCheckedChange={() => handleToggle('budgetAlerts')}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 