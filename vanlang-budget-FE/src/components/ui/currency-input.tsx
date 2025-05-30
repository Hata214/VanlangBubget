'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number
  onChange?: (value: number) => void
  currency?: string
  locale?: string
  allowNegative?: boolean
  maxValue?: number
  minValue?: number
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    className, 
    value = 0, 
    onChange, 
    currency = 'VND',
    locale = 'vi-VN',
    allowNegative = false,
    maxValue,
    minValue = 0,
    disabled,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    // Format number to currency display
    const formatCurrency = (num: number): string => {
      if (isNaN(num)) return ''
      
      try {
        return new Intl.NumberFormat(locale, {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num)
      } catch (error) {
        // Fallback formatting
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
    }

    // Parse currency string to number
    const parseCurrency = (str: string): number => {
      if (!str) return 0
      
      // Remove all non-digit characters except minus sign
      const cleaned = str.replace(/[^\d-]/g, '')
      const num = parseInt(cleaned) || 0
      
      // Apply constraints
      if (!allowNegative && num < 0) return 0
      if (minValue !== undefined && num < minValue) return minValue
      if (maxValue !== undefined && num > maxValue) return maxValue
      
      return num
    }

    // Update display value when value prop changes
    React.useEffect(() => {
      setDisplayValue(formatCurrency(value))
    }, [value, locale])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const numericValue = parseCurrency(inputValue)
      
      // Update display with formatted value
      setDisplayValue(formatCurrency(numericValue))
      
      // Call onChange with numeric value
      if (onChange) {
        onChange(numericValue)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ensure proper formatting on blur
      const numericValue = parseCurrency(displayValue)
      setDisplayValue(formatCurrency(numericValue))
      
      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all text on focus for easy editing
      e.target.select()
      
      if (props.onFocus) {
        props.onFocus(e)
      }
    }

    return (
      <div className="relative">
        <input
          type="text"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            currency === 'VND' ? 'pr-12' : 'pr-8',
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          {...props}
        />
        {currency && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-sm text-muted-foreground font-medium">
              {currency}
            </span>
          </div>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }
