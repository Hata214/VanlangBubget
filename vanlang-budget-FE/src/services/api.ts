import axios from 'axios'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'

// Constants cho các cookie name
export const TOKEN_COOKIE_NAME = 'token' // Thay đổi từ 'jwt' thành 'token' để phù hợp với AuthContext
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'

// Export API URL cho các services khác sử dụng
// Ưu tiên NEXT_PUBLIC_API_BASE_URL, sau đó là NEXT_PUBLIC_API_URL, cuối cùng là fallback cho local dev
export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vanlangbubget.onrender.com';

// Log thông tin API URL khi khởi tạo module
console.log('API Service Initialized - Using API_URL:', API_URL);
console.log('NEXT_PUBLIC_API_BASE_URL (from env):', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('NEXT_PUBLIC_API_URL (from env):', process.env.NEXT_PUBLIC_API_URL);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Biến kiểm soát khởi động lại
export const INITIALIZATION_TIME = new Date().toISOString();

// Các tùy chọn cho cookie - export để các module khác có thể sử dụng
export const cookieOptions = {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
    sameSite: 'lax' as const, // Sử dụng 'lax' cho cả dev và production để tránh vấn đề CORS
    secure: process.env.NODE_ENV === 'production',
    // Không set domain để cookie hoạt động trên subdomain hiện tại
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
    baseURL: API_URL, // API_URL giờ đây sẽ ưu tiên NEXT_PUBLIC_API_BASE_URL
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Cho phép gửi cookies trong các request cross-origin
})

// Lưu token vào cookie và localStorage để bảo đảm persistence
export const saveTokenToCookie = (accessTokenInput: string | object, refreshTokenInput?: string) => {
    try {
        let accessToken: string;
        let refreshToken: string | undefined = refreshTokenInput;

        if (typeof accessTokenInput === 'object' && accessTokenInput !== null) {
            accessToken = (accessTokenInput as any).accessToken || (accessTokenInput as any).token || '';
            // If refreshTokenInput is not provided, try to get it from the object
            if (!refreshToken) {
                refreshToken = (accessTokenInput as any).refreshToken;
            }
        } else {
            accessToken = accessTokenInput as string;
        }

        if (!accessToken) {
            console.error('saveTokenToCookie: accessToken is missing.');
            return;
        }

        // Luôn lưu vào localStorage trước với error handling
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(TOKEN_COOKIE_NAME, accessToken);
                console.log('✅ Đã lưu access token vào localStorage:', accessToken.substring(0, 20) + '...');
            } catch (localStorageError) {
                console.error('❌ Lỗi khi lưu access token vào localStorage:', localStorageError);
            }

            try {
                sessionStorage.setItem(TOKEN_COOKIE_NAME, accessToken);
                console.log('✅ Đã lưu access token vào sessionStorage');
            } catch (sessionStorageError) {
                console.error('❌ Lỗi khi lưu access token vào sessionStorage:', sessionStorageError);
            }

            // Lưu refresh token nếu có
            if (refreshToken) {
                try {
                    localStorage.setItem(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
                    console.log('✅ Đã lưu refresh token vào localStorage:', refreshToken.substring(0, 20) + '...');
                } catch (localStorageError) {
                    console.error('❌ Lỗi khi lưu refresh token vào localStorage:', localStorageError);
                }

                try {
                    sessionStorage.setItem(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
                    console.log('✅ Đã lưu refresh token vào sessionStorage');
                } catch (sessionStorageError) {
                    console.error('❌ Lỗi khi lưu refresh token vào sessionStorage:', sessionStorageError);
                }
            } else {
                console.warn('⚠️ Không có refresh token để lưu!');
            }
        } else {
            console.warn('⚠️ Window object không có sẵn, không thể lưu vào storage');
        }

        // Sau đó thử lưu vào cookie với settings nhất quán
        try {
            setCookie(TOKEN_COOKIE_NAME, accessToken, cookieOptions);

            if (refreshToken) {
                setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieOptions);
            }
            console.log('Đã lưu token vào cookie thành công.');
        } catch (cookieError) {
            console.warn('Không thể lưu token vào cookie:', cookieError);
            // Không throw lỗi, vì đã lưu vào localStorage
        }

        // Đặt token cho axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        console.log('Đã lưu token thành công');
    } catch (error) {
        console.error('Lỗi khi lưu token:', error);
    }
}

// Lấy access token từ cookie hoặc localStorage
export const getToken = (): string | null => {
    try {
        const isLoginPage = typeof window !== 'undefined' &&
            (window.location.pathname.includes('/login') || window.location.pathname.includes('/register'));

        // Ưu tiên lấy từ localStorage trước
        if (typeof window !== 'undefined') {
            const localToken = localStorage.getItem(TOKEN_COOKIE_NAME);
            if (localToken) {
                console.log('Lấy token từ localStorage thành công');
                return localToken;
            }

            const sessionToken = sessionStorage.getItem(TOKEN_COOKIE_NAME);
            if (sessionToken) {
                console.log('Lấy token từ sessionStorage thành công');
                return sessionToken;
            }
        }

        // Cuối cùng mới thử lấy từ cookie
        const cookieToken = getCookie(TOKEN_COOKIE_NAME) as string | null;
        if (cookieToken) {
            console.log('Lấy token từ cookie thành công');
            // Đồng bộ vào localStorage và sessionStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(TOKEN_COOKIE_NAME, cookieToken);
                sessionStorage.setItem(TOKEN_COOKIE_NAME, cookieToken);
            }
            return cookieToken;
        }

        if (!isLoginPage) {
            console.warn('Không tìm thấy access token.');
        }
        return null;
    } catch (error) {
        console.error('Lỗi khi lấy access token:', error);
        return null;
    }
}

// Lấy refresh token từ cookie hoặc localStorage
export const getRefreshToken = (): string | null => {
    try {
        // Ưu tiên lấy từ localStorage trước
        if (typeof window !== 'undefined') {
            const localToken = localStorage.getItem(REFRESH_TOKEN_COOKIE_NAME);
            if (localToken) {
                console.log('Lấy refresh token từ localStorage thành công');
                return localToken;
            }

            const sessionToken = sessionStorage.getItem(REFRESH_TOKEN_COOKIE_NAME);
            if (sessionToken) {
                console.log('Lấy refresh token từ sessionStorage thành công');
                return sessionToken;
            }
        }

        // Cuối cùng mới thử lấy từ cookie
        const cookieToken = getCookie(REFRESH_TOKEN_COOKIE_NAME) as string | null;
        if (cookieToken) {
            console.log('Lấy refresh token từ cookie thành công');
            // Đồng bộ vào localStorage và sessionStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(REFRESH_TOKEN_COOKIE_NAME, cookieToken);
                sessionStorage.setItem(REFRESH_TOKEN_COOKIE_NAME, cookieToken);
            }
            return cookieToken;
        }

        console.error('❌ KHÔNG TÌM THẤY REFRESH TOKEN Ở BẤT KỲ ĐÂU!');
        console.log('Debug info:');
        console.log('- localStorage keys:', typeof window !== 'undefined' ? Object.keys(localStorage) : 'N/A');
        console.log('- sessionStorage keys:', typeof window !== 'undefined' ? Object.keys(sessionStorage) : 'N/A');
        console.log('- Cookie names:', typeof document !== 'undefined' ? document?.cookie?.split(';').map(c => c.split('=')[0].trim()) : 'N/A');
        return null;
    } catch (error) {
        console.error('Lỗi khi lấy refresh token:', error);
        return null;
    }
}

// Xóa token và refresh token khi đăng xuất
export const removeTokens = () => {
    try {
        const deleteOpts = { path: cookieOptions.path };
        // Xóa khỏi cookies
        deleteCookie(TOKEN_COOKIE_NAME, deleteOpts);
        deleteCookie(REFRESH_TOKEN_COOKIE_NAME, deleteOpts);

        // Xóa khỏi localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_COOKIE_NAME);
            localStorage.removeItem(REFRESH_TOKEN_COOKIE_NAME);
            sessionStorage.removeItem(TOKEN_COOKIE_NAME);
            sessionStorage.removeItem(REFRESH_TOKEN_COOKIE_NAME);
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

        // Backend trả về { token: "...", refreshToken: "..." }
        if (response.data && response.data.token) {
            console.log('Đã nhận token mới từ backend, lưu...')

            const accessToken = response.data.token;
            const newRefreshToken = response.data.refreshToken;

            saveTokenToCookie(accessToken, newRefreshToken)
            return accessToken;
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

        // Kiểm tra nếu URL là đường dẫn từ backend mà chưa có /api
        if (url.includes('vanlangbubget.onrender.com/') && !url.includes('/api/')) {
            url = url.replace('vanlangbubget.onrender.com/', 'vanlangbubget.onrender.com/api/');
            config.url = url;
        }

        console.log(`API Request to: ${config.method?.toUpperCase()} ${config.url}`);

        const skipAuth = skipAuthAPIs.some(api => url.includes(api))

        if (skipAuth) {
            return config
        }

        // Đảm bảo luôn lấy token mới nhất từ localStorage trước
        const token = typeof window !== 'undefined' ?
            localStorage.getItem(TOKEN_COOKIE_NAME) || getToken() :
            getToken();

        if (token) {
            config.headers['Authorization'] = formatTokenForHeader(token)
            console.log('Adding auth token to request');
        } else {
            console.log('No token available for request');

            // Trong production, nếu không có token và đang ở trang dashboard hoặc trang yêu cầu xác thực, chuyển hướng về login
            if (process.env.NODE_ENV === 'production' &&
                typeof window !== 'undefined' &&
                (window.location.pathname.includes('/dashboard') ||
                    window.location.pathname.includes('/expenses') ||
                    window.location.pathname.includes('/incomes') ||
                    window.location.pathname.includes('/loans') ||
                    window.location.pathname.includes('/investments') ||
                    window.location.pathname.includes('/profile')) &&
                !localStorage.getItem('redirecting_to_login')) {

                localStorage.setItem('redirecting_to_login', 'true');
                setTimeout(() => {
                    window.location.href = '/login?session_expired=true';
                    setTimeout(() => {
                        localStorage.removeItem('redirecting_to_login');
                    }, 1000);
                }, 500);
            }
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
                // Lấy refresh token trực tiếp
                const refreshTokenValue = getRefreshToken();

                if (!refreshTokenValue) {
                    console.error('Không tìm thấy refresh token khi xử lý lỗi 401');
                    shouldRedirectToLogin = true;
                    throw new Error('Không tìm thấy refresh token');
                }

                // Gọi API refresh token trực tiếp
                const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
                    refreshToken: refreshTokenValue
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                // Xử lý response từ refresh token - Backend trả về { token: "...", refreshToken: "..." }
                if (response.data?.token) {
                    const newToken = response.data.token;
                    const newRefreshToken = response.data.refreshToken;

                    console.log('Token mới đã được tạo, thử lại request...');

                    // Lưu token mới
                    saveTokenToCookie(newToken, newRefreshToken);

                    // Cập nhật token trong header và thử lại request
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return instance(originalRequest);
                } else {
                    console.log('Không thể tạo token mới, đánh dấu để chuyển hướng tới trang đăng nhập');
                    shouldRedirectToLogin = true;
                }
            } catch (refreshError) {
                console.error('Lỗi khi thử refresh token:', refreshError);
                shouldRedirectToLogin = true;

                // Đảm bảo xóa token khi refresh thất bại
                removeTokens();
            }
        }

        // Chỉ chuyển hướng đến trang đăng nhập nếu cần và không phải đang ở trang đăng nhập
        if (shouldRedirectToLogin && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;

            // Kiểm tra nếu không phải đang ở trang đăng nhập hoặc đăng ký
            if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
                console.log('Chuyển hướng đến trang đăng nhập do lỗi xác thực');

                // Kiểm tra URL request, bỏ qua site-content để tránh chuyển hướng không cần thiết
                const requestUrl = originalRequest?.url || '';
                if (requestUrl.includes('/api/site-content/')) {
                    console.log('Bỏ qua chuyển hướng đăng nhập cho API site-content:', requestUrl);
                    return Promise.reject(error);
                }

                // Ngăn việc chuyển hướng nhiều lần bằng cách kiểm tra localStorage
                if (!localStorage.getItem('redirecting_to_login')) {
                    localStorage.setItem('redirecting_to_login', 'true');

                    // Xóa toàn bộ token trước khi chuyển hướng
                    removeTokens();

                    // Thêm delay để tránh chuyển hướng quá nhanh
                    setTimeout(() => {
                        window.location.href = '/login?session_expired=true';
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

// Thêm hàm debug để kiểm tra token storage
export const debugTokenStorage = () => {
    console.log('🔍 DEBUG TOKEN STORAGE:');
    console.log('='.repeat(50));

    // Kiểm tra localStorage
    const localAccessToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_COOKIE_NAME) : null;
    const localRefreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_COOKIE_NAME) : null;

    // Kiểm tra sessionStorage
    const sessionAccessToken = typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_COOKIE_NAME) : null;
    const sessionRefreshToken = typeof window !== 'undefined' ? sessionStorage.getItem(REFRESH_TOKEN_COOKIE_NAME) : null;

    // Kiểm tra cookies
    const cookieAccessToken = getCookie(TOKEN_COOKIE_NAME);
    const cookieRefreshToken = getCookie(REFRESH_TOKEN_COOKIE_NAME);

    console.log('📱 localStorage:');
    console.log(`  - Access Token: ${localAccessToken ? localAccessToken.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);
    console.log(`  - Refresh Token: ${localRefreshToken ? localRefreshToken.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);

    console.log('💾 sessionStorage:');
    console.log(`  - Access Token: ${sessionAccessToken ? sessionAccessToken.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);
    console.log(`  - Refresh Token: ${sessionRefreshToken ? sessionRefreshToken.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);

    console.log('🍪 Cookies:');
    console.log(`  - Access Token: ${cookieAccessToken && typeof cookieAccessToken === 'string' ? cookieAccessToken.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);
    console.log(`  - Refresh Token: ${cookieRefreshToken && typeof cookieRefreshToken === 'string' ? cookieRefreshToken.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);

    console.log('🔧 Functions:');
    console.log(`  - getToken(): ${getToken() ? getToken()!.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);
    console.log(`  - getRefreshToken(): ${getRefreshToken() ? getRefreshToken()!.substring(0, 20) + '...' : 'KHÔNG CÓ'}`);

    console.log('='.repeat(50));

    return {
        localStorage: { accessToken: localAccessToken, refreshToken: localRefreshToken },
        sessionStorage: { accessToken: sessionAccessToken, refreshToken: sessionRefreshToken },
        cookies: { accessToken: cookieAccessToken, refreshToken: cookieRefreshToken },
        functions: { accessToken: getToken(), refreshToken: getRefreshToken() }
    };
};

// Thêm hàm test saveTokenToCookie
export const testSaveToken = (testAccessToken?: string, testRefreshToken?: string) => {
    const accessToken = testAccessToken || 'test_access_token_' + Date.now();
    const refreshToken = testRefreshToken || 'test_refresh_token_' + Date.now();

    console.log('🧪 TESTING saveTokenToCookie:');
    console.log('Input tokens:', { accessToken: accessToken.substring(0, 20) + '...', refreshToken: refreshToken.substring(0, 20) + '...' });

    // Clear storage trước khi test
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_COOKIE_NAME);
        localStorage.removeItem(REFRESH_TOKEN_COOKIE_NAME);
        sessionStorage.removeItem(TOKEN_COOKIE_NAME);
        sessionStorage.removeItem(REFRESH_TOKEN_COOKIE_NAME);
    }

    // Test saveTokenToCookie
    saveTokenToCookie(accessToken, refreshToken);

    // Kiểm tra kết quả ngay lập tức
    setTimeout(() => {
        console.log('🔍 Checking results after saveTokenToCookie:');
        debugTokenStorage();
    }, 100);

    return { accessToken, refreshToken };
};

// Thêm hàm test authentication flow
export const testAuthFlow = async () => {
    console.log('🧪 TESTING COMPLETE AUTHENTICATION FLOW');
    console.log('='.repeat(60));

    // Step 1: Check initial state
    console.log('📋 Step 1: Initial State Check');
    debugTokenStorage();

    // Step 2: Test token save
    console.log('📋 Step 2: Test Token Save');
    testSaveToken();

    // Step 3: Verify save worked
    setTimeout(() => {
        console.log('📋 Step 3: Verify Save Worked');
        debugTokenStorage();

        // Step 4: Test token retrieval
        console.log('📋 Step 4: Test Token Retrieval');
        const retrievedAccessToken = getToken();
        const retrievedRefreshToken = getRefreshToken();

        console.log('Retrieved tokens:', {
            accessToken: retrievedAccessToken ? retrievedAccessToken.substring(0, 20) + '...' : 'NONE',
            refreshToken: retrievedRefreshToken ? retrievedRefreshToken.substring(0, 20) + '...' : 'NONE'
        });

        // Step 5: Test API call with token
        console.log('📋 Step 5: Test API Call with Token');
        testConnection();

        console.log('🧪 AUTHENTICATION FLOW TEST COMPLETED');
        console.log('='.repeat(60));
    }, 500);
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

    // Expose debug functions to global scope for browser console access
    (window as any).debugTokenStorage = debugTokenStorage;
    (window as any).testConnection = testConnection;
    (window as any).testSaveToken = testSaveToken;
    (window as any).testAuthFlow = testAuthFlow;
    console.log('🔧 Debug functions available: debugTokenStorage(), testConnection(), testSaveToken(), testAuthFlow()');
}

// Export instance axios để các module khác có thể sử dụng
export default instance;
