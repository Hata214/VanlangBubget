import axios, { AxiosResponse } from 'axios'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'

// Constants cho các cookie name
export const TOKEN_COOKIE_NAME = 'token' // Thay đổi từ 'jwt' thành 'token' để phù hợp với AuthContext
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'

// Export API URL cho các services khác sử dụng
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Log thông tin API URL khi khởi tạo module
console.log('API Service Initialized - URL:', API_URL);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Biến kiểm soát khởi động lại
export const INITIALIZATION_TIME = new Date().toISOString();

// Các tùy chọn cho cookie - export để các module khác có thể sử dụng
export const cookieOptions = {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
}

// Hàm đảm bảo token có tiền tố "Bearer "
export const formatTokenForHeader = (token: string): string => {
    if (!token) return '';

    // Nếu token đã có tiền tố "Bearer ", trả về nguyên bản
    if (token.startsWith('Bearer ')) {
        return token;
    }

    // Nếu không, thêm tiền tố
    return `Bearer ${token}`;
}

// Instance axios có sẵn baseURL và withCredentials
const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Cho phép gửi cookies trong các request cross-origin
})

// Lưu token vào cookie và localStorage để bảo đảm persistence
export const saveTokenToCookie = (token: string | object, refreshToken?: string) => {
    try {
        // Xử lý token là object hoặc string
        let tokenString = typeof token === 'string' ? token : JSON.stringify(token);
        let tokenObject: any = typeof token === 'string' ? { accessToken: token } : token;

        // Nếu có cả token và refreshToken, lưu dưới dạng object
        if (refreshToken) {
            tokenObject = {
                accessToken: typeof token === 'string' ? token : (token as any).accessToken || token,
                refreshToken: refreshToken
            };
            tokenString = JSON.stringify(tokenObject);
        }

        // Đảm bảo token có cấu trúc đúng
        if (typeof tokenObject === 'object' && !tokenObject.accessToken && tokenObject.token) {
            tokenObject = {
                accessToken: tokenObject.token,
                refreshToken: tokenObject.refreshToken || refreshToken || ''
            };
            tokenString = JSON.stringify(tokenObject);
        }

        // Lưu token chính
        setCookie(TOKEN_COOKIE_NAME, tokenString, cookieOptions);
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_COOKIE_NAME, tokenString);
            // Đảm bảo token sẽ tồn tại sau khi tải lại trang
            sessionStorage.setItem(TOKEN_COOKIE_NAME, tokenString);
        }

        // Đảm bảo token được set cho axios
        if (tokenObject.accessToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${tokenObject.accessToken}`;
        }

        console.log('Đã lưu token thành công vào cả cookie và localStorage');
    } catch (error) {
        console.error('Lỗi khi lưu token:', error);
    }
}

// Lấy token từ cookie hoặc localStorage, kiểm tra cả hai nơi lưu trữ
export const getToken = (): string | null => {
    try {
        // Biến để theo dõi đang ở trang đăng nhập hay đăng xuất
        const isLoginPage = typeof window !== 'undefined' &&
            (window.location.pathname.includes('/login') || window.location.pathname.includes('/register'));

        // Kiểm tra cookie trước
        const tokenFromCookie = getCookie(TOKEN_COOKIE_NAME) as string | null;
        let tokenFromLocalStorage = null;
        let tokenFromSession = null;

        // Kiểm tra localStorage và sessionStorage
        if (typeof window !== 'undefined') {
            tokenFromLocalStorage = localStorage.getItem(TOKEN_COOKIE_NAME);
            tokenFromSession = sessionStorage.getItem(TOKEN_COOKIE_NAME);
        }

        // Ưu tiên token từ cookie
        if (tokenFromCookie) {
            console.log('Lấy token từ cookie thành công');

            // Đồng bộ với localStorage và sessionStorage nếu chưa có
            if (typeof window !== 'undefined' && !tokenFromLocalStorage) {
                localStorage.setItem(TOKEN_COOKIE_NAME, tokenFromCookie);
            }
            if (typeof window !== 'undefined' && !tokenFromSession) {
                sessionStorage.setItem(TOKEN_COOKIE_NAME, tokenFromCookie);
            }

            return tokenFromCookie;
        }

        // Kiểm tra localStorage nếu không có trong cookie
        if (tokenFromLocalStorage) {
            // Đồng bộ lại cookie từ localStorage
            setCookie(TOKEN_COOKIE_NAME, tokenFromLocalStorage, cookieOptions);
            console.log('Lấy token từ localStorage thành công, đã đồng bộ vào cookie');

            // Đồng bộ với sessionStorage nếu chưa có
            if (typeof window !== 'undefined' && !tokenFromSession) {
                sessionStorage.setItem(TOKEN_COOKIE_NAME, tokenFromLocalStorage);
            }

            return tokenFromLocalStorage;
        }

        // Kiểm tra sessionStorage nếu không có ở các nơi khác
        if (tokenFromSession) {
            // Đồng bộ lại cookie và localStorage từ sessionStorage
            setCookie(TOKEN_COOKIE_NAME, tokenFromSession, cookieOptions);
            if (typeof window !== 'undefined') {
                localStorage.setItem(TOKEN_COOKIE_NAME, tokenFromSession);
            }
            console.log('Lấy token từ sessionStorage thành công, đã đồng bộ vào cookie và localStorage');
            return tokenFromSession;
        }

        // Chỉ hiển thị thông báo khi không ở trang đăng nhập/đăng ký
        if (!isLoginPage) {
            console.warn('Không tìm thấy token trong cả cookie, localStorage và sessionStorage');
        }
        return null;
    } catch (error) {
        console.error('Lỗi khi lấy token:', error);
        return null;
    }
}

// Lấy refresh token từ cookie hoặc localStorage
export const getRefreshToken = (): string | null => {
    try {
        // Kiểm tra cookie trước
        const refreshTokenFromCookie = getCookie(REFRESH_TOKEN_COOKIE_NAME) as string | null

        if (refreshTokenFromCookie) {
            return refreshTokenFromCookie
        }

        // Kiểm tra localStorage nếu không có trong cookie
        const refreshTokenFromLocalStorage = localStorage.getItem(REFRESH_TOKEN_COOKIE_NAME)

        if (refreshTokenFromLocalStorage) {
            // Đồng bộ lại cookie từ localStorage
            setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenFromLocalStorage, cookieOptions)
            return refreshTokenFromLocalStorage
        }

        return null
    } catch (error) {
        console.error('Lỗi khi lấy refresh token:', error)
        return null
    }
}

// Xóa token và refresh token khi đăng xuất
export const removeTokens = () => {
    try {
        // Xóa khỏi cookies
        deleteCookie(TOKEN_COOKIE_NAME)
        deleteCookie(REFRESH_TOKEN_COOKIE_NAME)

        // Xóa khỏi localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_COOKIE_NAME)
            localStorage.removeItem(REFRESH_TOKEN_COOKIE_NAME)
            // Xóa thêm từ sessionStorage
            sessionStorage.removeItem(TOKEN_COOKIE_NAME)
            sessionStorage.removeItem(REFRESH_TOKEN_COOKIE_NAME)
        }

        // Xóa Authorization header trong instance axios
        delete instance.defaults.headers.common['Authorization']
        // Xóa Authorization header trong axios global
        delete axios.defaults.headers.common['Authorization']

        console.log('Đã xóa token thành công từ tất cả nguồn')
    } catch (error) {
        console.error('Lỗi khi xóa token:', error)
    }
}

// Cải thiện hàm refreshToken để sử dụng constant và xử lý lỗi tốt hơn
export const refreshToken = async (): Promise<string | null> => {
    try {
        const refreshTokenValue = getRefreshToken()

        if (!refreshTokenValue) {
            console.error('Không tìm thấy refresh token')
            removeTokens()
            return null
        }

        console.log('Đang thực hiện refresh token...')
        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
            refreshToken: refreshTokenValue
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        console.log('Refresh token response:', response.status, response.statusText)

        if (response.data && response.data.jwt) {
            // Lưu token mới
            console.log('Đã nhận token mới, lưu...')
            saveTokenToCookie(response.data.jwt, response.data.refreshToken)
            return response.data.jwt
        }

        if (response.data && response.data.token) {
            // Trường hợp response trả về trong định dạng khác
            console.log('Đã nhận token mới (định dạng khác), lưu...')
            saveTokenToCookie(response.data.token.accessToken || response.data.token,
                response.data.token.refreshToken)
            return response.data.token.accessToken || response.data.token
        }

        console.error('Dữ liệu refresh token không hợp lệ:', response.data)
        return null
    } catch (error: any) {
        console.error('Lỗi khi refresh token:', error.message)
        if (error.response) {
            console.error('Chi tiết lỗi:', error.response.status, error.response.data)
        }
        removeTokens() // Xóa tất cả token khi refresh thất bại
        return null
    }
}

// Request interceptor để thêm token vào header
instance.interceptors.request.use(
    (config) => {
        // Không thêm token cho một số API đặc biệt
        const skipAuthAPIs = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
        ]

        // Kiểm tra và chỉnh sửa URL nếu cần
        let url = config.url || '';

        // Đảm bảo URL luôn bắt đầu bằng /api nếu là đường dẫn tương đối và chưa bắt đầu bằng /api
        if (!url.startsWith('/api') && !url.startsWith('http')) {
            url = `/api${url}`;
            config.url = url;
        }

        // Kiểm tra nếu URL là đường dẫn từ localhost:4000 mà chưa có /api
        if (url.includes('localhost:4000/') && !url.includes('localhost:4000/api')) {
            url = url.replace('localhost:4000/', 'localhost:4000/api/');
            config.url = url;
        }

        console.log(`API Request to: ${config.method?.toUpperCase()} ${config.url}`);

        const skipAuth = skipAuthAPIs.some(api => url.includes(api))

        if (skipAuth) {
            return config
        }

        const token = getToken()

        if (token) {
            config.headers['Authorization'] = formatTokenForHeader(token)
            console.log('Adding auth token to request');
        } else {
            console.log('No token available for request');
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Thêm response interceptor cho instance API
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Nếu không có originalRequest, trả về lỗi ngay lập tức
        if (!originalRequest) {
            return Promise.reject(error)
        }

        // Đặt biến để kiểm soát việc chuyển hướng
        let shouldRedirectToLogin = false;

        // Kiểm tra xem lỗi có phải 401 và chưa thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('Nhận lỗi 401, thử refresh token...')
            originalRequest._retry = true

            try {
                const newToken = await refreshToken()

                if (newToken) {
                    console.log('Token mới đã được tạo, thử lại request...')
                    // Cập nhật token trong header và thử lại request
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return instance(originalRequest)
                } else {
                    console.log('Không thể tạo token mới, đánh dấu để chuyển hướng tới trang đăng nhập')
                    shouldRedirectToLogin = true;
                }
            } catch (refreshError) {
                console.error('Lỗi khi thử refresh token:', refreshError)
                shouldRedirectToLogin = true;
            }
        }

        // Chỉ chuyển hướng đến trang đăng nhập nếu cần và không phải đang ở trang đăng nhập
        if (shouldRedirectToLogin && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;

            // Kiểm tra nếu không phải đang ở trang đăng nhập hoặc đăng ký
            if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
                console.log('Chuyển hướng đến trang đăng nhập do lỗi xác thực');
                // Ngăn việc chuyển hướng nhiều lần bằng cách kiểm tra localStorage
                if (!localStorage.getItem('redirecting_to_login')) {
                    localStorage.setItem('redirecting_to_login', 'true');

                    // Thêm delay để tránh chuyển hướng quá nhanh
                    setTimeout(() => {
                        window.location.href = '/login';
                        // Xóa flag sau khi chuyển hướng
                        setTimeout(() => {
                            localStorage.removeItem('redirecting_to_login');
                        }, 1000);
                    }, 500);
                }
            } else {
                console.log('Đang ở trang đăng nhập/đăng ký, không chuyển hướng lại');
            }
        }

        return Promise.reject(error)
    }
)

// Helper để lấy token từ cookie và định dạng cho header
export const getAuthHeader = () => {
    const token = getToken();
    if (!token) {
        console.warn('getAuthHeader: No token found');
        return {};
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

// Thêm hàm debug để test connection
export const testConnection = async () => {
    try {
        const token = getToken();
        console.log('Test Connection - Token hiện tại:', token ? `${token.substring(0, 15)}...` : 'Không có token');
        console.log('Test Connection - API URL:', API_URL);
        console.log('Test Connection - Khởi tạo thời gian:', INITIALIZATION_TIME);

        // Thử truy cập API không cần xác thực
        console.log('Đang kiểm tra kết nối API health check...');
        const response = await axios.get(`${API_URL}/api/health`, {
            timeout: 5000,
        });
        console.log('API health check thành công:', response.status, response.statusText, response.data);
        return {
            success: true,
            status: response.status,
            message: 'Kết nối thành công',
            data: response.data
        };
    } catch (error: any) {
        console.error('Không thể kết nối đến API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return {
            success: false,
            status: error.response?.status || 0,
            message: error.message,
            error: error
        };
    }
}

// Khởi động kiểm tra kết nối khi module được load
// Không block việc khởi tạo module, chỉ chạy ngầm
const checkInitialConnection = () => {
    setTimeout(() => {
        console.log('Đang chạy kiểm tra kết nối tự động...');
        testConnection()
            .then(result => {
                if (result.success) {
                    console.log('Kiểm tra kết nối tự động thành công:', result.status);
                } else {
                    console.warn('Kiểm tra kết nối tự động thất bại:', result.message);
                }
            })
            .catch(err => {
                console.error('Lỗi khi chạy kiểm tra kết nối tự động:', err);
            });
    }, 1000); // Delay 1s để đảm bảo môi trường đã sẵn sàng
};

// Chạy kiểm tra kết nối tự động nếu ở môi trường client
if (typeof window !== 'undefined') {
    checkInitialConnection();
}

// Export instance axios để các module khác có thể sử dụng
export default instance; 