'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
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

            // Kiểm tra lỗi từ query parameters
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

            // Kiểm tra nếu người dùng đã đăng nhập với quyền admin
            checkExistingAdminSession();
        }

        // Cleanup function khi component unmount
        return () => {
            if (typeof window !== 'undefined') {
                document.body.classList.remove('admin-login-layout');
                resetAdminCSS();
            }
        };
    }, []);

    // Kiểm tra xem có phiên đăng nhập admin đang tồn tại không
    const checkExistingAdminSession = async () => {
        const token = localStorage.getItem('auth_token');
        const role = localStorage.getItem('user_role');

        if (token && (role === 'admin' || role === 'superadmin')) {
            try {
                // Kiểm tra token có hợp lệ không
                const response = await fetch('/api/admin/auth/verify', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.success && data.user &&
                        (data.user.role === 'admin' || data.user.role === 'superadmin')) {
                        console.log('Người dùng đã đăng nhập với vai trò:', data.user.role);
                        // Chuyển hướng đến trang dashboard
                        router.push('/admin/dashboard');
                        return;
                    }
                }

                // Nếu token không hợp lệ, xóa dữ liệu đăng nhập cũ
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_name');

                // Xóa cookies
                document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            } catch (error) {
                console.error('Lỗi khi kiểm tra phiên đăng nhập:', error);
                // Không hiển thị lỗi này cho người dùng, chỉ ghi log
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
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

                if (data.user.role !== 'admin' && data.user.role !== 'superadmin') {
                    setError('Tài khoản của bạn không có quyền truy cập vào trang quản trị.');
                    setLoading(false);
                    return;
                }

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

                console.log(`Đăng nhập thành công với vai trò ${role}, đang chuyển hướng đến /admin/dashboard`);

                // Thêm delay nhỏ để đảm bảo dữ liệu được lưu trước khi chuyển hướng
                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 100);
            } else {
                // Xử lý lỗi dựa trên phản hồi từ server
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
            padding: '20px',
            background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                padding: '32px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Link
                    href="/"
                    className="admin-back-button"
                    style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                        color: '#6b7280',
                        fontSize: '14px',
                        transition: 'color 0.2s'
                    }}
                >
                    <ArrowLeft className="mr-2" size={16} />
                    Quay lại trang chính
                </Link>

                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{
                        width: '90px',
                        height: '90px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        boxShadow: '0 0 20px rgba(79, 70, 229, 0.2)'
                    }}>
                        <ShieldCheck size={45} color="#4f46e5" strokeWidth={1.5} />
                    </div>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '8px',
                        letterSpacing: '-0.025em'
                    }}>Đăng nhập Quản trị viên</h1>
                    <p style={{
                        fontSize: '15px',
                        color: '#6b7280',
                        marginBottom: '8px'
                    }}>Vui lòng đăng nhập với tài khoản quản trị</p>
                </div>

                {showAdminHelp && (
                    <div style={{
                        padding: '16px',
                        marginBottom: '24px',
                        backgroundColor: '#e0e7ff',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#4338ca',
                        boxShadow: '0 2px 5px rgba(67, 56, 202, 0.1)'
                    }}>
                        <p style={{ marginBottom: '8px', fontWeight: '500' }}>Tài khoản superadmin mặc định:</p>
                        <p style={{ marginBottom: '4px' }}><strong>Email:</strong> superadmin@control.vn</p>
                        <p style={{ marginBottom: '8px' }}><strong>Mật khẩu:</strong> Admin123!</p>

                        <button
                            onClick={handleEmergencyLogin}
                            style={{
                                marginTop: '12px',
                                padding: '10px 16px',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                            }}
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng nhập khẩn cấp'}
                        </button>
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '16px',
                        marginBottom: '24px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#b91c1c',
                        animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
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
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
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
                                marginBottom: '8px',
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
                                    padding: '12px 16px',
                                    paddingRight: '46px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
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
                                    right: '14px',
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
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="m3 3 18 18" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
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
                            padding: '14px',
                            background: 'linear-gradient(to right, #4f46e5, #6366f1)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 6px rgba(79, 70, 229, 0.15)',
                            marginBottom: '16px'
                        }}
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                input:focus {
                    border-color: #4f46e5 !important;
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1) !important;
                }
                
                button[type="submit"]:hover:not(:disabled) {
                    background: linear-gradient(to right, #4338ca, #4f46e5) !important;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25) !important;
                    transform: translateY(-1px) !important;
                }
                
                button[type="submit"]:active:not(:disabled) {
                    transform: translateY(0) !important;
                    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.15) !important;
                }
                
                .admin-back-button:hover {
                    color: #4f46e5 !important;
                }
            `}</style>
        </div>
    );
}
