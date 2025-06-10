'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { Chart as ChartJSInstance } from 'chart.js';
import { Pie } from 'react-chartjs-2'
import { formatCurrency } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend)

export const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom' as const, // Chuyển legend xuống dưới
            labels: {
                boxWidth: 16, // Tăng kích thước hộp màu một chút
                padding: 15, // Giảm padding giữa các mục để chúng gần nhau hơn
                font: {
                    size: 12 // Tăng kích thước font một chút
                },
                generateLabels: (chart: any) => { // Giữ lại logic cắt nhãn dài
                    const datasets = chart.data.datasets;
                    return chart.data.labels.map((label: string, i: number) => {
                        const meta = chart.getDatasetMeta(0);
                        const style = meta.controller.getStyle(i);

                        let displayLabel = label;
                        // Cắt nhãn dài hơn một chút để phù hợp hơn khi ở dưới
                        if (displayLabel.length > 25) {
                            displayLabel = displayLabel.substring(0, 22) + '...';
                        }

                        return {
                            text: displayLabel,
                            fillStyle: style.backgroundColor,
                            strokeStyle: style.borderColor,
                            lineWidth: style.borderWidth,
                            hidden: !chart.getDataVisibility(i),
                            index: i
                        };
                    });
                }
            },
            display: false, // Ẩn legend mặc định, sẽ dùng checkboxes
            // Các thuộc tính align, fullSize, maxWidth, maxHeight, title không cần thiết khi legend ở dưới và là mặc định
        },
        tooltip: {
            callbacks: {
                label: function (context: any) {
                    let originalLabel = context.chart.data.labels[context.dataIndex] || '';
                    let label = originalLabel;

                    if (label) {
                        label += ': '
                    }
                    if (context.parsed !== null) {
                        label += formatCurrency(context.parsed)
                    }
                    const dataset = context.dataset
                    const total = dataset.data.reduce((acc: number, current: number) => acc + current, 0)
                    const percentage = Math.round((context.parsed * 100) / total)
                    return `${label} (${percentage}%)`
                },
                title: function (context: any) {
                    return '';
                }
            },
        },
    },
}

interface PieChartProps {
    data: {
        labels: string[]
        datasets: {
            data: number[]
            backgroundColor: string[]
            borderColor: string[]
            borderWidth: number
        }[]
    }
}

export function PieChart({ data }: PieChartProps) {
    const chartRef = useRef<ChartJSInstance<'pie', number[], string> | null>(null);
    const [visibility, setVisibility] = useState<boolean[]>([]);

    useEffect(() => {
        if (data && data.labels) {
            const initialVisibility = Array(data.labels.length).fill(true);
            setVisibility(initialVisibility);

            // Đảm bảo chart instance được cập nhật đúng visibility ban đầu
            if (chartRef.current) {
                initialVisibility.forEach((isVisible, index) => {
                    if (chartRef.current!.getDataVisibility(index) !== isVisible) {
                        chartRef.current!.toggleDataVisibility(index);
                    }
                });
                chartRef.current.update();
            }
        }
    }, [data]);

    const handleVisibilityChange = (index: number) => {
        const chart = chartRef.current;
        if (chart) {
            chart.toggleDataVisibility(index);
            chart.update();
            setVisibility(prev => {
                const newVisibility = [...prev];
                newVisibility[index] = chart.getDataVisibility(index);
                return newVisibility;
            });
        }
    };

    return (
        <div className="pie-chart-container" style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="mb-3 p-2 border border-border rounded-md bg-card max-h-28 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-1.5">
                    {data.labels.map((label, index) => {
                        const isChecked = visibility[index] !== undefined ? visibility[index] : true;
                        const color = data.datasets[0].backgroundColor[index];
                        return (
                            <label key={index} className="flex items-center text-xs cursor-pointer select-none group">
                                <span
                                    className="inline-block w-3 h-3 rounded-sm mr-1.5 border border-gray-300 dark:border-gray-700 flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                ></span>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleVisibilityChange(index)}
                                    className="form-checkbox h-3.5 w-3.5 text-primary rounded-sm border-gray-300 dark:border-gray-600 focus:ring-primary/50 focus:ring-offset-0 mr-1.5 flex-shrink-0"
                                />
                                <span className={`truncate group-hover:text-primary ${!isChecked ? 'line-through text-muted-foreground opacity-60' : 'text-foreground'}`} title={label}>
                                    {label.length > 18 ? label.substring(0, 16) + '...' : label}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
            <div style={{ flexGrow: 1, position: 'relative' }}> {/* Container cho biểu đồ để nó chiếm không gian còn lại */}
                <Pie
                    ref={chartRef}
                    options={options}
                    data={data}
                />
            </div>
        </div>
    )
}
