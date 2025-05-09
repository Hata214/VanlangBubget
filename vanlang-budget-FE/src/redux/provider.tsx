'use client'

import { Provider } from 'react-redux'
import { store } from '@/redux/store'
import { useEffect } from 'react'
import { setCredentials } from './features/authSlice'
import { authService } from '@/services/authService'
import api from '@/services/api'
import { NotificationHandler } from '@/components/notification/NotificationHandler'

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Kiểm tra token trong cookie và khôi phục trạng thái đăng nhập
        const initializeAuth = async () => {
            try {
                // Kiểm tra nếu đang ở trang đăng nhập hoặc đăng ký thì không cần khôi phục
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/login') || currentPath.includes('/register')) {
                        console.log('Đang ở trang đăng nhập/đăng ký, bỏ qua việc khôi phục trạng thái');
                        return;
                    }
                }

                const token = authService.getToken();
                console.log('Initializing auth with token:', token);

                if (token) {
                    // Gọi API lấy thông tin người dùng từ token
                    console.log('Fetching user data...');
                    const response = await api.get('/api/auth/me');
                    console.log('User data response:', response.data);

                    if (response.data && response.data.user) {
                        console.log('Setting user credentials in Redux store:', response.data.user);
                        // Thiết lập thông tin đăng nhập trong Redux store
                        store.dispatch(setCredentials({
                            user: response.data.user,
                            token: typeof token === 'string'
                                ? { accessToken: token, refreshToken: '' }
                                : token
                        }));
                    } else {
                        console.error('Response data structure incorrect:', response.data);
                    }
                }
            } catch (error: any) {
                console.error('Lỗi khi khôi phục trạng thái đăng nhập:', error);
                console.error('Error response:', error.response?.data);
                // Nếu có lỗi, xóa token
                authService.logout().catch(err => {
                    console.error('Lỗi khi logout sau khi khôi phục thất bại:', err);
                });
            }
        };

        initializeAuth();
    }, []);

    return (
        <Provider store={store}>
            <NotificationHandler />
            {children}
        </Provider>
    )
} 