'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import LanguageSwitcher from './LanguageSwitcher';

interface Tab {
    id: string;
    label: string;
    content: React.ReactNode;
}

interface ContentTabsProps {
    tabs: Tab[];
    defaultActiveTab?: string;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
    withLanguageToggle?: boolean;
    currentLanguage?: 'vi' | 'en';
    onLanguageChange?: (language: 'vi' | 'en') => void;
}

export default function ContentTabs({
    tabs,
    defaultActiveTab,
    orientation = 'horizontal',
    className,
    withLanguageToggle = false,
    currentLanguage = 'vi',
    onLanguageChange,
}: ContentTabsProps) {
    const [activeTab, setActiveTab] = useState(defaultActiveTab || (tabs.length > 0 ? tabs[0].id : ''));

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
    };

    const isVertical = orientation === 'vertical';

    return (
        <div className={cn('w-full', className)}>
            <div className={cn('flex', isVertical ? 'flex-col md:flex-row' : 'flex-col')}>
                <div
                    className={cn(
                        'flex',
                        isVertical
                            ? 'md:flex-col border-r md:w-64 shrink-0 md:h-auto overflow-auto'
                            : 'overflow-x-auto border-b'
                    )}
                >
                    <div className={cn(
                        'flex',
                        isVertical ? 'md:flex-col w-full' : 'w-auto',
                        withLanguageToggle && 'justify-between items-center pr-2'
                    )}>
                        <div className={cn('flex', isVertical ? 'flex-col w-full' : 'space-x-1')}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        'px-4 py-2 text-sm font-medium transition-colors',
                                        isVertical ? 'text-left' : 'text-center',
                                        activeTab === tab.id
                                            ? 'bg-primary/10 text-primary border-b-2 border-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {withLanguageToggle && onLanguageChange && (
                            <div className={isVertical ? 'mt-4 px-4' : ''}>
                                <LanguageSwitcher
                                    currentLanguage={currentLanguage}
                                    onLanguageChange={onLanguageChange}
                                    variant="compact"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className={cn('flex-1 p-4', isVertical ? 'md:border-l md:border-t-0' : 'border-t')}>
                    {tabs.find((tab) => tab.id === activeTab)?.content}
                </div>
            </div>
        </div>
    );
} 