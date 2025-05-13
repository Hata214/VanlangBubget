'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/redux/hooks';
import Link from 'next/link';
import {
    Home,
    Users,
    DollarSign,
    Settings,
    MessageSquare,
    FileText,
    BarChart2,
    LogOut,
    Bell,
    Menu,
    X
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useAppSelector(state => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Kiểm tra kích thước màn hình
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        // Gọi ngay lập tức
        checkScreenSize();

        // Đăng ký sự kiện resize
        window.addEventListener('resize', checkScreenSize);

        // Kiểm tra xem người dùng có phải là admin không
        if (isAuthenticated && (!user || !['admin', 'superadmin'].includes(user.role))) {
            router.push('/dashboard');
        }

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, [isAuthenticated, user, router]);

    // Các mục menu của Admin
    const menuItems = [
        { icon: <Home size={20} />, text: 'Dashboard', link: '/admin/dashboard' },
        { icon: <Users size={20} />, text: 'Quản lý người dùng', link: '/admin/users' },
        { icon: <FileText size={20} />, text: 'Quản lý nội dung', link: '/admin/site-content' },
        { icon: <DollarSign size={20} />, text: 'Giao dịch', link: '/admin/transactions' },
        { icon: <BarChart2 size={20} />, text: 'Báo cáo', link: '/admin/reports' },
        { icon: <Bell size={20} />, text: 'Thông báo', link: '/admin/notifications' },
        { icon: <MessageSquare size={20} />, text: 'Hỗ trợ', link: '/admin/support' },
        { icon: <Settings size={20} />, text: 'Cài đặt', link: '/admin/settings' },
    ];

    // Kiểm tra đường dẫn hiện tại có khớp với mục menu không
    const isActive = (path: string) => {
        if (typeof window !== 'undefined') {
            return window.location.pathname.startsWith(path);
        }
        return false;
    };

    // Xử lý đăng xuất
    const handleLogout = () => {
        // Implement đăng xuất ở đây
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Overlay cho mobile */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out bg-white border-r md:relative md:translate-x-0`}
            >
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
                        {isMobile && (
                            <button onClick={() => setSidebarOpen(false)}>
                                <X size={24} />
                            </button>
                        )}
                    </div>
                </div>

                <nav className="mt-4">
                    <ul className="space-y-1">
                        {menuItems.map((item, index) => (
                            <li key={index}>
                                <Link href={item.link}>
                                    <div
                                        className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-300 transform rounded-md ${isActive(item.link)
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'hover:bg-gray-100 hover:text-gray-700'
                                            }`}
                                    >
                                        {item.icon}
                                        <span className="mx-4 font-medium">{item.text}</span>
                                    </div>
                                </Link>
                            </li>
                        ))}

                        <li className="mt-8">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-300 transform rounded-md"
                            >
                                <LogOut size={20} />
                                <span className="mx-4 font-medium">Đăng xuất</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            className="text-gray-500 focus:outline-none md:hidden"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu size={24} />
                        </button>

                        <div className="flex items-center">
                            <Link href="/admin/notifications" className="mr-4 relative">
                                <Bell size={20} />
                                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                            </Link>
                            <span className="text-sm font-medium">
                                {user?.firstName} {user?.lastName}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-x-hidden bg-gray-100">
                    {children}
                </main>
            </div>
        </div>
    );
} 