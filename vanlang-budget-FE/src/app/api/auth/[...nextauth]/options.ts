import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, cookieOptions, saveTokenToCookie } from "@/services/api";
import Cookies from "js-cookie";
import axios from "axios";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Mật khẩu", type: "password" }
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        return null;
                    }

                    // Sử dụng URL API từ biến môi trường hoặc mặc định
                    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

                    // Gọi API đăng nhập
                    const response = await axios.post(`${API_URL}/api/auth/login`, {
                        email: credentials.email,
                        password: credentials.password
                    });

                    const userData = response.data;

                    if (!userData || !userData.user) {
                        return null;
                    }

                    // Lưu token vào cookie nếu có
                    let accessToken = '';
                    let refreshToken = '';
                    if (userData.token) {
                        // Backend trả về { token: "...", refreshToken: "..." }
                        accessToken = userData.token; // token is now a string
                        refreshToken = userData.refreshToken || '';
                        saveTokenToCookie(accessToken, refreshToken);
                    }

                    // Định dạng dữ liệu người dùng trả về
                    const user = {
                        id: userData.user.id || userData.user._id,
                        email: userData.user.email,
                        name: userData.user.name || `${userData.user.firstName || ''} ${userData.user.lastName || ''}`.trim() || userData.user.email,
                        firstName: userData.user.firstName || '',
                        lastName: userData.user.lastName || '',
                        phoneNumber: userData.user.phoneNumber || '',
                        role: userData.user.role || "user",
                        isEmailVerified: userData.user.isEmailVerified || false,
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    };

                    return user;
                } catch (error: any) {
                    console.error("NextAuth authorize error:", error.message);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 ngày
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.user = user;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = token.user as any;
            return session;
        }
    },
    pages: {
        signIn: "/admin/login",
        error: "/admin/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "your-default-secret-key",
};
