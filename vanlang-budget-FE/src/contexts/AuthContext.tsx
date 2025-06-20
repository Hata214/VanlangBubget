import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout, setCredentials } from '@/redux/features/authSlice';
import { authService } from '@/services/authService'; // Keep for getUserProfile, refreshToken, register
import { signIn, signOut, useSession } from 'next-auth/react'; // Import signIn, signOut, useSession
import axios from 'axios';
import Cookies from 'js-cookie';
import { TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, cookieOptions, saveTokenToCookie, removeTokens } from '@/services/api';

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
    const { data: session, status } = useSession(); // Use NextAuth's session
    const reduxUser = useAppSelector((state) => state.auth.user);
    const reduxToken = useAppSelector((state) => state.auth.token);

    // Determine isAuthenticated - PRIORITIZE CUSTOM TOKEN over NextAuth session
    const customToken = Cookies.get(TOKEN_COOKIE_NAME);
    const hasCustomToken = !!customToken;
    const hasNextAuthSession = status === 'authenticated';

    // User is authenticated if they have either custom token OR NextAuth session
    const isAuthenticated = hasCustomToken || hasNextAuthSession;

    // Prefer custom user data (reduxUser) over NextAuth session user
    const user = reduxUser || session?.user;

    // Prioritize custom tokens from cookies/redux over NextAuth tokens
    const accessToken = customToken || (reduxToken as any)?.accessToken || (session as any)?.accessToken || null;
    const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE_NAME) || (reduxToken as any)?.refreshToken || (session as any)?.refreshToken || null;


    // Initialize custom aspects or sync Redux store with NextAuth session
    useEffect(() => {
        setIsLoading(status === 'loading');

        // Check for custom tokens first
        const customAccessToken = Cookies.get(TOKEN_COOKIE_NAME);
        const customRefreshToken = Cookies.get(REFRESH_TOKEN_COOKIE_NAME);

        if (status === 'authenticated' && session?.user) {
            // Sync NextAuth session user to Redux if not already there or different
            // This assumes the structure of session.user matches what setCredentials expects
            if (!reduxUser || reduxUser._id !== (session.user as any)._id) {
                const nextAuthUser = session.user as any;

                // Get the actual token from NextAuth session or cookies
                const actualAccessToken = nextAuthUser.accessToken || customAccessToken;
                const actualRefreshToken = nextAuthUser.refreshToken || customRefreshToken;

                console.log('AuthContext: Syncing NextAuth session to Redux', {
                    user: nextAuthUser.email,
                    hasAccessToken: !!actualAccessToken,
                    hasRefreshToken: !!actualRefreshToken
                });

                // Store tokens using the unified saveTokenToCookie function
                if (actualAccessToken) {
                    saveTokenToCookie(actualAccessToken, actualRefreshToken);
                }

                dispatch(setCredentials({
                    user: {
                        _id: nextAuthUser.id,
                        email: nextAuthUser.email,
                        firstName: nextAuthUser.firstName || (nextAuthUser.name?.split(' ')[0] || ''),
                        lastName: nextAuthUser.lastName || (nextAuthUser.name?.split(' ').slice(1).join(' ') || ''),
                        phoneNumber: nextAuthUser.phoneNumber || '',
                        role: nextAuthUser.role || 'user',
                        isEmailVerified: nextAuthUser.isEmailVerified || false,
                    },
                    token: actualAccessToken || "next-auth-session",
                    refreshToken: actualRefreshToken || "next-auth-session"
                }));
            }
        } else if (status === 'unauthenticated') {
            // ONLY clear Redux auth state if BOTH NextAuth session is lost AND no custom tokens exist
            if (reduxUser && !customAccessToken && !customRefreshToken) {
                console.log('AuthContext: NextAuth unauthenticated AND no custom tokens, clearing Redux state');
                dispatch(logout());
                removeTokens();
            } else if (customAccessToken || customRefreshToken) {
                console.log('AuthContext: NextAuth unauthenticated but custom tokens exist, keeping authentication');
                // Keep the current state, don't clear tokens
            }
        }
    }, [session, status, dispatch, reduxUser]);


    // Đăng nhập using CUSTOM authService (not NextAuth)
    const handleLogin = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('AuthContext: Using custom authService.login');

            // Use custom authService instead of NextAuth
            const response = await authService.login(email, password);

            if (response && response.user && response.token) {
                // Ensure user object has all required fields for Redux
                const normalizedUser = {
                    _id: (response.user as any)._id || (response.user as any).id || '',
                    email: response.user.email || '',
                    firstName: (response.user as any).firstName || '',
                    lastName: (response.user as any).lastName || '',
                    phoneNumber: (response.user as any).phoneNumber || '',
                    fullName: (response.user as any).fullName || `${(response.user as any).firstName || ''} ${(response.user as any).lastName || ''}`.trim(),
                    role: (response.user as any).role || 'user',
                    isEmailVerified: (response.user as any).isEmailVerified || false
                };

                // Dispatch to Redux store with normalized user
                dispatch(setCredentials({
                    user: normalizedUser,
                    token: response.token,
                    refreshToken: response.refreshToken
                }));

                console.log('AuthContext: Custom login successful');
                setIsLoading(false);
            } else {
                throw new Error('Invalid response from login service');
            }
        } catch (error: any) {
            console.error('AuthContext: Custom login failed:', error);
            setError(error.message || 'Đăng nhập thất bại');
            setIsLoading(false);
            throw error;
        }
    };

    // Đăng xuất using CUSTOM authService (not NextAuth)
    const handleLogout = async () => {
        setIsLoading(true);
        try {
            console.log('AuthContext: Using custom authService.logout');

            // Use custom authService logout
            await authService.logout();

            // Clear Redux state
            dispatch(logout());

            // Clear axios headers
            delete axios.defaults.headers.common['Authorization'];

            // Only sign out from NextAuth if there's an active session
            if (status === 'authenticated') {
                console.log('AuthContext: Also signing out from NextAuth');
                await signOut({ redirect: false });
            }

            console.log('AuthContext: Logout completed');
            router.push('/login');
        } catch (error: any) {
            console.error('AuthContext: Logout error:', error);
            // Even if logout fails, clear local state
            dispatch(logout());
            removeTokens();
            delete axios.defaults.headers.common['Authorization'];
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    // Đăng ký tài khoản mới - this still uses custom backend directly
    // After successful registration, it should ideally trigger the NextAuth login flow
    const register = async (userData: RegisterData) => {
        setIsLoading(true);
        setError(null);
        try {
            const registerData = {
                name: `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName
            };
            await authService.register(registerData);
            // After successful registration, log in using the NextAuth flow
            await handleLogin(userData.email, userData.password);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Đăng ký thất bại');
            setIsLoading(false);
            throw error;
        }
    };

    // Setup axios interceptor for custom backend token if still needed for some calls
    // This part might be redundant if all authenticated calls go through NextAuth's session handling
    // or if NextAuth's JWT is passed. For now, keep if authService still uses it.
    useEffect(() => {
        const currentToken = Cookies.get(TOKEN_COOKIE_NAME); // This should be the raw access token string
        if (currentToken) {
            console.log('AuthContext: Setting axios default header from TOKEN_COOKIE_NAME');
            axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        } else {
            console.log('AuthContext: No TOKEN_COOKIE_NAME found, clearing axios default header');
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [status]); // Re-run when NextAuth session status changes

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                accessToken, // This might be less relevant if relying on NextAuth session
                refreshToken, // Same as above
                user,
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
