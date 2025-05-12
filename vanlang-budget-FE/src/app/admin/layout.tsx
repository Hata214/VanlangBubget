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
    ChevronDown,
    Shield,
    Activity
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
            console.log('Kiểm tra quyền admin truy cập cho đường dẫn:', pathname);

            try {
                // Lấy token từ localStorage hoặc cookie
                const token = localStorage.getItem('auth_token') ||
                    document.cookie.split('; ')
                        .find(row => row.startsWith('auth_token='))?.split('=')[1];

                console.log('Token found:', token ? 'Yes' : 'No');

                if (!token) {
                    console.log("Không tìm thấy token, chuyển hướng đến trang đăng nhập");
                    router.push('/admin/login');
                    return;
                }

                // Xử lý token giả lập trực tiếp (cho môi trường phát triển)
                if (token.startsWith('mock_')) {
                    console.log("Xác thực với token giả lập:", token);

                    // Kiểm tra nếu token có chứa admin hoặc superadmin
                    if (token.includes('admin') || token.includes('superadmin')) {
                        // Lấy thông tin người dùng từ localStorage
                        const email = localStorage.getItem('user_email') || 'admin@example.com';
                        const name = localStorage.getItem('user_name') || 'Admin User';
                        const role = token.includes('superadmin') ? 'superadmin' : 'admin';

                        console.log("Thông tin người dùng giả lập:", { email, name, role });

                        // Cập nhật thông tin người dùng vào state
                        setIsAuthorized(true);
                        setUserInfo({
                            id: role === 'superadmin' ? '1' : '2',
                            email: email,
                            name: name,
                            role: role
                        });

                        localStorage.setItem('user_role', role);
                        setIsLoading(false);
                        return;
                    } else {
                        console.log("Token giả lập không hợp lệ, không có quyền admin");
                        clearUserData();
                        router.push('/admin/login');
                        return;
                    }
                }

                // Xác thực token với API admin/auth/verify
                console.log("Gọi API xác thực token admin");

                try {
                    const response = await fetch('/api/admin/auth/verify', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    console.log("API admin auth verify response status:", response.status);

                    if (response.ok) {
                        const userData = await response.json();
                        console.log("Xác thực admin thành công:", userData);

                        if (userData.success && userData.user && ['admin', 'superadmin'].includes(userData.user.role)) {
                            console.log("Người dùng có quyền admin:", userData.user.role);

                            setIsAuthorized(true);
                            setUserInfo(userData.user);

                            // Lưu thông tin người dùng vào localStorage
                            if (userData.user) {
                                localStorage.setItem('user_email', userData.user.email);
                                localStorage.setItem('user_name', userData.user.name || userData.user.email);
                                localStorage.setItem('user_role', userData.user.role);
                            }
                        } else {
                            console.log("Tài khoản không có quyền admin:", userData);
                            clearUserData();
                            router.push('/admin/login?error=unauthorized');
                        }
                    } else {
                        // Kiểm tra nếu token đã hết hạn hoặc không hợp lệ
                        const errorData = await response.json();
                        console.log("Lỗi xác thực:", errorData);

                        // Xóa token và chuyển hướng về trang đăng nhập
                        clearUserData();
                        router.push('/admin/login?error=invalid_token');
                    }
                } catch (fetchError) {
                    console.error("Lỗi khi gọi API xác thực:", fetchError);

                    // Thử gọi API verify-token trực tiếp từ backend 
                    try {
                        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                        const directResponse = await fetch(`${backendUrl}/api/auth/verify-token`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        console.log("Backend direct verify response:", directResponse.status);

                        if (directResponse.ok) {
                            const directData = await directResponse.json();
                            console.log("Backend direct verification success:", directData);

                            // Kiểm tra quyền admin
                            if (directData.success && directData.user &&
                                (directData.user.role === 'admin' || directData.user.role === 'superadmin')) {

                                setIsAuthorized(true);
                                setUserInfo({
                                    id: directData.user._id || directData.user.id,
                                    email: directData.user.email,
                                    name: directData.user.name || directData.user.email,
                                    role: directData.user.role
                                });

                                // Lưu thông tin người dùng
                                localStorage.setItem('user_email', directData.user.email);
                                localStorage.setItem('user_name', directData.user.name || directData.user.email);
                                localStorage.setItem('user_role', directData.user.role);
                            } else {
                                console.log("Tài khoản không có quyền admin từ backend API");
                                clearUserData();
                                router.push('/admin/login?error=unauthorized');
                            }
                        } else {
                            clearUserData();
                            router.push('/admin/login?error=backend_error');
                        }
                    } catch (directError) {
                        console.error("Lỗi khi gọi backend trực tiếp:", directError);
                        clearUserData();
                        router.push('/admin/login?error=connection');
                    }
                }
            } catch (error) {
                console.error("Lỗi khi xác thực quyền admin:", error);
                clearUserData();
                router.push('/admin/login?error=unknown');
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
        { icon: Activity, label: 'Lịch sử hoạt động', path: '/admin/activity-logs', active: pathname === '/admin/activity-logs' },
    ];

    // Menu items chỉ dành cho SuperAdmin
    const superAdminItems = [
        { icon: Shield, label: 'Quản lý Admin', path: '/admin/manage-admins', active: pathname === '/admin/manage-admins' },
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

                            {/* Hiện thị menu đặc biệt chỉ dành cho SuperAdmin */}
                            {userInfo && userInfo.role === 'superadmin' && (
                                <>
                                    <li className="admin-sidebar-separator">
                                        <div className="admin-sidebar-separator-text">Quản trị viên cao cấp</div>
                                    </li>
                                    {superAdminItems.map((item, index) => (
                                        <li key={`super-admin-${index}`}>
                                            <Link href={item.path} className={`admin-sidebar-link admin-superadmin-link ${item.active ? 'active' : ''}`}>
                                                <item.icon size={20} />
                                                <span className="admin-sidebar-label">{item.label}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </>
                            )}
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
                                        <div className="admin-user-info">
                                            <span className="admin-user-name">{userInfo.name || userInfo.email}</span>
                                            <span className="admin-user-role">
                                                {userInfo.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                            </span>
                                        </div>
                                        <ChevronDown size={16} />
                                    </button>

                                    {userMenuOpen && (
                                        <div className="admin-user-dropdown">
                                            <div className="admin-user-dropdown-header">
                                                <div className="admin-user-dropdown-name">{userInfo.name || userInfo.email}</div>
                                                <div className="admin-user-dropdown-email">{userInfo.email}</div>
                                                <div className={`admin-user-dropdown-role ${userInfo.role === 'superadmin' ? 'superadmin' : 'admin'}`}>
                                                    {userInfo.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                                </div>
                                            </div>
                                            <div className="admin-user-dropdown-items">
                                                <button className="admin-user-dropdown-item" onClick={handleLogout}>
                                                    <LogOut size={16} />
                                                    <span>Đăng xuất</span>
                                                </button>
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

// Tạo hàm riêng để xóa dữ liệu người dùng để tránh lặp code
const clearUserData = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');

    // Xóa cookies
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};
