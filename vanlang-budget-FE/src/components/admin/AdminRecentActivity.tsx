'use client';

import React from 'react';
import { Eye, RefreshCw } from 'lucide-react';

interface RecentActivityItem {
    id: string;
    type: 'user' | 'transaction' | 'system';
    title: string;
    subtitle: string;
    time: string;
    status: 'success' | 'warning' | 'error' | 'info';
    avatar?: string;
}

interface AdminRecentActivityProps {
    title: string;
    items: RecentActivityItem[];
    loading?: boolean;
    onRefresh?: () => void;
    onViewAll?: () => void;
}

export function AdminRecentActivity({
    title,
    items,
    loading = false,
    onRefresh,
    onViewAll
}: AdminRecentActivityProps) {
    if (loading) {
        return (
            <div className="admin-recent-card">
                <div className="admin-recent-card-header">
                    <div className="flex items-center justify-between">
                        <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                        <div className="flex gap-2">
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
                <div className="admin-recent-card-content">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="admin-recent-item">
                            <div className="admin-recent-item-avatar skeleton">
                                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                            </div>
                            <div className="admin-recent-item-info flex-1">
                                <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                                <div className="w-40 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                            </div>
                            <div className="admin-recent-item-meta">
                                <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                                <div className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="admin-recent-card">
            <div className="admin-recent-card-header">
                <div className="flex items-center justify-between">
                    <h3 className="admin-recent-card-title">{title}</h3>
                    <div className="flex gap-2">
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Làm mới"
                            >
                                <RefreshCw size={16} />
                            </button>
                        )}
                        {onViewAll && (
                            <button
                                onClick={onViewAll}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Xem tất cả"
                            >
                                <Eye size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="admin-recent-card-content">
                {items.length === 0 ? (
                    <div className="admin-recent-item">
                        <div className="flex-1 text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                Không có hoạt động gần đây
                            </p>
                        </div>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="admin-recent-item">
                            <div className="admin-recent-item-avatar">
                                {item.avatar ? (
                                    <img
                                        src={item.avatar}
                                        alt={item.title}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <span>{item.title.charAt(0).toUpperCase()}</span>
                                )}
                            </div>

                            <div className="admin-recent-item-info">
                                <h4 className="admin-recent-item-name">{item.title}</h4>
                                <p className="admin-recent-item-detail">{item.subtitle}</p>
                            </div>

                            <div className="admin-recent-item-meta">
                                <p className="admin-recent-item-time">{item.time}</p>
                                <div className={`admin-recent-item-badge ${item.status}`}>
                                    {getStatusLabel(item.status)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function getStatusLabel(status: string): string {
    switch (status) {
        case 'success':
            return 'Thành công';
        case 'warning':
            return 'Cảnh báo';
        case 'error':
            return 'Lỗi';
        case 'info':
            return 'Thông tin';
        default:
            return 'Không xác định';
    }
} 