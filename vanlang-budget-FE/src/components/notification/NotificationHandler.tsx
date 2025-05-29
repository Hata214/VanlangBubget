'use client'

import { useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/redux/hooks'
import { socketService, SocketEvent } from '@/services/socketService'
import { fetchUnreadCount, addNotification, fetchNotifications } from '@/redux/features/notificationSlice'
import { fetchLoans } from '@/redux/features/loanSlice'
import { useToast } from '@/contexts/ToastContext'
import { getToken } from '@/services/api'

// Định nghĩa các loại thông báo hệ thống
const NOTIFICATION_TYPES = {
    INCOME_UPDATE: 'INCOME_UPDATE',
    INCOME_CREATE: 'INCOME_CREATE',
    EXPENSE_UPDATE: 'EXPENSE_UPDATE',
    EXPENSE_CREATE: 'EXPENSE_CREATE',
    LOAN_UPDATE: 'LOAN_UPDATE',
    LOAN_CREATE: 'LOAN_CREATE',
    INVESTMENT_UPDATE: 'INVESTMENT_UPDATE',
    INVESTMENT_CREATE: 'INVESTMENT_CREATE'
};

export function NotificationHandler() {
    const { token, user } = useAppSelector((state) => state.auth)
    const dispatch = useAppDispatch()
    const { success, info, error } = useToast()
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Hàm kết nối lại socket
    const reconnectSocket = () => {
        console.log('Thực hiện kết nối lại socket...')
        socketService.disconnect()
        const currentToken = getToken()
        if (currentToken) {
            socketService.connect(currentToken)
            console.log('Socket đã được kết nối lại thành công')
        } else {
            console.error('Không thể kết nối lại - không tìm thấy token')
        }
    }

    // Kiểm tra kết nối socket định kỳ
    useEffect(() => {
        if (!token || !user) return

        const checkConnection = () => {
            const isConnected = socketService.isConnected()
            console.log('Trạng thái kết nối socket:', isConnected ? 'Đã kết nối' : 'Đã mất kết nối')

            if (!isConnected) {
                console.log('Phát hiện mất kết nối, thử kết nối lại...')
                reconnectSocket()
            }
        }

        const interval = setInterval(checkConnection, 30000) // Kiểm tra mỗi 30 giây

        return () => clearInterval(interval)
    }, [token, user])

    // Đăng ký các sự kiện socket khi đã đăng nhập
    useEffect(() => {
        if (!token || !user) return

        // Chuyển đổi token sang string nếu cần thiết
        const safeToken = typeof token === 'string' ? token : undefined;
        if (!safeToken) return;

        // Khởi tạo socket khi component mount
        socketService.connect(safeToken)
        console.log('Socket được khởi tạo với token')

        // Thêm sự kiện kết nối thành công
        const handleConnectSuccess = () => {
            console.log('Socket kết nối thành công!')
            // Tham gia room của user khi kết nối thành công
            if (user._id) {
                const userId = String(user._id)
                socketService.emit('join', userId)
                console.log(`Đã tham gia vào room ${userId}`)
            }
        }

        // Thêm sự kiện kết nối lỗi
        const handleConnectError = (err: any) => {
            console.error('Lỗi kết nối socket:', err)
            error('Lỗi kết nối', 'Không thể kết nối đến máy chủ thông báo. Đang thử kết nối lại...')

            // Hủy bất kỳ timer nào đang chạy
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
            }

            // Thiết lập một timer mới để kết nối lại
            reconnectTimerRef.current = setTimeout(() => {
                reconnectSocket()
            }, 5000)
        }

        // Đăng ký các sự kiện kết nối
        socketService.on(SocketEvent.CONNECT, handleConnectSuccess)
        socketService.on(SocketEvent.CONNECTION_ERROR, handleConnectError)

        // Xử lý thông báo
        const handleNotification = (data: any) => {
            console.log('New notification received:', data)

            // Cập nhật số lượng thông báo chưa đọc
            dispatch(fetchUnreadCount())

            // Nếu có thông báo cụ thể, thêm vào Redux store
            if (data.notification) {
                const notificationData = {
                    ...data.notification,
                    id: data.notification._id || data.notification.id, // Đảm bảo có trường id
                    isRead: data.notification.read === false, // Chuyển đổi từ read sang isRead
                    createdAt: data.notification.createdAt || new Date().toISOString(),
                    updatedAt: data.notification.updatedAt || new Date().toISOString()
                };

                dispatch(addNotification(notificationData));

                // Tải lại danh sách thông báo để hiển thị trong trang notifications
                dispatch(fetchNotifications(1));
            }

            // Hiển thị toast thông báo
            if (data.notification && data.notification.title) {
                info(data.notification.title, data.notification.message || data.message)
            } else if (data.message) {
                info('Thông báo mới', data.message)
            }
        }

        // Xử lý thông báo thay đổi trạng thái khoản vay
        const handleLoanStatusChanged = (data: {
            loanId: string;
            oldStatus: string;
            newStatus: string;
            message?: string;
        }) => {
            console.log('Loan status changed event received:', data)

            // Tải lại danh sách khoản vay để cập nhật UI
            dispatch(fetchLoans())

            // Tải lại danh sách thông báo và số lượng thông báo chưa đọc
            dispatch(fetchNotifications(1))
            dispatch(fetchUnreadCount())

            // Hiển thị thông báo khi trạng thái khoản vay thay đổi
            const statusLabels: Record<string, string> = {
                'ACTIVE': 'Đang vay',
                'PAID': 'Đã trả',
                'OVERDUE': 'Quá hạn'
            }

            const oldStatusLabel = statusLabels[data.oldStatus] || data.oldStatus
            const newStatusLabel = statusLabels[data.newStatus] || data.newStatus

            const title = 'Trạng thái khoản vay đã thay đổi'
            const message = data.message ||
                `Khoản vay đã chuyển từ trạng thái ${oldStatusLabel} sang ${newStatusLabel}`

            // Hiển thị thông báo toast
            success(title, message)
        }

        // Tạo thông báo hệ thống và thêm vào notifications panel
        const createSystemNotification = (title: string, message: string, type: string) => {
            const notificationData = {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                title,
                message,
                type: type as any, // Sửa lỗi kiểu dữ liệu bằng cách ép kiểu
                isRead: false,
                userId: user._id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Thêm thông báo vào Redux store
            dispatch(addNotification(notificationData));

            // Cập nhật số lượng thông báo chưa đọc
            dispatch(fetchUnreadCount());

            // Tải lại danh sách thông báo
            dispatch(fetchNotifications(1));

            // Hiển thị toast thông báo
            return notificationData;
        };

        // Xử lý thông báo cập nhật thu nhập
        const handleIncomeUpdate = (data: any) => {
            console.log('Income updated:', data);

            // Cải thiện hiển thị thông tin chi tiết hơn từ dữ liệu nhận được
            let description = 'Dữ liệu thu nhập đã được cập nhật thành công.';
            if (data && data.description) {
                description = `Thu nhập "${data.description}" đã được cập nhật thành công.`;
            }

            const notification = createSystemNotification(
                'Cập nhật thu nhập thành công',
                description,
                NOTIFICATION_TYPES.INCOME_UPDATE
            );

            // Hiển thị thông báo toast và tải lại danh sách thu nhập nếu cần
            success(notification.title, notification.message);

            // Thêm log debug để xác nhận
            console.log('Đã xử lý sự kiện cập nhật thu nhập và tạo thông báo:', notification);
        }

        // Xử lý sự kiện 'income:update' theo định dạng thô
        const handleRawIncomeUpdate = (data: any) => {
            console.log('Raw income:update event received:', data);
            handleIncomeUpdate(data);
        }

        // Xử lý thông báo thêm thu nhập mới
        const handleIncomeCreate = (data: any) => {
            console.log('New income:', data);
            const notification = createSystemNotification(
                'Thêm thu nhập thành công',
                'Dữ liệu thu nhập mới đã được thêm thành công.',
                NOTIFICATION_TYPES.INCOME_CREATE
            );
            success(notification.title, notification.message);
        }

        // Xử lý thông báo cập nhật chi tiêu
        const handleExpenseUpdate = (data: any) => {
            console.log('Expense updated:', data);
            const notification = createSystemNotification(
                'Cập nhật chi tiêu thành công',
                'Dữ liệu chi tiêu đã được cập nhật thành công.',
                NOTIFICATION_TYPES.EXPENSE_UPDATE
            );
            success(notification.title, notification.message);
        }

        // Xử lý thông báo thêm chi tiêu mới
        const handleExpenseCreate = (data: any) => {
            console.log('New expense:', data);
            const notification = createSystemNotification(
                'Thêm chi tiêu thành công',
                'Dữ liệu chi tiêu mới đã được thêm thành công.',
                NOTIFICATION_TYPES.EXPENSE_CREATE
            );
            success(notification.title, notification.message);
        }

        // Xử lý thông báo cập nhật khoản vay
        const handleLoanUpdate = (data: any) => {
            console.log('Loan updated:', data);
            const notification = createSystemNotification(
                'Cập nhật khoản vay thành công',
                'Dữ liệu khoản vay đã được cập nhật thành công.',
                NOTIFICATION_TYPES.LOAN_UPDATE
            );
            success(notification.title, notification.message);
            dispatch(fetchLoans());
        }

        // Xử lý thông báo thêm khoản vay mới
        const handleLoanCreate = (data: any) => {
            console.log('New loan:', data);
            const notification = createSystemNotification(
                'Thêm khoản vay thành công',
                'Dữ liệu khoản vay mới đã được thêm thành công.',
                NOTIFICATION_TYPES.LOAN_CREATE
            );
            success(notification.title, notification.message);
            dispatch(fetchLoans());
        }

        // Xử lý thông báo cập nhật đầu tư
        const handleInvestmentUpdate = (data: any) => {
            console.log('Investment updated:', data);
            const notification = createSystemNotification(
                'Cập nhật đầu tư thành công',
                'Dữ liệu đầu tư đã được cập nhật thành công.',
                NOTIFICATION_TYPES.INVESTMENT_UPDATE
            );
            success(notification.title, notification.message);
        }

        // Xử lý thông báo thêm đầu tư mới
        const handleInvestmentCreate = (data: any) => {
            console.log('New investment:', data);
            const notification = createSystemNotification(
                'Thêm đầu tư thành công',
                'Dữ liệu đầu tư mới đã được thêm thành công.',
                NOTIFICATION_TYPES.INVESTMENT_CREATE
            );
            success(notification.title, notification.message);
        }

        // Sự kiện debug bắt tất cả các events
        const handleAllEvents = (eventName: string, ...args: any[]) => {
            console.log(`[DEBUG] Nhận được sự kiện socket '${eventName}':`, args);
        }

        // Đăng ký nhận các sự kiện
        socketService.on('notification', handleNotification)
        socketService.on(SocketEvent.LOAN_STATUS_CHANGED, handleLoanStatusChanged)
        socketService.on(SocketEvent.NOTIFICATION_CREATE, handleNotification)
        socketService.on(SocketEvent.BUDGET_UPDATE, (data) => {
            console.log('Budget updated:', data)
            // Tải lại thông báo khi có cập nhật ngân sách
            dispatch(fetchNotifications(1))
        })
        socketService.on(SocketEvent.EXPENSE_CREATE, handleExpenseCreate)
        socketService.on(SocketEvent.INCOME_CREATE, handleIncomeCreate)
        socketService.on(SocketEvent.LOAN_CREATE, handleLoanCreate)
        socketService.on(SocketEvent.LOAN_UPDATE, handleLoanUpdate)
        socketService.on(SocketEvent.EXPENSE_UPDATE, handleExpenseUpdate)
        socketService.on(SocketEvent.INCOME_UPDATE, handleIncomeUpdate)
        socketService.on(SocketEvent.INVESTMENT_UPDATE, handleInvestmentUpdate)
        socketService.on(SocketEvent.INVESTMENT_CREATE, handleInvestmentCreate)

        // Đăng ký thêm handler cho sự kiện raw 'income:update'
        socketService.on('income:update', handleRawIncomeUpdate)

        // Đăng ký bắt tất cả sự kiện cho mục đích debug
        socketService.onAny(handleAllEvents)

        // Cleanup khi unmount
        return () => {
            // Hủy timer nếu tồn tại
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }

            // Hủy đăng ký các sự kiện
            socketService.off(SocketEvent.CONNECT, handleConnectSuccess)
            socketService.off(SocketEvent.CONNECTION_ERROR, handleConnectError)
            socketService.off('notification', handleNotification)
            socketService.off(SocketEvent.LOAN_STATUS_CHANGED, handleLoanStatusChanged)
            socketService.off(SocketEvent.NOTIFICATION_CREATE, handleNotification)
            socketService.off(SocketEvent.BUDGET_UPDATE)
            socketService.off(SocketEvent.EXPENSE_CREATE, handleExpenseCreate)
            socketService.off(SocketEvent.INCOME_CREATE, handleIncomeCreate)
            socketService.off(SocketEvent.LOAN_CREATE, handleLoanCreate)
            socketService.off(SocketEvent.LOAN_UPDATE, handleLoanUpdate)
            socketService.off(SocketEvent.EXPENSE_UPDATE, handleExpenseUpdate)
            socketService.off(SocketEvent.INCOME_UPDATE, handleIncomeUpdate)
            socketService.off(SocketEvent.INVESTMENT_UPDATE, handleInvestmentUpdate)
            socketService.off(SocketEvent.INVESTMENT_CREATE, handleInvestmentCreate)
            socketService.off('income:update', handleRawIncomeUpdate)
            socketService.offAny(handleAllEvents)

            socketService.disconnect()
            console.log('Đã ngắt kết nối socket và xóa tất cả listeners')
        }
    }, [token, user, dispatch])

    // Component này không hiển thị gì, chỉ xử lý logic
    return null
} 