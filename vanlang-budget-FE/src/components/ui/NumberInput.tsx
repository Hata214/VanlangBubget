import React, { forwardRef, InputHTMLAttributes, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    error?: string;
    label?: string;
    currency?: string;
    onChange?: (value: number) => void;
    initialValue?: number;
    allowClear?: boolean;
    showSuggestions?: boolean;
    allowDecimal?: boolean;
    decimalPlaces?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    ({ className, error, label, currency = 'đ', onChange, initialValue = 0, allowClear = true, showSuggestions = true, allowDecimal = false, decimalPlaces = 1, ...props }, ref) => {
        const [inputValue, setInputValue] = useState<string>(initialValue ? initialValue.toString() : '');
        const [isFocused, setIsFocused] = useState(false);
        const [firstDigit, setFirstDigit] = useState<string>('');

        useEffect(() => {
            if (initialValue !== undefined && !isFocused) {
                setInputValue(initialValue.toString());
            }
        }, [initialValue, isFocused]);

        useEffect(() => {
            // Cập nhật số đầu tiên người dùng nhập vào
            if (inputValue && /^[1-9]/.test(inputValue)) {
                setFirstDigit(inputValue[0]);
            } else {
                setFirstDigit('');
            }
        }, [inputValue]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Xử lý input dựa trên allowDecimal
            let newValue: string;

            if (allowDecimal) {
                // Cho phép số và dấu chấm (chỉ 1 dấu chấm)
                // Dùng regex để đảm bảo chỉ có tối đa 1 dấu chấm và số lượng chữ số thập phân hợp lệ
                const regex = new RegExp(`^\\d*(\\.\\d{0,${decimalPlaces}})?$`);

                // Nếu giá trị mới không khớp với regex, giữ nguyên giá trị cũ
                if (regex.test(e.target.value)) {
                    newValue = e.target.value;
                } else {
                    newValue = inputValue;
                }
            } else {
                // Chỉ cho phép nhập số nguyên
                newValue = e.target.value.replace(/[^0-9]/g, '');
            }

            setInputValue(newValue);

            // Chuyển đổi giá trị thành số để gọi onChange
            let numericValue = 0;
            if (newValue) {
                numericValue = parseFloat(newValue);
                // Xử lý NaN
                if (isNaN(numericValue)) {
                    numericValue = 0;
                }
            }

            onChange?.(numericValue);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            if (inputValue === '0') {
                setInputValue('');
            }
            props.onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);

            // Định dạng lại số khi blur nếu là số thập phân
            if (allowDecimal && inputValue !== '') {
                // Nếu user chỉ nhập dấu chấm, mặc định là 0
                if (inputValue === '.') {
                    setInputValue('0');
                    onChange?.(0);
                }
                // Đảm bảo số không kết thúc bằng dấu chấm (ví dụ: "5." -> "5")
                else if (inputValue.endsWith('.')) {
                    const formattedValue = inputValue.slice(0, -1);
                    setInputValue(formattedValue);
                    onChange?.(parseFloat(formattedValue));
                }
            }

            props.onBlur?.(e);
        };

        const handleClear = () => {
            setInputValue('');
            onChange?.(0);
        };

        const handleSuggestionClick = (value: number) => {
            setInputValue(value.toString());
            onChange?.(value);
        };

        // Tạo các gợi ý dựa vào số đầu tiên
        const renderSuggestions = () => {
            if (!firstDigit || !showSuggestions) return null;

            const digit = parseInt(firstDigit, 10);
            let secondDigit = 0;

            // Xác định chữ số thứ hai nếu có
            if (inputValue.length >= 2 && /^\d+$/.test(inputValue)) {
                secondDigit = parseInt(inputValue[1], 10);
            }

            // Tạo các gợi ý theo định dạng mới với giá trị chính xác
            const suggestions = [];

            // Nếu là trường lãi suất (có allowDecimal = true), hiển thị gợi ý khác
            if (allowDecimal && currency === '%') {
                // Gợi ý cho lãi suất dạng thập phân
                suggestions.push(
                    { label: `${digit}.5 ${currency}`, value: digit + 0.5 },
                    { label: `${digit} ${currency}`, value: digit },
                    { label: `${digit * 2} ${currency}`, value: digit * 2 },
                    { label: `${digit * 5} ${currency}`, value: digit * 5 }
                );
            } else {
                // Gợi ý bình thường cho tiền tệ
                // Nếu người dùng đã nhập 2 chữ số, hiển thị x.y00
                if (inputValue.length >= 2) {
                    suggestions.push({
                        label: `${digit}.${secondDigit}00 ${currency}`,
                        value: Number(`${digit}${secondDigit}00`) // x.y00 = xy00
                    });
                } else {
                    // Nếu chỉ nhập 1 chữ số, hiển thị x.000
                    suggestions.push({
                        label: `${digit}.000 ${currency}`,
                        value: Number(`${digit}000`) // x.000 = x000
                    });
                }

                // Các gợi ý khác
                suggestions.push(
                    {
                        label: `${digit}${secondDigit}.000 ${currency}`,
                        value: Number(`${digit}${secondDigit}000`) // xy.000 = xy000
                    },
                    {
                        label: `${digit}${secondDigit}0.000 ${currency}`,
                        value: Number(`${digit}${secondDigit}0000`) // xy0.000 = xy0000
                    },
                    {
                        label: `${digit}.${secondDigit}00.000 ${currency}`,
                        value: Number(`${digit}${secondDigit}00000`) // x.y00.000 = xy00000
                    },
                    {
                        label: `${digit}${secondDigit}.000.000 ${currency}`,
                        value: Number(`${digit}${secondDigit}000000`) // xy.000.000 = xy000000
                    }
                );
            }

            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                            onClick={() => handleSuggestionClick(suggestion.value)}
                        >
                            {suggestion.label}
                        </button>
                    ))}
                </div>
            );
        };

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-foreground mb-1">
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    <input
                        type="text"
                        inputMode={allowDecimal ? "decimal" : "numeric"}
                        className={cn(
                            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-12',
                            error
                                ? 'border-red-500 focus-visible:ring-red-500'
                                : 'border-input focus-visible:ring-primary',
                            className
                        )}
                        ref={ref}
                        value={inputValue}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        {...props}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                        {currency}
                    </div>
                    {allowClear && inputValue && (
                        <button
                            type="button"
                            className="absolute right-8 inset-y-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
                            onClick={handleClear}
                        >
                            <span className="sr-only">Clear</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                {renderSuggestions()}
            </div>
        );
    }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput }; 