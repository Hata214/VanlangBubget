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
  showSuggestions?: boolean
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
    showSuggestions = true,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')
    const [isFocused, setIsFocused] = React.useState(false)
    const [inputDigits, setInputDigits] = React.useState('')

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

      // Track first 1-6 digits for suggestions
      const cleanInput = inputValue.replace(/[^\d]/g, '')

      // Update inputDigits for suggestions (support 1-6 digits)
      if (cleanInput.length >= 1 && cleanInput.length <= 6 && /^\d{1,6}$/.test(cleanInput)) {
        setInputDigits(cleanInput)
      } else if (cleanInput.length === 0) {
        setInputDigits('')
      } else if (cleanInput.length > 6) {
        // If more than 6 digits, clear suggestions
        setInputDigits('')
      }

      // Call onChange with numeric value
      if (onChange) {
        onChange(numericValue)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Ensure proper formatting on blur
      const numericValue = parseCurrency(displayValue)
      setDisplayValue(formatCurrency(numericValue))
      setIsFocused(false)
      // Don't clear inputDigits on blur to allow re-focus suggestions

      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all text on focus for easy editing
      e.target.select()
      setIsFocused(true)

      // Re-evaluate inputDigits when focusing to show suggestions again
      const currentValue = e.target.value
      const cleanInput = currentValue.replace(/[^\d]/g, '')
      if (cleanInput.length >= 1 && cleanInput.length <= 6 && /^\d{1,6}$/.test(cleanInput)) {
        setInputDigits(cleanInput)
      }

      if (props.onFocus) {
        props.onFocus(e)
      }
    }

    // Generate suggestions based on first 1-6 digits
    const generateSuggestions = () => {
      if (!showSuggestions || !inputDigits || !isFocused) return []

      const baseNumber = parseInt(inputDigits)
      if (isNaN(baseNumber) || baseNumber === 0) return []

      // Generate suggestions with different multipliers based on digit count
      let multipliers: number[] = []

      if (inputDigits.length === 1) {
        // For 1 digit: 2 → 2k, 20k, 200k, 2M, 20M, 200M
        multipliers = [1000, 10000, 100000, 1000000, 10000000, 100000000]
      } else if (inputDigits.length === 2) {
        // For 2 digits: 25 → 2.5k, 25k, 250k, 2.5M, 25M, 250M
        multipliers = [100, 1000, 10000, 100000, 1000000, 10000000]
      } else if (inputDigits.length === 3) {
        // For 3 digits: 123 → 12.3k, 123k, 1.23M, 12.3M, 123M
        multipliers = [10, 100, 1000, 10000, 100000, 1000000]
      } else if (inputDigits.length === 4) {
        // For 4 digits: 1234 → 12.34k, 123.4k, 1.234M, 12.34M, 123.4M
        multipliers = [1, 10, 100, 1000, 10000, 100000]
      } else if (inputDigits.length === 5) {
        // For 5 digits: 12345 → 123.45k, 1.2345M, 12.345M, 123.45M
        multipliers = [1, 10, 100, 1000, 10000]
      } else if (inputDigits.length === 6) {
        // For 6 digits: 123456 → 1.23456M, 12.3456M, 123.456M
        multipliers = [1, 10, 100, 1000]
      }

      const suggestions = multipliers
        .map(multiplier => baseNumber * multiplier)
        .filter(amount => amount >= minValue && (!maxValue || amount <= maxValue))
        .slice(0, 6) // Limit to 6 suggestions max

      return suggestions
    }

    const suggestions = generateSuggestions()

    const handleSuggestionClick = (amount: number) => {
      // Update value immediately
      setDisplayValue(formatCurrency(amount))
      if (onChange) {
        onChange(amount)
      }

      // Clear suggestions state with slight delay to ensure smooth UI
      setTimeout(() => {
        setInputDigits('') // Clear input digits to hide suggestions
        setIsFocused(false) // Hide suggestions after selection
      }, 0)
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

        {/* Amount suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((amount, index) => (
              <button
                key={`suggestion-${amount}-${index}`}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSuggestionClick(amount)
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <span className="font-medium text-gray-900">
                  {formatCurrency(amount)}
                </span>
                <span className="ml-2 text-gray-500">VND</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }
