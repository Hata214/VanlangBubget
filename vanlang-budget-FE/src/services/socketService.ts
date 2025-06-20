import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { formatTokenForHeader, API_URL, TOKEN_COOKIE_NAME, getToken } from './api';
import { SocketEvent } from '@/types/socket';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();
    private anyListeners: ((event: string, ...args: any[]) => void)[] = [];

    // Khởi tạo kết nối socket
    connect(token?: string) {
        if (this.socket && this.socket.connected) {
            console.log('Socket đã kết nối, không cần khởi tạo lại')
            return;
        }

        // Lấy token từ api.ts nếu không được cung cấp
        if (!token) {
            const authToken = getToken();
            token = authToken || undefined;
            console.log('Getting token for socket:', token ? 'Found token' : 'No token found');
        }

        if (!token) {
            console.error('No token available for socket connection');
            return;
        }

        // Đảm bảo token có định dạng chuỗi đơn giản không có Bearer prefix
        let cleanToken = token;

        try {
            // Thử parse token nếu là JSON
            if (typeof token === 'string' && token.startsWith('{') && token.includes('accessToken')) {
                const parsedToken = JSON.parse(token);
                if (parsedToken?.accessToken) {
                    cleanToken = parsedToken.accessToken;
                }
            }

            // Loại bỏ dấu ngoặc kép nếu có
            if (typeof cleanToken === 'string' && cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
                cleanToken = cleanToken.substring(1, cleanToken.length - 1);
            }

            // Loại bỏ Bearer prefix nếu có
            if (typeof cleanToken === 'string' && cleanToken.startsWith('Bearer ')) {
                cleanToken = cleanToken.substring(7);
            }
        } catch (error) {
            console.error('Error parsing token:', error);
        }

        // Sử dụng API_URL từ api.ts cho socket URL
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || API_URL;
        console.log('Connecting to socket URL:', socketUrl);
        console.log('Using token for socket connection:', cleanToken ? `${typeof cleanToken === 'string' ? cleanToken.substring(0, 10) : cleanToken}...` : 'invalid');

        this.socket = io(socketUrl, {
            auth: {
                token: cleanToken  // Sử dụng token đã được làm sạch
            },
            transports: ['websocket', 'polling'], // Thêm polling fallback
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 20000, // Tăng timeout
            forceNew: true  // Force tạo connection mới
        });

        console.log('Socket connection initialized');

        // Thiết lập các sự kiện mặc định
        this.socket.on(SocketEvent.CONNECT, () => {
            console.log('Socket connected successfully, socket ID:', this.socket?.id);
        });

        this.socket.on(SocketEvent.DISCONNECT, (reason) => {
            console.log(`Socket disconnected: ${reason}`);
        });

        this.socket.on(SocketEvent.CONNECTION_ERROR, (error) => {
            console.error('Socket connection error:', error);
            // Hiển thị thông tin chi tiết hơn về lỗi
            if (error && error.message) {
                console.error('Socket error details:', error.message);
            }

            // Thử kết nối lại sau 5 giây nếu lỗi xác thực
            if (error && error.message && error.message.includes('Authentication')) {
                setTimeout(() => {
                    console.log('Attempting to reconnect socket...');
                    this.disconnect();
                    // Lấy lại token mới nhất từ cookie khi thử kết nối lại
                    const freshToken = Cookies.get('token');
                    this.connect(freshToken);
                }, 5000);
            }
        });

        // Kích hoạt lại các listener đã đăng ký trước đó nếu có
        this.reattachListeners();
    }

    // Đóng kết nối socket
    disconnect() {
        if (!this.socket) return;
        this.socket.disconnect();
        this.socket = null;
        console.log('Socket disconnected');
    }

    // Đăng ký một sự kiện
    on(event: string, callback: (...args: any[]) => void) {
        // Lưu trữ listener
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);

        // Đính kèm listener vào socket nếu đã kết nối
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Hủy đăng ký một sự kiện
    off(event: string, callback?: (...args: any[]) => void) {
        if (!this.socket) return;

        if (callback) {
            // Xóa một listener cụ thể
            const callbacks = this.listeners.get(event) || [];
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
                this.socket.off(event, callback);
            }
        } else {
            // Xóa tất cả listeners cho sự kiện này
            this.socket.off(event);
            this.listeners.delete(event);
        }
    }

    // Gửi một sự kiện đến server
    emit(event: string, ...args: any[]) {
        if (!this.socket) {
            console.error('Cannot emit event: socket not connected');
            return;
        }

        // Đảm bảo các arguments không null trước khi emit
        const safeArgs = args.map(arg => arg === null ? undefined : arg);
        this.socket.emit(event, ...safeArgs);
    }

    // Đăng ký một handler để bắt tất cả các sự kiện - hữu ích cho debug
    onAny(listener: (event: string, ...args: any[]) => void) {
        if (!this.socket) {
            // Lưu listener để gắn sau khi kết nối
            this.anyListeners.push(listener);
            return;
        }

        // Sử dụng socket.io onAny (chỉ có ở phiên bản mới)
        if (typeof this.socket.onAny === 'function') {
            this.socket.onAny(listener);
        } else {
            console.warn('Socket.io phiên bản hiện tại không hỗ trợ onAny');
            // Thêm vào danh sách anyListeners để sử dụng sau
            this.anyListeners.push(listener);
        }
    }

    // Hủy đăng ký một handler bắt tất cả các sự kiện
    offAny(listener?: (event: string, ...args: any[]) => void) {
        if (!this.socket) return;

        if (typeof this.socket.offAny === 'function') {
            if (listener) {
                this.socket.offAny(listener);

                // Xóa khỏi danh sách lưu trữ
                const index = this.anyListeners.indexOf(listener);
                if (index !== -1) {
                    this.anyListeners.splice(index, 1);
                }
            } else {
                // Xóa tất cả any listeners
                this.socket.offAny();
                this.anyListeners = [];
            }
        } else {
            console.warn('Socket.io phiên bản hiện tại không hỗ trợ offAny');
            if (listener) {
                const index = this.anyListeners.indexOf(listener);
                if (index !== -1) {
                    this.anyListeners.splice(index, 1);
                }
            } else {
                this.anyListeners = [];
            }
        }
    }

    // Gắn lại tất cả listeners (hữu ích khi kết nối lại)
    private reattachListeners() {
        if (!this.socket) return;

        // Gắn lại các event listeners
        this.listeners.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                this.socket?.on(event, callback);
            });
        });

        // Gắn lại các any listeners
        if (typeof this.socket.onAny === 'function') {
            this.anyListeners.forEach(listener => {
                this.socket?.onAny(listener);
            });
        }
    }

    // Kiểm tra xem socket đã kết nối chưa
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Singleton instance
export const socketService = new SocketService();

// Export socketService as default
export default socketService;

// Re-export SocketEvent for convenience
export { SocketEvent } from '@/types/socket';