'use client'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { formatCurrency } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
        },
        tooltip: {
            callbacks: {
                label: function (context: any) {
                    let label = context.dataset.label || ''
                    if (label) {
                        label += ': '
                    }
                    if (context.parsed.y !== null) {
                        label += formatCurrency(context.parsed.y)
                    }
                    return label
                },
            },
        },
    },
    scales: {
        y: {
            ticks: {
                callback: function (value: any) {
                    return formatCurrency(value)
                },
            },
        },
    },
}

interface BarChartProps {
    data: {
        labels: string[]
        datasets: {
            label: string
            data: number[]
            backgroundColor: string
            borderColor: string
            borderWidth: number
        }[]
    }
}

export function BarChart({ data }: BarChartProps) {
    return <Bar options={options} data={data} />
} 