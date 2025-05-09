'use client'

import { useMemo } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions,
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { formatCurrency } from '@/lib/utils'

// Đăng ký các components cần thiết cho Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
)

// Định nghĩa các loại biểu đồ được hỗ trợ
export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut'

// Interface cho dữ liệu biểu đồ
export interface ChartDataset {
    label?: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
}

export interface ChartProps {
    type: ChartType
    labels: string[]
    datasets: ChartDataset[]
    title?: string
    height?: number
    width?: number
    className?: string
    showLegend?: boolean
    showTooltip?: boolean
    formatTooltipValue?: (value: number) => string
}

export function Chart({
    type,
    labels,
    datasets,
    title,
    height,
    width,
    className,
    showLegend = true,
    showTooltip = true,
    formatTooltipValue = formatCurrency,
}: ChartProps) {
    // Cấu hình chung cho biểu đồ
    const baseOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: showLegend,
                    position: 'top' as const,
                },
                title: {
                    display: !!title,
                    text: title,
                },
                tooltip: {
                    enabled: showTooltip,
                    callbacks: {
                        label: function (context: any) {
                            let label = context.dataset.label || ''
                            if (label) {
                                label += ': '
                            }
                            if (context.parsed.y !== null) {
                                label += formatTooltipValue(context.parsed.y)
                            }
                            return label
                        },
                    },
                },
            },
            scales: type === 'pie' || type === 'doughnut'
                ? undefined
                : {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value: any) {
                                return formatTooltipValue(value)
                            },
                        },
                    },
                },
        }),
        [type, title, showLegend, showTooltip, formatTooltipValue]
    )

    // Chuẩn bị dữ liệu cho biểu đồ
    const chartData = useMemo(() => ({
        labels,
        datasets: datasets.map(dataset => ({
            ...dataset,
            borderWidth: dataset.borderWidth || 1,
        })),
    }), [labels, datasets])

    // Render biểu đồ tương ứng với type
    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <Bar
                        data={chartData as ChartData<'bar'>}
                        options={baseOptions as ChartOptions<'bar'>}
                        width={width}
                        height={height}
                    />
                )
            case 'line':
                return (
                    <Line
                        data={chartData as ChartData<'line'>}
                        options={baseOptions as ChartOptions<'line'>}
                        width={width}
                        height={height}
                    />
                )
            case 'pie':
                return (
                    <Pie
                        data={chartData as ChartData<'pie'>}
                        options={baseOptions as ChartOptions<'pie'>}
                        width={width}
                        height={height}
                    />
                )
            case 'doughnut':
                return (
                    <Doughnut
                        data={chartData as ChartData<'doughnut'>}
                        options={baseOptions as ChartOptions<'doughnut'>}
                        width={width}
                        height={height}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div
            className={className}
            style={{
                width: width || '100%',
                height: height || 400,
            }}
        >
            {renderChart()}
        </div>
    )
} 