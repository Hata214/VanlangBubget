'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import messagesVi from '@/messages/vi.json';
import Link from 'next/link';
import {
    Users,
    LayoutDashboard,
    FileText,
    Bell,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';
import './admin.css';

// Trang không yêu cầu kiểm tra quyền admin
const PUBLIC_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

// Layout riêng cho khu vực admin
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Kiểm tra nếu đường dẫn hiện tại là trang công khai
    const isPublicPage = PUBLIC_PATHS.some(path => pathname === path);

    useEffect(() => {
        // Không cần kiểm tra quyền cho các trang công khai
        if (isPublicPage) {
            setIsLoading(false);
            return;
        }

        // Kiểm tra xem người dùng đã đăng nhập hay chưa và có quyền admin không
        const checkAdminAccess = async () => {
            setIsLoading(true);

            try {
                // Lấy token từ localStorage hoặc cookie
                const token = localStorage.getItem('auth_token') ||
                    document.cookie.split('; ')
                        .find(row => row.startsWith('auth_token='))?.split('=')[1];

                if (!token) {
                    console.log("Không tìm thấy token, chuyển hướng đến trang đăng nhập");
                    router.push('/admin/login');
                    return;
                }

                // Xử lý token giả lập trực tiếp (cho môi trường phát triển)
                if (token.startsWith('mock_') && (token.includes('admin') || token.includes('superadmin'))) {
                    console.log("Xác thực với token giả lập");

                    // Lấy thông tin người dùng từ localStorage
                    const email = localStorage.getItem('user_email') || 'admin@example.com';
                    const name = localStorage.getItem('user_name') || 'Admin User';
                    const role = localStorage.getItem('user_role') || 'admin';

                    setIsAuthorized(true);
                    setUserInfo({
                        id: '1',
                        email: email,
                        name: name,
                        role: role
                    });

                    setIsLoading(false);
                    return;
                }

                // Xác thực token với API admin
                console.log("Gọi API xác thực token admin");
                const response = await fetch('/api/admin/auth', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    console.log("Xác thực admin thành công");
                    setIsAuthorized(true);
                    setUserInfo(userData.user);

                    // Lưu thông tin người dùng vào localStorage
                    if (userData.user) {
                        localStorage.setItem('user_email', userData.user.email);
                        localStorage.setItem('user_name', userData.user.name || userData.user.email);
                        localStorage.setItem('user_role', userData.user.role);
                    }
                } else {
                    console.log("Token không hợp lệ hoặc không có quyền admin");
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_role');
                    localStorage.removeItem('user_email');
                    localStorage.removeItem('user_name');

                    // Xóa cookies
                    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

                    router.push('/admin/login');
                }
            } catch (error) {
                console.error("Lỗi khi xác thực:", error);
                router.push('/admin/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAccess();
    }, [pathname, router, isPublicPage]);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        router.push('/admin/login');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    // Menu items
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', active: pathname === '/admin/dashboard' },
        { icon: Users, label: 'Người dùng', path: '/admin/users', active: pathname === '/admin/users' },
        { icon: FileText, label: 'Nội dung', path: '/admin/site-content', active: pathname === '/admin/site-content' },
        { icon: Bell, label: 'Thông báo', path: '/admin/notifications', active: pathname === '/admin/notifications' },
        { icon: CreditCard, label: 'Giao dịch', path: '/admin/transactions', active: pathname === '/admin/transactions' },
    ];

    // Bọc tất cả các component con trong NextIntlClientProvider để hỗ trợ i18n
    const wrappedChildren = (
        <NextIntlClientProvider locale="vi" messages={messagesVi}>
            {children}
        </NextIntlClientProvider>
    );

    // Hiển thị chỉ children cho trang không yêu cầu xác thực
    if (isPublicPage) {
        return (
            <div className="admin-login-layout">
                {wrappedChildren}
            </div>
        );
    }

    // Hiển thị loading khi đang kiểm tra xác thực
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100%',
                backgroundColor: '#f9fafb'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#4f46e5',
                    animation: 'spin 1s linear infinite'
                }} />
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
                    Đang tải...
                </p>
            </div>
        );
    }

    // Phần layout chính cho admin dashboard khi đã xác thực
    if (isAuthorized) {
        return (
            <div className="admin-layout">
                {/* Sidebar */}
                <div className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="admin-sidebar-header">
                        <h1 className="admin-logo">VangLang Budget</h1>
                        <button className="admin-sidebar-toggle" onClick={toggleSidebar}>
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    <nav className="admin-sidebar-nav">
                        <ul>
                            {menuItems.map((item, index) => (
                                <li key={index}>
                                    <Link href={item.path} className={`admin-sidebar-link ${item.active ? 'active' : ''}`}>
                                        <item.icon size={20} />
                                        <span className="admin-sidebar-label">{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="admin-sidebar-footer">
                        <button className="admin-sidebar-link" onClick={handleLogout}>
                            <LogOut size={20} />
                            <span className="admin-sidebar-label">Đăng xuất</span>
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className={`admin-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                    {/* Header */}
                    <header className="admin-header">
                        <button className="admin-mobile-sidebar-toggle" onClick={toggleSidebar}>
                            <Menu size={24} />
                        </button>

                        <div className="admin-header-actions">
                            {userInfo && (
                                <div className="admin-user-menu">
                                    <button className="admin-user-button" onClick={toggleUserMenu}>
                                        <div className="admin-user-avatar">
                                            {userInfo.name?.charAt(0) || userInfo.email.charAt(0)}
                                        </div>
                                        <span className="admin-user-name">{userInfo.name || userInfo.email}</span>
                                        <ChevronDown size={16} />
                                    </button>

                                    {userMenuOpen && (
                                        <div className="admin-user-dropdown">
                                            <div className="admin-user-info">
                                                <div className="admin-user-details">
                                                    <p className="admin-user-email">{userInfo.email}</p>
                                                    <p className="admin-user-role">{userInfo.role === 'superadmin' ? 'Super Admin' : 'Admin'}</p>
                                                </div>
                                            </div>
                                            <div className="admin-user-dropdown-item">
                                                <Link href="/admin/settings" className="admin-user-dropdown-link">
                                                    <Settings size={16} />
                                                    <span>Cài đặt</span>
                                                </Link>
                                            </div>
                                            <div className="admin-user-dropdown-item" onClick={handleLogout}>
                                                <a href="#" className="admin-user-dropdown-link">
                                                    <LogOut size={16} />
                                                    <span>Đăng xuất</span>
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Main content */}
                    <main className="admin-main">
                        {wrappedChildren}
                    </main>
                </div>
            </div>
        );
    }

    // Fallback - không nên đến đây nhưng để phòng ngừa
    return null;
}
