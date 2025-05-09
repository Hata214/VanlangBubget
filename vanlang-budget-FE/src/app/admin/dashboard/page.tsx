'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/Card'
import {
    UsersIcon,
    DollarSignIcon,
    CalendarIcon,
    BarChart3Icon,
    Activity
} from 'lucide-react'
import api from '@/services/api'

interface StatData {
    userCount: number
    transactionCount: number
    activeUserCount: number
    todayTransactions: number
}

export default function AdminDashboardPage() {
    const t = useTranslations()
    const [stats, setStats] = useState<StatData>({
        userCount: 0,
        transactionCount: 0,
        activeUserCount: 0,
        todayTransactions: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                const response = await api.get('/api/admin/stats')
                setStats(response.data)
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu thống kê:', error)
            } finally {
                setLoading(false)
            }
        }

        // Giả lập dữ liệu trong môi trường dev
        const loadMockData = () => {
            setStats({
                userCount: 1250,
                transactionCount: 18743,
                activeUserCount: 843,
                todayTransactions: 124
            })
            setLoading(false)
        }

        // Kiểm tra xem API có khả dụng không
        fetchStats().catch(() => {
            loadMockData()
        })
    }, [])

    const stats_cards = [
        {
            title: t('admin.stats.totalUsers'),
            value: stats.userCount.toLocaleString(),
            description: t('admin.stats.registeredUsers'),
            icon: UsersIcon,
            color: 'bg-blue-500'
        },
        {
            title: t('admin.stats.totalTransactions'),
            value: stats.transactionCount.toLocaleString(),
            description: t('admin.stats.allTimeTransactions'),
            icon: DollarSignIcon,
            color: 'bg-green-500'
        },
        {
            title: t('admin.stats.activeUsers'),
            value: stats.activeUserCount.toLocaleString(),
            description: t('admin.stats.last30Days'),
            icon: Activity,
            color: 'bg-yellow-500'
        },
        {
            title: t('admin.stats.todayTransactions'),
            value: stats.todayTransactions.toLocaleString(),
            description: t('admin.stats.today'),
            icon: CalendarIcon,
            color: 'bg-purple-500'
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('admin.dashboardDescription')}
                </p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {stats_cards.map((card, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${card.color}`}>
                                <card.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? (
                                    <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                                ) : (
                                    card.value
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('admin.recentUsers')}</CardTitle>
                        <CardDescription>
                            {t('admin.recentUsersDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                                            <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    {t('admin.connectBackendForData')}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('admin.recentTransactions')}</CardTitle>
                        <CardDescription>
                            {t('admin.recentTransactionsDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-4">
                                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                                            <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                                        </div>
                                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    {t('admin.connectBackendForData')}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 