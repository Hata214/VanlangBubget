'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function AdminThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

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

    const handleThemeToggle = () => {
        // Chỉ chuyển đổi giữa light và dark (không có system)
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={handleThemeToggle}
            className="admin-theme-toggle-button"
            aria-label="Chuyển đổi chế độ màu"
            title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
            <div className="admin-theme-icon-container">
                {isDark ? (
                    <Sun className="admin-theme-icon" size={18} />
                ) : (
                    <Moon className="admin-theme-icon" size={18} />
                )}
            </div>
            <span className="admin-theme-text">
                {isDark ? 'Sáng' : 'Tối'}
            </span>
        </button>
    );
} 