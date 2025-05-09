import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Chart, ChartProps } from '@/components/charts/Chart'
import { formatCurrency } from '@/lib/utils'

interface TrendData {
    labels: string[]
    incomes: number[]
    expenses: number[]
    savings: number[]
}

interface TrendAnalysisProps {
    data: TrendData
    isLoading?: boolean
}

export function TrendAnalysis({ data, isLoading }: TrendAnalysisProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-[400px] animate-pulse bg-gray-100 rounded-lg" />
            </div>
        )
    }

    const chartConfig: ChartProps = {
        type: 'line',
        labels: data.labels,
        datasets: [
            {
                label: 'Thu nhập',
                data: data.incomes,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
            },
            {
                label: 'Chi tiêu',
                data: data.expenses,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
            },
            {
                label: 'Tiết kiệm',
                data: data.savings,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
            },
        ],
        height: 400,
        showLegend: true,
        showTooltip: true,
        formatTooltipValue: (value: number) => formatCurrency(value),
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Phân tích xu hướng</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <Chart {...chartConfig} />
                </div>
            </CardContent>
        </Card>
    )
} 