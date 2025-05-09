import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, User, Clock, Eye } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/redux/hooks';

interface ContentApprovalProps {
    contentType: string;
    onApprove?: () => void;
    onReject?: () => void;
}

export default function ContentApproval({ contentType, onApprove, onReject }: ContentApprovalProps) {
    const [pendingContent, setPendingContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';

    useEffect(() => {
        if (contentType) {
            fetchPendingContent();
        }
    }, [contentType]);

    const fetchPendingContent = async () => {
        try {
            setLoading(true);
            // Lấy nội dung chờ duyệt
            const response = await siteContentService.getContentByType(contentType);
            const content = response.data;

            // Kiểm tra trạng thái chờ duyệt
            if (content?.meta?.status === 'pending_review') {
                setPendingContent(content);
            } else {
                setPendingContent(null);
            }
        } catch (error) {
            console.error(`Lỗi khi tải nội dung chờ duyệt ${contentType}:`, error);
            toast.error('Không thể tải nội dung chờ duyệt');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!isSuperAdmin) {
            toast.error('Chỉ SuperAdmin mới có quyền phê duyệt nội dung');
            return;
        }

        try {
            setProcessing(true);
            await siteContentService.approveHomepageContent();
            toast.success('Phê duyệt nội dung thành công');
            setPendingContent(null);

            if (onApprove) {
                onApprove();
            }
        } catch (error) {
            console.error('Lỗi khi phê duyệt nội dung:', error);
            toast.error('Không thể phê duyệt nội dung');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!isSuperAdmin) {
            toast.error('Chỉ SuperAdmin mới có quyền từ chối nội dung');
            return;
        }

        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            setProcessing(true);
            await siteContentService.rejectHomepageContent(rejectReason);
            toast.success('Từ chối nội dung thành công');
            setPendingContent(null);
            setShowRejectDialog(false);
            setRejectReason('');

            if (onReject) {
                onReject();
            }
        } catch (error) {
            console.error('Lỗi khi từ chối nội dung:', error);
            toast.error('Không thể từ chối nội dung');
        } finally {
            setProcessing(false);
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

    const renderContent = (content: any) => {
        if (!content?.data) return <div className="text-gray-500 italic">Không có nội dung</div>;

        return (
            <div className="space-y-2 text-sm">
                {Object.entries(content.data).map(([key, value]) => (
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
    };

    if (loading) {
        return (
            <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!pendingContent) {
        return null;
    }

    return (
        <div className="mb-8">
            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 mb-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Nội dung đang chờ phê duyệt</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>
                                {pendingContent.meta?.updatedBy ? (
                                    <>
                                        <span>Được cập nhật bởi </span>
                                        <span className="font-medium">{pendingContent.meta.updatedBy.email || 'Không xác định'}</span>
                                    </>
                                ) : 'Nội dung mới đang cần phê duyệt.'}

                                {pendingContent.meta?.updatedAt && (
                                    <>
                                        <span> vào </span>
                                        <span className="font-medium" title={formatDate(pendingContent.meta.updatedAt).full}>
                                            {formatDate(pendingContent.meta.updatedAt).relative}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {isSuperAdmin && (
                <div className="flex flex-wrap space-x-2 mb-4">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        {showPreview ? 'Ẩn nội dung' : 'Xem nội dung'}
                    </button>

                    <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Phê duyệt
                    </button>

                    <button
                        onClick={() => setShowRejectDialog(true)}
                        disabled={processing}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Từ chối
                    </button>
                </div>
            )}

            {showPreview && (
                <div className="border rounded-md p-4 bg-white">
                    <h4 className="text-sm font-medium mb-2">Nội dung chờ duyệt:</h4>
                    {renderContent(pendingContent)}
                </div>
            )}

            {showRejectDialog && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <h3 className="text-lg font-medium mb-4">Từ chối nội dung</h3>
                        <p className="mb-4 text-sm text-gray-500">Vui lòng nhập lý do từ chối để người chỉnh sửa hiểu được vấn đề.</p>

                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Nhập lý do từ chối..."
                            className="w-full border rounded-md p-2 mb-4 h-32"
                        />

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowRejectDialog(false)}
                                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>

                            <button
                                onClick={handleReject}
                                disabled={processing || !rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 