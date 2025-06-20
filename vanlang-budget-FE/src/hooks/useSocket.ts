'use client';

import { useEffect, useState } from 'react';
import { socketService } from '@/services/socketService';
import { getToken } from '@/services/api';
import { SocketEvent } from '@/types/socket';

/**
 * React Hook để sử dụng Socket
 */
export function useSocket(token?: string | null) {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Sử dụng getToken từ api.ts để lấy token
        const authToken = token || getToken();

        if (authToken) {
            console.log('useSocket: Using token for connection');
            // Kết nối socket khi có token
            socketService.connect(authToken);

            // Theo dõi sự kiện kết nối
            const handleConnect = () => setIsConnected(true);
            const handleDisconnect = () => setIsConnected(false);

            socketService.on(SocketEvent.CONNECT, handleConnect);
            socketService.on(SocketEvent.DISCONNECT, handleDisconnect);

            // Cập nhật trạng thái kết nối ban đầu
            setIsConnected(socketService.isConnected());

            return () => {
                // Dọn dẹp
                socketService.off(SocketEvent.CONNECT, handleConnect);
                socketService.off(SocketEvent.DISCONNECT, handleDisconnect);
            };
        } else {
            console.log('useSocket: No token available');
        }
    }, [token]);

    return {
        socket: socketService,
        isConnected
    };
}
