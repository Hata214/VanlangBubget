import axios from 'axios'
import {
    getToken,
    refreshToken,
    TOKEN_COOKIE_NAME,
    removeTokens
} from '../services/api'

// Hàm đảm bảo token có tiền tố "Bearer "
const formatTokenForHeader = (token: string) => {
    if (!token) return '';

    // Nếu token đã có tiền tố "Bearer ", trả về nguyên bản
    if (token.startsWith('Bearer ')) {
        return token;
    }

    // Nếu không, thêm tiền tố
    return `Bearer ${token}`;
}

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

// Log thông tin API URL để debug
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

instance.interceptors.request.use(
    (config) => {
        const token = getToken(); // Sử dụng hàm getToken từ api.ts
        if (token) {
            const formattedToken = formatTokenForHeader(token);
            config.headers.Authorization = formattedToken;
            console.log('Adding token to request:', formattedToken.substring(0, 15) + '...');
        }

        // Log URL gửi request để debug
        console.log(`Sending ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);

        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
)

instance.interceptors.response.use(
    (response) => {
        // Chuyển đổi trường read thành isRead cho các Notification trong response
        // Xử lý khi response.data là một mảng notification
        if (response.data && Array.isArray(response.data) && response.data.length > 0 &&
            (response.data[0].type || response.data[0].read !== undefined)) {
            response.data = response.data.map((item: any) => {
                if (item.read !== undefined && item.isRead === undefined) {
                    return { ...item, isRead: item.read };
                }
                return item;
            });
        }

        // Xử lý khi response.data.data là một mảng notification
        if (response.data && response.data.data && Array.isArray(response.data.data) &&
            response.data.data.length > 0 &&
            (response.data.data[0].type || response.data.data[0].read !== undefined)) {
            response.data.data = response.data.data.map((item: any) => {
                if (item.read !== undefined && item.isRead === undefined) {
                    return { ...item, isRead: item.read };
                }
                return item;
            });
        }

        // Xử lý khi response.data là một Notification đơn lẻ
        if (response.data && !Array.isArray(response.data) &&
            (response.data.type || response.data.read !== undefined)) {
            if (response.data.read !== undefined && response.data.isRead === undefined) {
                response.data = { ...response.data, isRead: response.data.read };
            }
        }

        return response;
    },
    async (error) => {
        // Log chi tiết lỗi để debug
        console.error('API Error:', error.response?.status, error.response?.data || error.message);
        console.error('Request URL was:', error.config?.url);

        // Xử lý lỗi 401 Unauthorized
        if (error.response?.status === 401 && !error.config._retry) {
            error.config._retry = true;
            try {
                // Thử refresh token
                const newToken = await refreshToken();

                if (newToken) {
                    // Cập nhật token trong header và thử lại request
                    error.config.headers.Authorization = `Bearer ${newToken}`;
                    return instance(error.config);
                } else {
                    // Nếu không thể refresh token, đăng xuất và chuyển hướng
                    removeTokens();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
            } catch (refreshError) {
                console.error('Lỗi khi refresh token:', refreshError);
                removeTokens();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
)

export default instance 