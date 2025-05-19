'use client'

import * as React from 'react'
import { Input, type InputProps } from '@/components/ui/Input'
import { formatInputNumberWithDots } from '@/utils/formatters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const MAX_VALUE = BigInt("100000000000"); // 100 tỷ
const MAX_VALUE_STRING = MAX_VALUE.toString();
const DEFAULT_SUGGESTION_UPPER_BOUND = 100000000; // 100 triệu

interface CurrencyInputProps extends Omit<InputProps, 'value' | 'onChange'> {
    value?: number | null // Giá trị số thực
    onValueChange?: (value: number | undefined) => void // Callback khi giá trị số thay đổi
    placeholder?: string
    suggestionLimit?: number // Prop mới để tùy chỉnh giới hạn gợi ý
}

const CurrencyInput = React.forwardRef<
    HTMLInputElement,
    CurrencyInputProps
>(({ value, onValueChange, className, placeholder, suggestionLimit = DEFAULT_SUGGESTION_UPPER_BOUND, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')
    const [isOverLimit, setIsOverLimit] = React.useState(false)
    const [suggestions, setSuggestions] = React.useState<number[]>([]);
    const lastManuallyTypedDigitsRef = React.useRef<string>("");

    React.useEffect(() => {
        if (value !== undefined && value !== null) {
            const numValue = BigInt(value);
            const stringValue = String(value);
            if (numValue > MAX_VALUE) {
                setDisplayValue(formatInputNumberWithDots(MAX_VALUE_STRING));
            } else {
                setDisplayValue(formatInputNumberWithDots(stringValue));
            }
            const rawDigitsFromProp = stringValue.replace(/\D/g, '');
            if (lastManuallyTypedDigitsRef.current !== rawDigitsFromProp && !displayValue.startsWith(formatInputNumberWithDots(rawDigitsFromProp))) {
                // Chỉ cập nhật nếu giá trị từ prop thực sự khác và không phải là kết quả của việc đang gõ
                // lastManuallyTypedDigitsRef.current = rawDigitsFromProp; // Tạm thời comment để test
            }
        } else {
            setDisplayValue('');
            setSuggestions([]);
            lastManuallyTypedDigitsRef.current = "";
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const numericStringFromFormatted = (formatted: string) => formatted.replace(/\D/g, '');

    const extractBaseNumberString = (digits: string): string => {
        if (!digits) return "";
        // Nếu số có vẻ là kết quả của việc nhân với 1000, 10000,... cố gắng tìm lại gốc
        // Ví dụ: "12000" -> "12", "120000" -> "12", "123000" -> "123"
        // Chỉ thực hiện nếu có ít nhất 4 chữ số và kết thúc bằng "000"
        let tempStr = digits;
        if (tempStr.length > 3 && tempStr.endsWith("000")) {
            // Thử chia cho 1000 nhiều lần
            while (tempStr.length > 3 && tempStr.endsWith("000")) {
                const shorter = tempStr.substring(0, tempStr.length - 3);
                if (shorter.length === 0) break; // Tránh trường hợp chỉ có "000"
                tempStr = shorter;
            }
            // Nếu kết quả quá ngắn (ví dụ "0" từ "0000"), hoặc không hợp lý, có thể trả về digits ban đầu
            // Hoặc nếu base còn lại quá dài (ví dụ 1234000 -> 1234), thì vẫn dùng nó
            if (tempStr.length > 0 && tempStr.length <= 7) { // Ưu tiên base ngắn hơn
                return tempStr;
            }
        }
        return digits; // Trả về chuỗi gốc nếu không có thay đổi hoặc thay đổi không hợp lệ
    };

    const generateSuggestions = (rawNumericString: string) => {
        if (!rawNumericString) return [];
        const baseNum = parseInt(rawNumericString, 10);
        if (isNaN(baseNum) || baseNum <= 0) return []; // <= 0 để không gợi ý từ số 0

        const newSuggestions: number[] = [];
        const multipliers = [1000, 10000, 100000, 1000000, 10000000, 100000000];

        for (const multiplier of multipliers) {
            // Nếu baseNum đã là dạng X.000, Y.000.000 và multiplier là 1, thì không nhân nữa
            // Thay vào đó, ta có thể bắt đầu nhân từ baseNum * 1000 luôn
            // if (multiplier === 1 && baseNum >= 1000 && baseNum % 1000 === 0) continue;

            const suggestedNumBigInt = BigInt(baseNum) * BigInt(multiplier);

            if (suggestedNumBigInt <= MAX_VALUE && suggestedNumBigInt <= BigInt(suggestionLimit)) {
                newSuggestions.push(Number(suggestedNumBigInt));
            }
            if (suggestedNumBigInt > BigInt(suggestionLimit) && multiplier > 1000 && newSuggestions.length > 0) break;
            if (suggestedNumBigInt > MAX_VALUE && multiplier > 1000) break;
        }
        return Array.from(new Set(newSuggestions)).sort((a, b) => a - b);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        const digitsOnly = numericStringFromFormatted(inputValue);

        lastManuallyTypedDigitsRef.current = digitsOnly; // Cập nhật khi người dùng gõ

        if (digitsOnly === '') {
            setDisplayValue('');
            setIsOverLimit(false);
            setSuggestions([]);
            if (onValueChange) onValueChange(undefined);
            return;
        }

        let currentNumericStringForDisplay = digitsOnly;
        let tempIsOverLimit = false;

        if (BigInt(currentNumericStringForDisplay) > MAX_VALUE) {
            tempIsOverLimit = true;
            currentNumericStringForDisplay = MAX_VALUE_STRING;
        }

        setIsOverLimit(tempIsOverLimit);
        // Tạo gợi ý dựa trên digitsOnly (những gì người dùng vừa gõ)
        setSuggestions(tempIsOverLimit ? [] : generateSuggestions(digitsOnly));

        const finalNumber = Number(currentNumericStringForDisplay);
        setDisplayValue(formatInputNumberWithDots(currentNumericStringForDisplay));

        // Gọi onValueChange nếu giá trị số thực sự thay đổi
        if (value !== finalNumber) {
            onValueChange?.(isNaN(finalNumber) ? undefined : finalNumber);
        }
    };

    const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        // Khi focus, tạo gợi ý dựa trên giá trị người dùng đã gõ lần cuối (lastManuallyTypedDigitsRef)
        // Hoặc nếu không có, thì dựa trên giá trị hiện tại của input (đã loại bỏ định dạng).
        const focusValueSource = lastManuallyTypedDigitsRef.current || numericStringFromFormatted(displayValue);
        if (focusValueSource) {
            // Trước khi tạo gợi ý, thử trích xuất base number từ focusValueSource
            const baseForSuggestions = extractBaseNumberString(focusValueSource);
            setSuggestions(generateSuggestions(baseForSuggestions));
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestedValue: number) => {
        const suggestedString = String(suggestedValue);
        setDisplayValue(formatInputNumberWithDots(suggestedString));
        setIsOverLimit(false);
        if (onValueChange) {
            onValueChange(suggestedValue);
        }
        // Khi chọn gợi ý, cập nhật lastManuallyTypedDigitsRef bằng phần gốc của gợi ý đó
        // để lần focus tiếp theo có thể tạo lại bộ gợi ý đầy đủ.
        lastManuallyTypedDigitsRef.current = extractBaseNumberString(suggestedString);
        setSuggestions([]);
    };

    return (
        <div className="w-full">
            <Input
                {...props}
                ref={ref}
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                placeholder={placeholder || '0'}
                className={cn('text-right', className, isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : '')}
            />
            {isOverLimit && (
                <p className="text-xs text-red-500 mt-1">
                    Số tiền không được vượt quá 100 tỷ.
                </p>
            )}
            {suggestions.length > 0 && !isOverLimit && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {suggestions.map((sug) => (
                        <Button
                            type="button"
                            key={sug}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                            onClick={() => handleSuggestionClick(sug)}
                        >
                            {formatInputNumberWithDots(String(sug))}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    )
})

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput } 