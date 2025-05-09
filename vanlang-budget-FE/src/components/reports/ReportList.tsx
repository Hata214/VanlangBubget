'use client'

import React, { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'

interface ReportListProps {
    isLoading: boolean
    onExport: (dateRange: DateRange) => void
    onDateRangeChange: (dateRange: DateRange) => void
}

export function ReportList({ isLoading, onExport, onDateRangeChange }: ReportListProps) {
    const [date, setDate] = useState<DateRange | undefined>()

    const handleDateChange = (newDate: DateRange | undefined) => {
        setDate(newDate)
        if (newDate) {
            onDateRangeChange(newDate)
        }
    }

    const handleExport = () => {
        if (date) {
            onExport(date)
        }
    }

    return (
        <div className="space-y-4">
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <DateRangePicker
                        date={date}
                        onDateChange={handleDateChange}
                    />
                    <Button
                        onClick={handleExport}
                        disabled={!date || isLoading}
                        className="ml-4"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Xuất báo cáo
                    </Button>
                </div>
            </Card>
        </div>
    )
} 