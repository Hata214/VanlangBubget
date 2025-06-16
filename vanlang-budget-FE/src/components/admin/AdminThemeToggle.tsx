'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

export function AdminThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="admin-theme-toggle-skeleton">
                <div className="admin-theme-button skeleton">
                    <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                </div>
            </div>
        );
    }

    const themes = [
        { key: 'light', icon: Sun, label: 'Sáng' },
        { key: 'dark', icon: Moon, label: 'Tối' },
        { key: 'system', icon: Monitor, label: 'Hệ thống' }
    ];

    const currentTheme = themes.find(t => t.key === theme) || themes[0];
    const CurrentIcon = currentTheme.icon;

    return (
        <div className="admin-theme-toggle">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="admin-theme-button"
                aria-label="Chuyển đổi chế độ màu"
                title={`Chế độ hiện tại: ${currentTheme.label}`}
            >
                <CurrentIcon size={18} />
                <span className="admin-theme-label">{currentTheme.label}</span>
                <ChevronDown
                    size={14}
                    className={`admin-theme-chevron ${isOpen ? 'rotated' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="admin-theme-dropdown">
                    <div className="admin-theme-dropdown-header">
                        <span className="admin-theme-dropdown-title">Chọn chế độ màu</span>
                    </div>

                    {themes.map((themeOption) => {
                        const Icon = themeOption.icon;
                        const isActive = theme === themeOption.key;

                        return (
                            <button
                                key={themeOption.key}
                                onClick={() => {
                                    setTheme(themeOption.key);
                                    setIsOpen(false);
                                }}
                                className={`admin-theme-option ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={16} />
                                <span>{themeOption.label}</span>
                                {isActive && (
                                    <div className="admin-theme-check">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M20 6L9 17L4 12"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}

                    <div className="admin-theme-dropdown-footer">
                        <span className="admin-theme-info">
                            Hiện tại: {resolvedTheme === 'dark' ? 'Tối' : 'Sáng'}
                        </span>
                    </div>
                </div>
            )}

            {/* Backdrop để đóng dropdown */}
            {isOpen && (
                <div
                    className="admin-theme-backdrop"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
} 