import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout, setCredentials } from '@/redux/features/authSlice';
import { authService } from '@/services/authService';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TOKEN_COOKIE_NAME, cookieOptions, saveTokenToCookie, removeTokens } from '@/services/api';

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

interface AuthContextProps {
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    user: any; // Thêm thuộc tính user (cần định nghĩa type cụ thể hơn sau)
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextProps>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null, // Thêm user vào giá trị khởi tạo
    login: async () => { },
    logout: async () => { },
    register: async () => { },
    isLoading: false,
    error: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isLoading, setIsLoading] = useState(true); // Bắt đầu với trạng thái loading
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, token } = useAppSelector((state) => state.auth);

    // Lấy trạng thái xác thực từ Redux store
    const isAuthenticated = !!user && !!token;

    // Truy cập an toàn vào token
    let accessToken = null;
    let refreshToken = null;

    if (token && typeof token === 'object') {
        accessToken = token.accessToken || null;
        refreshToken = token.refreshToken || null;
    }

    // Khởi tạo auth từ cookie khi component được mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Kiểm tra xem đã có token trong cookie chưa
                const tokenFromCookie = Cookies.get('token');
                const tokenFromLocalStorage = localStorage.getItem('token');

                // Ưu tiên token từ localStorage nếu có
                const availableToken = tokenFromLocalStorage || tokenFromCookie;

                console.log('Khởi tạo auth với token:', availableToken ? 'Đã có token' : 'Không có token');

                if (!availableToken) {
                    setIsLoading(false);
                    return;
                }

                // Đồng bộ token giữa cookie và localStorage
                if (tokenFromLocalStorage && !tokenFromCookie) {
                    Cookies.set('token', tokenFromLocalStorage, cookieOptions);
                } else if (tokenFromCookie && !tokenFromLocalStorage) {
                    localStorage.setItem('token', tokenFromCookie);
                }

                // Parse token từ cookie
                try {
                    const parsedToken = JSON.parse(availableToken);

                    // Thiết lập token cho axios
                    if (parsedToken.accessToken) {
                        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedToken.accessToken}`;

                        // Lưu lại token một lần nữa để đảm bảo tính nhất quán
                        saveTokenToCookie(parsedToken);
                    } else {
                        console.error('Token không có accessToken');
                        setIsLoading(false);
                        return;
                    }

                    if (!isAuthenticated) {
                        try {
                            // Lấy thông tin người dùng từ API
                            const userData = await authService.getUserProfile();
                            console.log('Dữ liệu user:', userData);

                            if (userData && userData.user) {
                                // Cập nhật Redux store với thông tin người dùng và token
                                dispatch(setCredentials({
                                    user: {
                                        _id: userData.user.id || userData.user._id,
                                        email: userData.user.email,
                                        firstName: userData.user.firstName || '',
                                        lastName: userData.user.lastName || '',
                                        role: userData.user.role || 'user',
                                        isEmailVerified: userData.user.isEmailVerified || false
                                    },
                                    token: parsedToken
                                }));
                                console.log('Xác thực người dùng từ token đã lưu');
                            }
                        } catch (apiError) {
                            console.error('Lỗi khi lấy thông tin người dùng:', apiError);

                            // Thử làm mới token trước khi xóa
                            try {
                                if (parsedToken.refreshToken) {
                                    const newToken = await authService.refreshToken(parsedToken.refreshToken);
                                    if (newToken) {
                                        console.log('Đã làm mới token thành công');
                                        saveTokenToCookie(newToken);
                                        window.location.reload(); // Tải lại trang để áp dụng token mới
                                        return;
                                    }
                                }
                            } catch (refreshError) {
                                console.error('Không thể làm mới token:', refreshError);
                            }

                            // Nếu thất bại và không thể refresh, xóa token
                            removeTokens();
                            delete axios.defaults.headers.common['Authorization'];
                        }
                    }
                } catch (parseError) {
                    console.error('Lỗi khi parse token:', parseError);
                    removeTokens();
                }
            } catch (error) {
                console.error('Lỗi khi khởi tạo xác thực:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, [dispatch, isAuthenticated]);

    // Thiết lập token mặc định cho axios
    useEffect(() => {
        if (accessToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [accessToken]);

    // Đăng nhập
    const handleLogin = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await authService.login(email, password);

            // Đảm bảo cấu trúc dữ liệu trả về tương thích với setCredentials
            dispatch(setCredentials({
                user: {
                    _id: data.user.id,
                    email: data.user.email,
                    firstName: data.user.firstName || '',
                    lastName: data.user.lastName || '',
                    role: 'user', // Giá trị mặc định nếu API không trả về
                    isEmailVerified: false // Giá trị mặc định nếu API không trả về
                },
                token: data.token
            }));

            // Lưu token được xử lý bởi authService.login rồi
            // Không cần phải làm lại ở đây

            router.push('/dashboard');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Đăng nhập thất bại');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Đăng xuất
    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await authService.logout();
            dispatch(logout());
            // removeTokens() đã được gọi trong authService.logout()
            router.push('/login');
        } catch (error: any) {
            console.error('Đăng xuất thất bại:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Đăng ký tài khoản mới
    const register = async (userData: RegisterData) => {
        try {
            setIsLoading(true);
            setError(null);

            // Chuyển đổi dữ liệu đăng ký để phù hợp với API
            const registerData = {
                name: `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName
            };

            await authService.register(registerData);

            // Đăng nhập sau khi đăng ký thành công
            await handleLogin(userData.email, userData.password);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Đăng ký thất bại');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                accessToken,
                refreshToken,
                user, // Thêm user vào giá trị provider
                login: handleLogin,
                logout: handleLogout,
                register,
                isLoading,
                error
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
