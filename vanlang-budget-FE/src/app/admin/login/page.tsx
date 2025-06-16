'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import '../admin.css';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');

        if (errorParam) {
            switch (errorParam) {
                case 'unauthorized':
                    setError('Tài khoản của bạn không có quyền truy cập vào trang quản trị.');
                    break;
                case 'invalid_token':
                    setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    break;
                case 'backend_error':
                    setError('Lỗi kết nối đến máy chủ xác thực. Vui lòng thử lại sau.');
                    break;
                case 'connection':
                    setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
                    break;
                default:
                    setError('Đã xảy ra lỗi. Vui lòng đăng nhập lại.');
            }
        }

        checkExistingAdminSession();
    }, []);

    const checkExistingAdminSession = async () => {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const role = localStorage.getItem('user_role');

        if (token && (role === 'admin' || role === 'superadmin')) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';
                const response = await fetch(`${apiUrl}/api/users/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.status === 'success' && data.data &&
                        (data.data.role === 'admin' || data.data.role === 'superadmin')) {

                        if (!localStorage.getItem('token')) {
                            localStorage.setItem('token', token);
                            document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}`;
                        }

                        router.push('/admin/dashboard');
                        return;
                    }
                }

                clearUserData();

            } catch (error) {
                console.error('Lỗi khi kiểm tra phiên đăng nhập:', error);
            }
        }
    };

    const clearUserData = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');

        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                if (data.user.role !== 'admin' && data.user.role !== 'superadmin') {
                    setError('Tài khoản của bạn không có quyền truy cập vào trang quản trị.');
                    setLoading(false);
                    return;
                }

                const token = data.token;
                const refreshToken = data.refreshToken;
                const role = data.user.role;
                const userId = data.user.id || data.user._id;

                setCookie('token', token, {
                    maxAge: 60 * 60 * 24,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });

                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user_id', userId);
                localStorage.setItem('user_role', role);
                localStorage.setItem('user_email', data.user.email);
                localStorage.setItem('user_name', data.user.fullName || `${data.user.firstName} ${data.user.lastName}`);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('auth_token', token);

                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 100);

            } else {
                if (response.status === 401) {
                    setError('Email hoặc mật khẩu không chính xác.');
                } else if (response.status === 403) {
                    setError('Tài khoản của bạn không có quyền truy cập vào trang quản trị.');
                } else if (response.status === 429) {
                    setError('Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.');
                } else if (response.status >= 500) {
                    setError('Lỗi máy chủ. Vui lòng thử lại sau.');
                } else {
                    setError(data.message || 'Đăng nhập không thành công. Vui lòng thử lại.');
                }
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                const mockToken = email.includes('superadmin') ? 'mock_superadmin_token' : 'mock_admin_token';
                const mockRole = email.includes('superadmin') ? 'superadmin' : 'admin';

                localStorage.setItem('token', mockToken);
                localStorage.setItem('auth_token', mockToken);
                localStorage.setItem('user_role', mockRole);
                localStorage.setItem('user_email', email);
                localStorage.setItem('user_name', email.split('@')[0]);

                document.cookie = `token=${mockToken}; path=/; max-age=${60 * 60 * 24}`;

                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 100);
            } else {
                setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-theme-toggle">
                <ThemeToggle />
            </div>

            <Link href="/" className="admin-login-back-button">
                <ArrowLeft size={20} />
                <span>Quay lại trang chính</span>
            </Link>

            <div className="admin-login-card">
                <div className="admin-login-header">
                    <div className="admin-login-icon">
                        <ShieldCheck size={45} />
                    </div>
                    <h1 className="admin-login-title">Đăng nhập Quản trị viên</h1>
                    <p className="admin-login-subtitle">Vui lòng đăng nhập với tài khoản quản trị</p>
                </div>

                {error && (
                    <div className="admin-login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="admin-login-field">
                        <label htmlFor="email" className="admin-login-label">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                            required
                            className="admin-login-input"
                        />
                    </div>

                    <div className="admin-login-field">
                        <label htmlFor="password" className="admin-login-label">
                            Mật khẩu
                        </label>
                        <div className="admin-login-password-container">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="admin-login-input admin-login-password-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="admin-login-password-toggle"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`admin-login-submit ${loading ? 'loading' : ''}`}
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <Link href="/admin/forgot-password" className="admin-login-link">
                        Quên mật khẩu?
                    </Link>
                </div>
            </div>
        </div>
    );
}
