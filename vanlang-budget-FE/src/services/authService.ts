import axios from 'axios'
import Cookies from 'js-cookie'
import api, { cookieOptions, formatTokenForHeader, TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, saveTokenToCookie, getToken, removeTokens, API_URL } from './api'

interface LoginCredentials {
    email: string
    password: string
}

interface RegisterData {
    name: string
    email: string
    password: string
    firstName?: string
    lastName?: string
    locale?: string
}

interface User {
    _id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string
    fullName?: string
    role: string
    isEmailVerified: boolean
}

interface AuthResponse {
    user: {
        id: string
        email: string
        name?: string
        firstName?: string
        lastName?: string
    }
    token: string  // Backend trả về token là string
    refreshToken: string  // refreshToken riêng biệt
    message?: string
}

interface VerifyOTPData {
    email: string
    otp: string
}

interface LoginResponse {
    user: any;
    token: {
        accessToken: string;
        refreshToken: string;
    };
}

/**
 * Dịch vụ xác thực người dùng
 */
class AuthService {
    /**
     * Đăng nhập người dùng
     * @param email Email người dùng
     * @param password Mật khẩu
     * @returns Thông tin người dùng và token
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            // Sử dụng API_URL từ api.ts
            console.log('Using API URL for login:', API_URL);

            // Sử dụng đúng đường dẫn API với tiền tố /api
            const response = await api.post('/api/auth/login', {
                email,
                password
            });

            console.log('Login response status:', response.status);

            // Clone response data và chuẩn hóa
            const responseData = { ...response.data };

            // Chuẩn hóa user object
            if (responseData.user && responseData.user.id && !responseData.user._id) {
                responseData.user._id = responseData.user.id;
            }

            // Lưu token vào cookie và localStorage
            // Backend trả về { token: "...", refreshToken: "..." }
            if (responseData.token) {
                const accessToken = responseData.token;
                const refreshToken = responseData.refreshToken;

                console.log('🔑 Login - Saving tokens:', {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    accessTokenLength: accessToken?.length || 0,
                    refreshTokenLength: refreshToken?.length || 0
                });

                // Sử dụng hàm từ api.ts để lưu token
                saveTokenToCookie(accessToken, refreshToken);
                console.log('✅ Login token saved successfully');
            } else {
                console.error('❌ No token in login response:', responseData);
            }

            return responseData;
        } catch (error: any) {
            console.error('Login error details:', error.message);
            if (error.response) {
                console.error('Server response:', error.response.status, error.response.data);
            }
            throw error;
        }
    }

    /**
     * Đăng ký người dùng mới
     * @param userData Thông tin người dùng
     * @returns Thông tin người dùng sau khi đăng ký
     */
    async register(userData: RegisterData): Promise<AuthResponse> {
        try {
            const response = await api.post('/api/auth/register', userData);
            return response.data;
        } catch (error: any) {
            console.error('Register error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Đăng xuất người dùng
     */
    async logout(): Promise<void> {
        try {
            // Thử gọi API logout
            console.log('Đang gọi API logout...');
            try {
                await api.post('/api/auth/logout');
                console.log('API logout thành công');
            } catch (error: any) {
                // Chỉ log lỗi nhưng không throw
                console.warn('API logout không thành công:', error.message);
                if (error.response) {
                    console.warn('API logout response:', error.response.status, error.response.data);
                }
                // Không throw lỗi ở đây để đảm bảo removeTokens() vẫn được thực hiện
            }

            // Luôn xóa token dù có lỗi hay không
            console.log('Xóa token khỏi client...');
            removeTokens();
            console.log('Đã xóa token, logout hoàn tất');
        } catch (error: any) {
            // Nếu có lỗi khác (không phải từ API), vẫn log ra
            console.error('Lỗi không xác định khi logout:', error.message);
            // Đảm bảo token vẫn được xóa
            removeTokens();
            // Không throw lỗi để tránh vòng lặp
        }
    }

    /**
     * Lấy thông tin hồ sơ người dùng
     * @returns Thông tin người dùng
     */
    async getUserProfile(): Promise<any> {
        try {
            const response = await api.get('/api/auth/me');
            console.log('getUserProfile response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Get user profile error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Đổi mật khẩu
     * @param currentPassword Mật khẩu hiện tại
     * @param newPassword Mật khẩu mới
     * @returns Thông báo thành công
     */
    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        try {
            await api.post('/api/auth/change-password', { oldPassword, newPassword });
            console.log('Password change successful');
        } catch (error: any) {
            console.error('Change password error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Làm mới token
     * @param refreshToken Token làm mới
     * @returns Token truy cập mới
     */
    async refreshToken(refreshToken: string): Promise<any> {
        try {
            const response = await api.post('/api/auth/refresh-token', { refreshToken });
            return response.data;
        } catch (error: any) {
            console.error('Refresh token error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Lấy thông tin người dùng hiện tại
     * @returns Thông tin người dùng
     */
    async getCurrentUser() {
        try {
            const response = await api.get('/api/auth/me');
            return response.data;
        } catch (error: any) {
            console.error('Get current user error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Gửi email đặt lại mật khẩu
     * @param email Email người dùng
     * @returns Thông báo thành công
     */
    async forgotPassword(email: string) {
        try {
            const response = await api.post('/api/auth/forgotpassword', { email });
            return response.data;
        } catch (error: any) {
            console.error('Forgot password error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Đặt lại mật khẩu
     * @param token Token đặt lại mật khẩu
     * @param password Mật khẩu mới
     * @param passwordConfirm Xác nhận mật khẩu mới
     * @returns Thông báo thành công
     */
    async resetPassword(token: string, password: string, passwordConfirm: string) {
        try {
            const response = await api.post(`/api/auth/resetpassword/${token}`, {
                password,
                passwordConfirm
            });
            return response.data;
        } catch (error: any) {
            console.error('Reset password error:', error.response?.data || error.message);
            throw error;
        }
    }

    async verifyEmail(token: string): Promise<void> {
        try {
            await api.post('/api/auth/verify-email', { token });
            console.log('Email verification successful');
        } catch (error: any) {
            console.error('Email verification error:', error.response?.data || error.message);
            throw error;
        }
    }

    async resendVerificationEmail(email: string, locale?: string): Promise<void> {
        try {
            await api.post('/api/auth/resend-verification', { email, locale });
            console.log('Verification email resent successfully');
        } catch (error: any) {
            console.error('Resend verification email error:', error.response?.data || error.message);
            throw error;
        }
    }

    async verifyOTP(data: VerifyOTPData): Promise<AuthResponse> {
        try {
            // Kiểm tra và xác thực dữ liệu trước khi gửi đi
            if (!data.email || !data.otp) {
                throw new Error('Email và mã OTP là bắt buộc');
            }

            // Đảm bảo otp là chuỗi
            if (typeof data.otp !== 'string') {
                data.otp = String(data.otp);
            }

            const response = await api.post<AuthResponse>('/api/auth/verify-otp', data);
            console.log('VerifyOTP response status:', response.status);

            // Xử lý response
            if (response.data) {
                const { token } = response.data;

                if (token) {
                    try {
                        // Backend trả về { token: "...", refreshToken: "..." }
                        const accessToken = response.data.token;
                        const refreshToken = (response.data as any).refreshToken;

                        // Lưu token vào cookie
                        saveTokenToCookie(accessToken, refreshToken);
                        console.log('Token saved after OTP verification:', Cookies.get('token') ? 'Success' : 'Failed');
                    } catch (tokenError) {
                        console.error('Error processing token:', tokenError);
                    }
                }
            }

            return response.data;
        } catch (error: any) {
            console.error('OTP verification error:', error.response?.data || error.message);
            throw error;
        }
    }

    async resendOTP(email: string, locale?: string): Promise<void> {
        try {
            await api.post('/api/auth/resend-otp', { email, locale });
            console.log('OTP resent successfully');
        } catch (error: any) {
            console.error('Resend OTP error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Lấy token hiện tại
     * @returns Token người dùng hoặc null
     */
    getToken(): string | null {
        return getToken();
    }

    // Lấy token đã được format để dùng trong header Authorization
    getAuthorizationToken(): string | undefined {
        const token = this.getToken();
        if (!token) return undefined;
        return `Bearer ${token}`;
    }

    isAuthenticated(): boolean {
        const isAuth = !!this.getToken();
        console.log('Is authenticated:', isAuth);
        return isAuth;
    }

    async resetUserData(confirmationText: string): Promise<{ success: boolean, message: string }> {
        try {
            if (confirmationText !== 'resetdata') {
                return {
                    success: false,
                    message: 'Văn bản xác nhận không đúng. Vui lòng nhập "resetdata" để xác nhận xóa dữ liệu.'
                };
            }

            console.log('Bắt đầu gọi API xóa dữ liệu với confirmation:', confirmationText);

            // Sử dụng api instance thay vì gọi axios trực tiếp
            const response = await api.post('/api/users/reset-data', { confirmationText });

            console.log('Kết quả xóa dữ liệu:', response.data);
            return response.data;
        } catch (error: any) {
            // Xử lý lỗi chi tiết
            console.error('Lỗi khi gọi API reset-data:', error.name, error.message);

            if (error.response) {
                // Lỗi từ server trả về (response status khác 2xx)
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                // Không nhận được response
                console.error('Request đã gửi nhưng không nhận được response:', error.request);
            }

            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xóa dữ liệu';
            return {
                success: false,
                message: errorMessage
            };
        }
    }
}

export const authService = new AuthService(); 