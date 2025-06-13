import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout, setCredentials } from '@/redux/features/authSlice';
import { authService } from '@/services/authService'; // Keep for getUserProfile, refreshToken, register
import { signIn, signOut, useSession } from 'next-auth/react'; // Import signIn, signOut, useSession
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
    const { data: session, status } = useSession(); // Use NextAuth's session
    const reduxUser = useAppSelector((state) => state.auth.user);
    const reduxToken = useAppSelector((state) => state.auth.token);

    // Determine isAuthenticated based on NextAuth session and potentially custom logic
    const isAuthenticated = status === 'authenticated';
    const user = session?.user || reduxUser; // Prefer session user, fallback to redux user

    // accessToken and refreshToken can be derived if needed, or managed by NextAuth
    // For simplicity, let's assume NextAuth handles token refresh via its JWT strategy
    // The custom backend token is set in cookies by CredentialsProvider
    const accessToken = (reduxToken as any)?.accessToken || (session as any)?.accessToken || null;
    const refreshToken = (reduxToken as any)?.refreshToken || (session as any)?.refreshToken || null;


    // Initialize custom aspects or sync Redux store with NextAuth session
    useEffect(() => {
        setIsLoading(status === 'loading');
        if (status === 'authenticated' && session?.user) {
            // Sync NextAuth session user to Redux if not already there or different
            // This assumes the structure of session.user matches what setCredentials expects
            if (!reduxUser || reduxUser.id !== (session.user as any).id) {
                const nextAuthUser = session.user as any;
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
                    // Token from NextAuth session is not directly available here.
                    // The actual backend token is in HttpOnly cookie managed by NextAuth backend
                    // or the cookie set by CredentialsProvider.
                    // For Redux, we might store a marker or rely on NextAuth session.
                    token: { accessToken: "next-auth-session", refreshToken: "next-auth-session" } // Placeholder
                }));
            }
        } else if (status === 'unauthenticated') {
            // Clear Redux auth state if NextAuth session is lost
            if (reduxUser) {
                dispatch(logout());
            }
        }
    }, [session, status, dispatch, reduxUser]);


    // Đăng nhập using NextAuth
    const handleLogin = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await signIn('credentials', {
                redirect: false, // Handle redirect manually or let NextAuth handle it based on pages config
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
                throw new Error(result.error);
            }

            // On successful signIn, useSession() will update, triggering useEffect to sync Redux.
            // NextAuth's default behavior (or pages.signIn config) might handle redirection.
            // If manual redirect is needed:
            // router.push('/dashboard'); // Or based on callbackUrl from signIn result
            setIsLoading(false);
            // router.push('/dashboard'); // Let NextAuth handle redirection based on its config or callbackUrl
        } catch (error: any) {
            setError(error.message || 'Đăng nhập thất bại');
            setIsLoading(false);
            throw error;
        }
    };

    // Đăng xuất using NextAuth
    const handleLogout = async () => {
        setIsLoading(true);
        // Custom backend logout if needed (e.g., invalidate refresh token on server)
        // await authService.logout(); // This might clear the custom cookie
        await signOut({ redirect: false }); // signOut from NextAuth, handles session & cookie
        dispatch(logout()); // Clear Redux state
        removeTokens(); // Clear custom cookies if any are still managed separately
        delete axios.defaults.headers.common['Authorization'];
        router.push('/admin/login'); // Or let NextAuth handle redirect
        setIsLoading(false);
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
