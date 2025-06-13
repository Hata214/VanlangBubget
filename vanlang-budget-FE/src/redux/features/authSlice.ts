import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/services/api'
import { authService } from '@/services/authService'

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

// Cấu trúc token
interface TokenData {
    accessToken: string
    refreshToken: string
}

// Định nghĩa kiểu AuthResponse từ authService
interface AuthResponse {
    user: User
    token: TokenData
    message?: string
}

interface AuthState {
    user: User | null
    token: TokenData | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null
    isLoading: boolean
}

// Khôi phục state từ localStorage nếu có
const loadAuthStateFromStorage = (): AuthState => {
    if (typeof window === 'undefined') {
        return {
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            isLoading: false,
        };
    }

    try {
        const storedState = localStorage.getItem('auth_state');
        if (storedState) {
            const parsedState = JSON.parse(storedState);
            return {
                ...parsedState,
                isAuthenticated: !!parsedState.user && !!parsedState.token,
                loading: false,
                isLoading: false,
                error: null
            };
        }
    } catch (error) {
        console.error('Lỗi khi khôi phục trạng thái auth:', error);
    }

    return {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        isLoading: false,
    };
};

const initialState: AuthState = loadAuthStateFromStorage();

// Hàm lưu trạng thái auth vào localStorage
const saveAuthStateToStorage = (state: AuthState) => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem('auth_state', JSON.stringify({
            user: state.user,
            token: state.token,
            isAuthenticated: state.isAuthenticated
        }));
    } catch (error) {
        console.error('Lỗi khi lưu trạng thái auth:', error);
    }
};

// Fetch user profile from database
export const fetchUserProfile = createAsyncThunk(
    'auth/fetchUserProfile',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching user profile...')
            const response = await api.get('/api/auth/me')
            console.log('User profile response:', response.data)

            // Backend trả về { status: "success", user: {...} }
            if (response.data.status === 'success' && response.data.user) {
                return response.data.user
            } else {
                throw new Error('Invalid response format')
            }
        } catch (error: any) {
            console.error('Error fetching user profile:', error)
            return rejectWithValue(error.response?.data?.message || error.message || 'Không thể tải thông tin người dùng')
        }
    }
)

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (data: { firstName: string; lastName: string; phoneNumber?: string }, { rejectWithValue }) => {
        try {
            console.log('Updating user profile with data:', data)
            const response = await api.patch('/api/auth/updateme', data)
            console.log('Update profile response:', response.data)

            // Backend có thể trả về { status: "success", user: {...} } hoặc { user: {...} }
            if (response.data.status === 'success' && response.data.user) {
                return response.data.user
            } else if (response.data.user) {
                return response.data.user
            } else {
                throw new Error('Invalid response format')
            }
        } catch (error: any) {
            console.error('Error updating user profile:', error)
            return rejectWithValue(error.response?.data?.message || error.message || 'Không thể cập nhật thông tin')
        }
    }
)

export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async (data: { currentPassword: string; newPassword: string }) => {
        await authService.changePassword(data.currentPassword, data.newPassword)
        return true
    }
)

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<AuthResponse>
        ) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.isAuthenticated = true

            // Lưu trạng thái vào localStorage
            saveAuthStateToStorage(state);
        },
        logout: (state) => {
            // Đảm bảo gọi authService.logout() trước để xử lý việc xóa token và API logout
            try {
                authService.logout().catch(error => {
                    console.error('Lỗi khi logout từ API:', error);
                });
            } catch (error) {
                console.error('Lỗi khi gọi authService.logout():', error);
            }

            // Sau đó mới xóa state
            state.user = null
            state.token = null
            state.isAuthenticated = false

            // Xóa trạng thái từ localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_state');
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.isLoading = false
                state.user = action.payload

                // Lưu trạng thái cập nhật vào localStorage
                saveAuthStateToStorage(state);
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Không thể tải thông tin người dùng'
            })
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false
                state.user = action.payload

                // Lưu trạng thái cập nhật vào localStorage
                saveAuthStateToStorage(state);
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Có lỗi xảy ra'
            })
            .addCase(changePassword.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(changePassword.fulfilled, (state) => {
                state.isLoading = false
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message || 'Đổi mật khẩu thất bại'
            })
    },
})

export const { setCredentials, logout, setLoading, setError } = authSlice.actions
export default authSlice.reducer 