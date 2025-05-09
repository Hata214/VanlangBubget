'use client'

import { useState, useEffect } from 'react'
import { DateRange } from 'react-day-picker'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { fetchTrends, fetchAnalytics } from '@/redux/features/reportSlice'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { ReportList } from '@/components/reports/ReportList'
import { TrendAnalysis } from '@/components/reports/TrendAnalysis'
import { reportService } from '@/services/reportService'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
    const dispatch = useAppDispatch()
    const { trends, analytics, isLoading, error } = useAppSelector((state) => state.report)
    const [selectedMonths, setSelectedMonths] = useState(12)

    useEffect(() => {
        dispatch(fetchTrends(selectedMonths))
    }, [dispatch, selectedMonths])

    const handleExport = async (dateRange: DateRange) => {
        if (!dateRange.from || !dateRange.to) return

        try {
            await reportService.exportReport(
                format(dateRange.from, 'yyyy-MM-dd'),
                format(dateRange.to, 'yyyy-MM-dd')
            )
        } catch (error) {
            console.error('Export error:', error)
        }
    }

    const handleDateRangeChange = async (dateRange: DateRange) => {
        if (!dateRange.from || !dateRange.to) return

        dispatch(fetchAnalytics({
            startDate: format(dateRange.from, 'yyyy-MM-dd'),
            endDate: format(dateRange.to, 'yyyy-MM-dd')
        }))
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Báo cáo & Phân tích</h1>
                <p className="mt-2 text-gray-500">
                    Xem báo cáo chi tiết và phân tích xu hướng tài chính của bạn
                </p>
            </div>

            {error && (
                <Alert
                    variant="error"
                    message={error}
                />
            )}

            <ReportList
                isLoading={isLoading}
                onExport={handleExport}
                onDateRangeChange={handleDateRangeChange}
            />

            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tổng thu nhập</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(analytics.totalIncome)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tổng chi tiêu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-600">
                                {formatCurrency(analytics.totalExpense)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tổng tiết kiệm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(analytics.totalSavings)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Tỷ lệ tiết kiệm: {Math.round(analytics.savingsRate * 100)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {trends && (
                <TrendAnalysis
                    data={trends}
                    isLoading={isLoading}
                />
            )}
        </div>
    )
} 