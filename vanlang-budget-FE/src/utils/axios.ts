import axios from 'axios';
import Cookies from 'js-cookie';

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 giây
});

// Thêm interceptor request
axiosInstance.interceptors.request.use(
    (config) => {
        // Lấy token từ cookie - kiểm tra cả hai tên cookie có thể được sử dụng
        const token = Cookies.get('token') || Cookies.get('auth_token');

        // Nếu không có token trong cookie, thử lấy từ localStorage
        const tokenFromLocalStorage = typeof window !== 'undefined' ?
            localStorage.getItem('token') || localStorage.getItem('auth_token') : null;

        // Sử dụng token từ bất kỳ nguồn nào có sẵn
        const finalToken = token || tokenFromLocalStorage;

        console.log('axios interceptor - token check:', {
            cookieToken: token ? 'Có' : 'Không',
            localStorageToken: tokenFromLocalStorage ? 'Có' : 'Không',
            finalToken: finalToken ? 'Có' : 'Không'
        });

        // Nếu có token, thêm vào header
        if (finalToken) {
            config.headers.Authorization = `Bearer ${finalToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Thêm interceptor response
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Xử lý các lỗi response
        if (error.response) {
            const { status } = error.response;

            // Nếu token hết hạn hoặc không hợp lệ
            if (status === 401) {
                console.log('Lỗi 401 - Unauthorized, xóa token và thông tin đăng nhập');

                // Xóa tất cả các token và thông tin đăng nhập
                Cookies.remove('token');
                Cookies.remove('auth_token');

                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_role');
                    localStorage.removeItem('user_email');
                    localStorage.removeItem('user_name');
                }

                // Nếu không phải trang đăng nhập và không phải trang admin, chuyển hướng người dùng đến trang đăng nhập
                if (typeof window !== 'undefined' &&
                    !window.location.pathname.includes('/login') &&
                    !window.location.pathname.includes('/admin')) {

                    // Thêm delay để tránh chuyển hướng quá nhanh và nhiều lần
                    if (!localStorage.getItem('redirecting_to_login')) {
                        localStorage.setItem('redirecting_to_login', 'true');

                        setTimeout(() => {
                            window.location.href = '/login';
                            // Xóa flag sau khi chuyển hướng
                            setTimeout(() => {
                                localStorage.removeItem('redirecting_to_login');
                            }, 1000);
                        }, 500);
                    }
                }
            }

            // Xử lý các mã lỗi khác
            if (status === 403) {
                console.error('Bạn không có quyền truy cập tài nguyên này');
            }

            if (status === 429) {
                console.error('Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
            }
        } else if (error.request) {
            // Yêu cầu đã được gửi nhưng không nhận được phản hồi
            console.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.');
        } else {
            // Có lỗi khi thiết lập yêu cầu
            console.error('Đã xảy ra lỗi', error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;