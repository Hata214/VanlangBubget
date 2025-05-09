'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { vi } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Calendar } from '@/components/ui/Calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/Popover'

interface DateRangePickerProps {
    date?: DateRange
    onDateChange: (date: DateRange | undefined) => void
    className?: string
}

export function DateRangePicker({
    date,
    onDateChange,
    className,
}: DateRangePickerProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={'outline'}
                        className={cn(
                            'w-[300px] justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, 'dd/MM/yyyy', { locale: vi })} -{' '}
                                    {format(date.to, 'dd/MM/yyyy', { locale: vi })}
                                </>
                            ) : (
                                format(date.from, 'dd/MM/yyyy', { locale: vi })
                            )
                        ) : (
                            <span>Chọn khoảng thời gian</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={onDateChange}
                        numberOfMonths={2}
                        locale={vi}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
} 