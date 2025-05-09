"use client"

import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/Tooltip"
import { HelpCircle } from "lucide-react"

interface HelpTooltipProps {
    text: string
    size?: 'sm' | 'md' | 'lg'
    side?: 'top' | 'right' | 'bottom' | 'left'
}

export function HelpTooltip({ text, size = 'sm', side = 'top' }: HelpTooltipProps) {
    const iconSize = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    }[size];

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <HelpCircle className={`ml-1.5 ${iconSize} text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity`} />
                </TooltipTrigger>
                <TooltipContent side={side} className="max-w-xs text-xs">
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
} 