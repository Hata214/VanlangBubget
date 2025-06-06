import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import notificationService from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getToken } from '@/services/api';
import io from 'socket.io-client';
import { API_URL } from '@/services/api';
import Link from 'next/link';

interface Notification {
    id: string;
    _id?: string;
    type: string;
    message: string;
    isRead: boolean;
    read?: boolean;
    createdAt: string;
}

const NotificationBell: React.FC = () => {
    const t = useTranslations();
    const [items, setItems] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState<any>(null);
    const [lastFetched, setLastFetched] = useState<Date>(new Date());

    // Thêm debugging state
    const [debugInfo, setDebugInfo] = useState({
        lastFetchTime: '',
        socketConnected: false,
        lastError: '',
        apiResponse: {}
    });

    // Force re-fetch khi component mount và mỗi 15 giây
    useEffect(() => {
        // Fetch lần đầu ngay lập tức
        console.log('Component mounted, fetching notifications...');
        fetchNotifications();

        // Thiết lập interval ngắn hơn (15 giây) để kiểm tra thường xuyên
        const interval = setInterval(() => {
            console.log('Interval triggered, fetching notifications...');
            fetchNotifications();
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    // Khởi tạo socket connection
    useEffect(() => {
        console.log('Initializing socket...');
        initializeSocket();

        return () => {
            if (socket) {
                console.log('Disconnecting socket...');
                socket.disconnect();
            }
        };
    }, []);

    // Tính toán số thông báo chưa đọc từ items
    useEffect(() => {
        if (items.length > 0) {
            const count = items.filter(item => {
                // Kiểm tra cả hai trường để đảm bảo tương thích
                const notRead = item.isRead === false || item.read === false;
                return notRead;
            }).length;

            console.log(`Tính toán lại số thông báo chưa đọc: ${count} từ ${items.length} thông báo`);
            if (count !== unreadCount) {
                console.log('Cập nhật số thông báo chưa đọc:', count);
                setUnreadCount(count);
            }
        }
    }, [items]);

    const fetchNotifications = async () => {
        try {
            const startTime = new Date();
            setLoading(true);

            // Lưu thời gian fetch để debug
            setDebugInfo(prev => ({
                ...prev,
                lastFetchTime: startTime.toLocaleTimeString()
            }));

            console.log('Đang lấy thông báo từ server...');
            const response = await notificationService.getNotifications();
            console.log('Kết quả từ API:', response);

            // Lưu response để debug
            setDebugInfo(prev => ({
                ...prev,
                apiResponse: response
            }));

            if (Array.isArray(response)) {
                // Map response để đảm bảo format đúng
                const mappedItems = response.map((item: any) => ({
                    id: item._id || item.id || '',
                    _id: item._id || item.id || '',
                    type: item.type || 'INFO',
                    message: item.message || item.content || '',
                    isRead: item.isRead === false ? false : Boolean(item.isRead),
                    read: item.read === false ? false : Boolean(item.read),
                    createdAt: item.createdAt || new Date().toISOString()
                }));

                console.log('Đã xử lý dữ liệu:', mappedItems.length, 'thông báo');
                setItems(mappedItems);

                // Đếm số thông báo chưa đọc
                const unread = mappedItems.filter(item => {
                    return item.isRead === false || item.read === false;
                }).length;

                console.log('Số thông báo chưa đọc:', unread, '/', mappedItems.length);
                setUnreadCount(unread);
                setLastFetched(new Date());
            } else {
                console.warn('Dữ liệu không phải là mảng:', response);
            }
        } catch (error: any) {
            console.error('Lỗi khi lấy thông báo:', error);
            setDebugInfo(prev => ({
                ...prev,
                lastError: error.message || 'Unknown error'
            }));
        } finally {
            setLoading(false);
        }
    };

    const initializeSocket = () => {
        try {
            const token = getToken();
            console.log('Khởi tạo socket với token:', token ? 'Có token' : 'Không có token');

            const newSocket = io(API_URL, {
                auth: { token },
                transports: ['websocket']
            });

            newSocket.on('connect', () => {
                console.log('Socket đã kết nối thành công');
                setDebugInfo(prev => ({
                    ...prev,
                    socketConnected: true
                }));
            });

            newSocket.on('disconnect', () => {
                console.log('Socket đã ngắt kết nối');
                setDebugInfo(prev => ({
                    ...prev,
                    socketConnected: false
                }));
            });

            newSocket.on('newNotification', (notification: Notification) => {
                console.log('Nhận thông báo mới qua socket:', notification);
                // Thêm vào đầu danh sách và đánh dấu là chưa đọc
                const newNotification = {
                    ...notification,
                    isRead: false,
                    read: false
                };

                setItems(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Trigger hiệu ứng nhấp nháy
                const badge = document.querySelector('.notification-badge');
                if (badge) {
                    badge.classList.add('animate-pulse');
                    setTimeout(() => {
                        badge.classList.remove('animate-pulse');
                    }, 2000);
                }
            });

            // Lắng nghe các sự kiện khác
            newSocket.on('incomeAdded', () => {
                console.log('Nhận sự kiện thêm thu nhập mới, đang làm mới thông báo...');
                fetchNotifications();
            });

            newSocket.on('expenseAdded', () => {
                console.log('Nhận sự kiện thêm chi tiêu mới, đang làm mới thông báo...');
                fetchNotifications();
            });

            setSocket(newSocket);
        } catch (error: any) {
            console.error('Lỗi khi khởi tạo socket:', error);
            setDebugInfo(prev => ({
                ...prev,
                lastError: error.message || 'Unknown socket error'
            }));
        }
    };



    return (
        <div className="relative group">

            <div className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200 relative">
                <div className="flex items-center">
                    <div className="relative">
                        <svg
                            className="w-5 h-5 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <span className="text-sm font-medium">Thông báo</span>
                </div>
            </div>

            {/* Tooltip khi hover */}
            {unreadCount > 0 && (
                <div className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50">
                    {unreadCount} thông báo chưa đọc
                </div>
            )}
        </div>
    );
};

export default NotificationBell; 