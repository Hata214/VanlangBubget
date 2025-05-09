import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BarChart } from '@/components/charts/BarChart'
import { PieChart } from '@/components/charts/PieChart'
import { formatCurrency } from '@/lib/utils'
import type { Loan } from '@/types'

interface LoanStatisticsProps {
    loans: Loan[]
}

export function LoanStatistics({ loans }: LoanStatisticsProps) {
    const stats = useMemo(() => {
        const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0)
        const activeLoans = loans.filter(loan => loan.status === 'ACTIVE')
        const activeAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0)
        const paidLoans = loans.filter(loan => loan.status === 'PAID')
        const paidAmount = paidLoans.reduce((sum, loan) => sum + loan.amount, 0)
        const overdueLoans = loans.filter(loan => loan.status === 'OVERDUE')
        const overdueAmount = overdueLoans.reduce((sum, loan) => sum + loan.amount, 0)

        // Tính toán lãi suất trung bình
        const avgInterestRate = loans.length
            ? loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length
            : 0

        // Thống kê theo tháng
        const monthlyStats = loans.reduce((acc: Record<string, number>, loan) => {
            const month = new Date(loan.startDate).toLocaleDateString('vi-VN', {
                month: 'long',
                year: 'numeric',
            })
            acc[month] = (acc[month] || 0) + loan.amount
            return acc
        }, {})

        return {
            totalAmount,
            activeAmount,
            paidAmount,
            overdueAmount,
            activeCount: activeLoans.length,
            paidCount: paidLoans.length,
            overdueCount: overdueLoans.length,
            avgInterestRate,
            monthlyStats,
        }
    }, [loans])

    const barChartData = {
        labels: Object.keys(stats.monthlyStats),
        datasets: [
            {
                label: 'Số tiền vay',
                data: Object.values(stats.monthlyStats),
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1,
            },
        ],
    }

    const pieChartData = {
        labels: ['Đang vay', 'Đã trả', 'Quá hạn'],
        datasets: [
            {
                data: [stats.activeAmount, stats.paidAmount, stats.overdueAmount],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.5)', // blue
                    'rgba(16, 185, 129, 0.5)', // green
                    'rgba(239, 68, 68, 0.5)', // red
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)',
                ],
                borderWidth: 1,
            },
        ],
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Tổng số tiền vay
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(stats.totalAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {loans.length} khoản vay
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Đang vay
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(stats.activeAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.activeCount} khoản vay
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Đã trả
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats.paidAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.paidCount} khoản vay
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Quá hạn
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(stats.overdueAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.overdueCount} khoản vay
                    </p>
                </CardContent>
            </Card>

            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Thống kê theo tháng</CardTitle>
                </CardHeader>
                <CardContent>
                    <BarChart data={barChartData} />
                </CardContent>
            </Card>

            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Phân bổ khoản vay</CardTitle>
                </CardHeader>
                <CardContent>
                    <PieChart data={pieChartData} />
                </CardContent>
            </Card>
        </div>
    )
} 