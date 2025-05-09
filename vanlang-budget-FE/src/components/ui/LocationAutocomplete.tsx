'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import { Loader2, MapPin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDebounce } from '@/hooks/useDebounce';

export interface LocationSuggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

interface LocationAutocompleteProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number) => void;
    onClear: () => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}

export function LocationAutocomplete({
    value,
    onChange,
    onClear,
    placeholder,
    disabled = false,
    loading = false,
    className = '',
}: LocationAutocompleteProps) {
    const t = useTranslations();
    const [focused, setFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const debouncedValue = useDebounce(value, 500);

    // Tự động lấy gợi ý vị trí khi người dùng nhập
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!debouncedValue || debouncedValue.length < 3) {
                setSuggestions([]);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const encodedAddress = encodeURIComponent(debouncedValue);
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&accept-language=vi`
                );

                if (!response.ok) {
                    throw new Error('Không thể lấy gợi ý địa chỉ');
                }

                const data = await response.json();
                setSuggestions(data);
            } catch (err) {
                console.error('Error fetching location suggestions:', err);
                setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedValue]);

    // Đóng danh sách gợi ý khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
        onChange(suggestion.display_name, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
        setFocused(false);
        setSuggestions([]);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    placeholder={placeholder || t('expense.enterLocation')}
                    disabled={disabled || loading}
                    className={className}
                />
                {(loading || isLoading) && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                )}
                {value && !loading && !isLoading && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label="Clear location"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {focused && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                    <ul className="py-1">
                        {suggestions.map((suggestion) => (
                            <li
                                key={suggestion.place_id}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="flex items-start px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{suggestion.display_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {focused && error && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-red-200">
                    <div className="p-2 text-sm text-red-500">{error}</div>
                </div>
            )}

            {focused && debouncedValue && debouncedValue.length >= 3 && !isLoading && !error && suggestions.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
                    <div className="p-2 text-sm text-gray-500">{t('expense.addressNotFound')}</div>
                </div>
            )}
        </div>
    );
} 