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
            position: 'right' as const,
            labels: {
                boxWidth: 15,
                padding: 15,
                font: {
                    size: 12
                },
                generateLabels: (chart: any) => {
                    const datasets = chart.data.datasets;
                    return chart.data.labels.map((label: string, i: number) => {
                        const meta = chart.getDatasetMeta(0);
                        const style = meta.controller.getStyle(i);

                        let displayLabel = label;
                        if (displayLabel.length > 20) {
                            displayLabel = displayLabel.substring(0, 18) + '...';
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
            display: true,
            align: 'start' as 'start' | 'center' | 'end',
            fullSize: true,
            maxWidth: 300,
            maxHeight: 100,
            title: {
                display: true,
                text: 'Danh mục',
                font: {
                    weight: 'bold' as const,
                    size: 13
                }
            },
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
    const [legendItemVisibility, setLegendItemVisibility] = useState<boolean[]>([]);

    useEffect(() => {
        if (data && data.labels) {
            setLegendItemVisibility(Array(data.labels.length).fill(true));
            // Ensure chart is also reset if data changes fundamentally
            if (chartRef.current) {
                data.labels.forEach((_, index) => {
                    if (!chartRef.current?.getDataVisibility(index)) {
                        chartRef.current?.toggleDataVisibility(index);
                    }
                });
                chartRef.current?.update();
            }
        }
    }, [data]);

    const handleLegendItemClick = (index: number) => {
        const chart = chartRef.current;
        if (chart) {
            chart.toggleDataVisibility(index);
            chart.update();

            setLegendItemVisibility(prev => {
                const newState = [...prev];
                newState[index] = chart.getDataVisibility(index);
                return newState;
            });
        }
    };

    return (
        <div className="pie-chart-container" style={{ position: 'relative', height: '100%' }}>
            <div style={{ height: '85%', marginRight: '260px' }}>
                <Pie
                    ref={chartRef}
                    options={{
                        ...options,
                        plugins: {
                            ...options.plugins,
                            legend: {
                                ...options.plugins.legend,
                                display: false // Keep custom legend
                            }
                        }
                    }}
                    data={data}
                />
            </div>
            <div
                className="legend-scroll"
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    bottom: '10px',
                    maxHeight: '430px',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    padding: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    width: '240px',
                    border: '1px solid #eaeaea'
                }}
            >
                <div className="legend-title" style={{
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    textAlign: 'center',
                    fontSize: '14px',
                    padding: '4px 0',
                    borderBottom: '1px solid #eaeaea'
                }}>
                    Phân bổ tài chính
                </div>
                <div className="legend-items">
                    {data.labels.map((label: string, index: number) => {
                        const isVisible = legendItemVisibility[index] !== undefined ? legendItemVisibility[index] : true;
                        return (
                            <div
                                key={index}
                                className="legend-item"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    opacity: isVisible ? 1 : 0.5,
                                }}
                                onClick={() => handleLegendItemClick(index)}
                            >
                                <div style={{
                                    width: '14px',
                                    height: '14px',
                                    backgroundColor: data.datasets[0].backgroundColor[index],
                                    marginRight: '8px',
                                    borderRadius: '2px',
                                }}></div>
                                <div style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '180px',
                                    lineHeight: '1.3',
                                    textDecoration: isVisible ? 'none' : 'line-through',
                                }}>
                                    {label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}
