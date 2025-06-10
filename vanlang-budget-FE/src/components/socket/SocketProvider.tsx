'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { socketService, SocketEvent, useSocket } from '@/services/socketService'
import { useAppSelector } from '@/redux/hooks'
import Cookies from 'js-cookie'

// Định nghĩa kiểu dữ liệu cho context
type SocketContextType = {
    isConnected: boolean
}

// Tạo context
const SocketContext = createContext<SocketContextType>({
    isConnected: false
})

// Hook để sử dụng socket context
export const useSocketContext = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const auth = useAppSelector((state) => state.auth)
    const token = auth.token || Cookies.get('token')
    const { isConnected } = useSocket(token)
    const [notifications, setNotifications] = useState<any[]>([])

    // Tự động tham gia room của user sau khi kết nối thành công
    useEffect(() => {
        if (isConnected && auth.user && auth.user.id) {
            // Gửi ID người dùng để tham gia room tương ứng
            const userId = String(auth.user.id);
            console.log('Attempting to join room for user:', userId);
            socketService.emit('join', userId)
            console.log('Joined user room:', userId)
        }
    }, [isConnected, auth.user])

    // Xử lý các sự kiện socket
    useEffect(() => {
        if (!token) {
            console.log('No token available for socket events');
            return;
        }

        // Log thông tin token để debug
        console.log('Socket auth token type:', typeof token);
        console.log('Socket auth token length:', token?.length);

        console.log('Setting up socket event handlers...');

        // Xử lý sự kiện nhận thông báo mới
        const handleNewNotification = (notification: any) => {
            console.log('New notification received:', notification);
            setNotifications((prev) => [notification, ...prev])

            // TODO: Thêm code hiển thị thông báo popup hoặc toast ở đây
        }

        // Đăng ký các sự kiện
        socketService.on(SocketEvent.NOTIFICATION_CREATE, handleNewNotification)

        // Xử lý các sự kiện khác nếu cần
        socketService.on(SocketEvent.BUDGET_UPDATE, (data) => console.log('Budget updated:', data))
        socketService.on(SocketEvent.EXPENSE_CREATE, (data) => console.log('New expense:', data))
        socketService.on(SocketEvent.INCOME_CREATE, (data) => console.log('New income:', data))

        return () => {
            // Hủy đăng ký các sự kiện khi component unmount
            console.log('Cleaning up socket event handlers');
            socketService.off(SocketEvent.NOTIFICATION_CREATE, handleNewNotification)
            socketService.off(SocketEvent.BUDGET_UPDATE)
            socketService.off(SocketEvent.EXPENSE_CREATE)
            socketService.off(SocketEvent.INCOME_CREATE)
        }
    }, [token])

    // Ngắt kết nối khi không có token
    useEffect(() => {
        if (!token && socketService.isConnected()) {
            console.log('No token available, disconnecting socket');
            socketService.disconnect()
        }
    }, [token])

    return (
        <SocketContext.Provider value={{ isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}
