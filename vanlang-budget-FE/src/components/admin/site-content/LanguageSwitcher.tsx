'use client';

import { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';

type LanguageSwitcherProps = {
    currentLanguage: 'vi' | 'en';
    onLanguageChange: (language: 'vi' | 'en') => void;
    className?: string;
    variant?: 'default' | 'compact';
};

export default function LanguageSwitcher({
    currentLanguage,
    onLanguageChange,
    className,
    variant = 'default'
}: LanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'en', name: 'English', flag: '🇬🇧' }
    ];

    const handleLanguageSelect = (languageCode: 'vi' | 'en') => {
        onLanguageChange(languageCode);
        setIsOpen(false);
    };

    // Hiển thị compact - chỉ hiện biểu tượng và mã ngôn ngữ
    if (variant === 'compact') {
        return (
            <button
                onClick={() => onLanguageChange(currentLanguage === 'vi' ? 'en' : 'vi')}
                className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium flex items-center",
                    currentLanguage === 'vi'
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
                    className
                )}
                title={currentLanguage === 'vi' ? 'Chuyển sang tiếng Anh' : 'Chuyển sang tiếng Việt'}
            >
                <Globe size={16} className="mr-1" />
                <span>{currentLanguage.toUpperCase()}</span>
            </button>
        );
    }

    // Hiển thị mặc định với popover
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2",
                        currentLanguage === 'vi'
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
                        className
                    )}
                >
                    <Globe size={16} />
                    <span>
                        {languages.find(lang => lang.code === currentLanguage)?.flag}{' '}
                        {currentLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
                    </span>
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-48 p-1">
                <div className="py-1">
                    {languages.map((language) => (
                        <button
                            key={language.code}
                            className={cn(
                                "flex items-center w-full px-3 py-2 text-sm rounded-md",
                                currentLanguage === language.code
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-muted"
                            )}
                            onClick={() => handleLanguageSelect(language.code as 'vi' | 'en')}
                        >
                            <span className="mr-2">{language.flag}</span>
                            <span className="flex-1 text-left">{language.name}</span>
                            {currentLanguage === language.code && (
                                <Check size={16} className="text-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
} 