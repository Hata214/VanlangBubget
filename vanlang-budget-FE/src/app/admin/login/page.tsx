'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import '../admin.css';

// CSS Reset khi người dùng rời khỏi trang admin
const resetAdminCSS = () => {
    // Tạo một style tag để reset CSS
    if (typeof window !== 'undefined') {
        const style = document.createElement('style');
        style.innerHTML = `
            /* Reset các CSS của admin khi rời khỏi trang admin */
            body:not(.admin-layout) a.admin-back-button,
            body:not(.admin-login-layout) a.admin-back-button {
                all: unset !important;
                text-decoration: inherit !important;
                color: inherit !important;
                display: inline !important;
                cursor: pointer !important;
            }
        `;
        document.head.appendChild(style);
    }
};

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminHelp, setShowAdminHelp] = useState(false);

    // Khi người dùng rời trang admin, reset CSS
    useEffect(() => {
        // Thêm lớp admin-login-layout vào body
        if (typeof window !== 'undefined') {
            document.body.classList.add('admin-login-layout');
        }

        // Cleanup function khi component unmount
        return () => {
            if (typeof window !== 'undefined') {
                document.body.classList.remove('admin-login-layout');
                resetAdminCSS();
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Tạo một token giả lập cho môi trường phát triển nếu cần
            const mockSuccessLogin = email === 'superadmin@control.vn' && password === 'Admin123!';

            // Gọi API xác thực
            const response = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            // Kiểm tra phản hồi từ server
            if (response.ok && data.success) {
                console.log('Đăng nhập thành công với role:', data.user.role);

                // Lưu token vào cookie và localStorage
                const token = data.token;
                const role = data.user.role;

                // Lưu cookie với maxAge 24 giờ
                setCookie('auth_token', token, {
                    maxAge: 60 * 60 * 24,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });

                // Lưu thông tin người dùng vào localStorage
                localStorage.setItem('auth_token', token);
                localStorage.setItem('user_role', role);
                localStorage.setItem('user_email', data.user.email);
                localStorage.setItem('user_name', data.user.name || email.split('@')[0]);

                console.log('Token đã được lưu, đang chuyển hướng đến /admin/dashboard');

                // Thêm delay nhỏ để đảm bảo dữ liệu được lưu trước khi chuyển hướng
                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 100);
            } else if (mockSuccessLogin) {
                // Xử lý đăng nhập mẫu cho môi trường phát triển
                console.log('Đăng nhập mẫu thành công');

                // Tạo token giả lập (trong thực tế đây sẽ là JWT hợp lệ)
                const mockToken = `mock_${Date.now()}_superadmin_token`;

                // Lưu vào cả cookie và localStorage
                setCookie('auth_token', mockToken, {
                    maxAge: 60 * 60 * 24,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });

                localStorage.setItem('auth_token', mockToken);
                localStorage.setItem('user_role', 'superadmin');
                localStorage.setItem('user_email', email);
                localStorage.setItem('user_name', 'Super Admin');

                console.log('Token mẫu đã được lưu, đang chuyển hướng đến /admin/dashboard');

                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 100);
            } else {
                setError(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const createSuperAdmin = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/emergency-create-admin`);
            const data = await response.json();

            if (response.ok) {
                setEmail('superadmin@control.vn');
                setPassword('Admin123!');
                setShowAdminHelp(false);
                setError('');
                alert('Tài khoản superadmin đã được tạo thành công. Email: superadmin@control.vn, Mật khẩu: Admin123!');
            } else {
                setError(data.message || 'Không thể tạo tài khoản superadmin.');
            }
        } catch (error) {
            console.error('Create superadmin error:', error);
            setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleEmergencyLogin = () => {
        setEmail('superadmin@control.vn');
        setPassword('Admin123!');

        // Tạo token giả lập
        const mockToken = `mock_${Date.now()}_superadmin_token`;

        // Lưu vào cả cookie và localStorage
        setCookie('auth_token', mockToken, {
            maxAge: 60 * 60 * 24,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('user_role', 'superadmin');
        localStorage.setItem('user_email', 'superadmin@control.vn');
        localStorage.setItem('user_name', 'Super Admin');

        console.log('Đăng nhập khẩn cấp thành công, chuyển hướng đến trang dashboard');
        setTimeout(() => {
            router.push('/admin/dashboard');
        }, 100);
    };

    return (
        <div className="admin-login-layout" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100%',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '32px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                position: 'relative'
            }}>
                <Link
                    href="/"
                    className="admin-back-button"
                >
                    <ArrowLeft className="mr-2" size={16} />
                    Quay lại trang chính
                </Link>

                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        backgroundColor: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '40px', height: '40px', color: '#4f46e5' }}>
                            <path d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Đăng nhập Quản trị viên</h1>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Vui lòng đăng nhập với tài khoản quản trị</p>

                    <button
                        onClick={() => setShowAdminHelp(!showAdminHelp)}
                        style={{
                            marginTop: '8px',
                            padding: '0',
                            background: 'none',
                            border: 'none',
                            color: '#4f46e5',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        {showAdminHelp ? 'Ẩn thông tin' : 'Không có tài khoản admin?'}
                    </button>
                </div>

                {showAdminHelp && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '16px',
                        backgroundColor: '#e0e7ff',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#4338ca'
                    }}>
                        <p style={{ marginBottom: '8px' }}>Tài khoản superadmin mặc định:</p>
                        <p style={{ marginBottom: '4px' }}><strong>Email:</strong> superadmin@control.vn</p>
                        <p style={{ marginBottom: '8px' }}><strong>Mật khẩu:</strong> Admin123!</p>

                        <button
                            onClick={handleEmergencyLogin}
                            style={{
                                marginTop: '8px',
                                padding: '8px 12px',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng nhập khẩn cấp'}
                        </button>
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '16px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#b91c1c'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#4b5563'
                            }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                backgroundColor: '#fff'
                            }}
                            placeholder="superadmin@control.vn"
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#4b5563'
                            }}
                        >
                            Mật khẩu
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    paddingRight: '42px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '16px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    backgroundColor: '#fff'
                                }}
                                placeholder="Admin123!"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    right: '12px',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0'
                                }}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="m3 3 18 18" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'background-color 0.2s',
                            marginBottom: '16px'
                        }}
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}
