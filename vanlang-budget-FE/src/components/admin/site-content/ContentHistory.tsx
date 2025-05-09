import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/redux/hooks';

interface ContentHistoryProps {
    contentType: string;
    onRestore?: () => void;
}

export default function ContentHistory({ contentType, onRestore }: ContentHistoryProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';

    useEffect(() => {
        fetchHistory();
    }, [contentType]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await siteContentService.getContentHistory(contentType);
            setHistory(response.data || []);
        } catch (error) {
            console.error(`Lỗi khi tải lịch sử nội dung ${contentType}:`, error);
            toast.error('Không thể tải lịch sử nội dung');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (version: number) => {
        if (!isSuperAdmin) {
            toast.error('Chỉ SuperAdmin mới có quyền khôi phục nội dung');
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn khôi phục nội dung phiên bản ${version}?`)) {
            try {
                setRestoring(true);
                await siteContentService.restoreContentVersion(contentType, version);
                toast.success('Khôi phục nội dung thành công');

                // Làm mới lịch sử
                fetchHistory();

                if (onRestore) {
                    onRestore();
                }
            } catch (error) {
                console.error(`Lỗi khi khôi phục nội dung ${contentType} phiên bản ${version}:`, error);
                toast.error('Không thể khôi phục nội dung');
            } finally {
                setRestoring(false);
            }
        }
    };

    const toggleExpandVersion = (version: number) => {
        if (expandedVersion === version) {
            setExpandedVersion(null);
        } else {
            setExpandedVersion(version);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return {
                full: new Date(date).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                relative: formatDistanceToNow(date, {
                    addSuffix: true,
                    locale: vi
                })
            };
        } catch {
            return { full: 'N/A', relative: 'N/A' };
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" />Đã xuất bản
                    </span>
                );
            case 'draft':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Clock size={12} className="mr-1" />Bản nháp
                    </span>
                );
            case 'pending_review':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertTriangle size={12} className="mr-1" />Chờ duyệt
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle size={12} className="mr-1" />Bị từ chối
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {status || 'N/A'}
                    </span>
                );
        }
    };

    const renderContent = (content: any) => {
        if (!content) return <div className="text-gray-500 italic">Không có nội dung</div>;

        if (typeof content === 'object') {
            return (
                <div className="space-y-2 text-sm">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key} className="mb-2">
                            <span className="font-medium">{key}: </span>
                            {typeof value === 'object' ? (
                                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>
                            ) : typeof value === 'string' && (value as string).length > 50 ? (
                                <div className="text-gray-600 truncate">{String(value).substring(0, 50)}...</div>
                            ) : (
                                <span className="text-gray-600">{String(value)}</span>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        return <div className="text-gray-600">{String(content)}</div>;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Không có lịch sử chỉnh sửa</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium mb-4">Lịch sử chỉnh sửa</h3>

            <div className="space-y-4">
                {history.map((item, index) => {
                    const date = formatDate(item.updatedAt);
                    return (
                        <div key={index} className="border rounded-md overflow-hidden bg-white">
                            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center">
                                        <span className="font-medium">Phiên bản {item.version}</span>
                                        <span className="mx-2">•</span>
                                        {renderStatusBadge(item.status)}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        <span className="inline-flex items-center">
                                            <Clock size={14} className="mr-1" />
                                            <span title={date.full}>{date.relative}</span>
                                        </span>
                                        {item.updatedBy && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <span className="inline-flex items-center">
                                                    <User size={14} className="mr-1" />
                                                    {typeof item.updatedBy === 'object' ? (
                                                        <span>{item.updatedBy.email || 'Người dùng không xác định'}</span>
                                                    ) : (
                                                        <span>UserID: {item.updatedBy}</span>
                                                    )}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {isSuperAdmin && index > 0 && (
                                        <button
                                            onClick={() => handleRestore(item.version)}
                                            disabled={restoring}
                                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded flex items-center text-sm"
                                            title="Khôi phục phiên bản này"
                                        >
                                            <RotateCcw size={16} className="mr-1" />
                                            <span>Khôi phục</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toggleExpandVersion(item.version)}
                                        className="text-gray-500 hover:text-gray-700 p-1 rounded text-sm"
                                    >
                                        {expandedVersion === item.version ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                    </button>
                                </div>
                            </div>

                            {expandedVersion === item.version && (
                                <div className="p-4">
                                    <div className="border rounded-md p-3 bg-gray-50">
                                        {renderContent(item.content)}
                                    </div>

                                    {item.reason && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-100">
                                            <h4 className="text-sm font-medium text-red-800">Lý do từ chối:</h4>
                                            <p className="text-sm text-red-700 mt-1">{item.reason}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 