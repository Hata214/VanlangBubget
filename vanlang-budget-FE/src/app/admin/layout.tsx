// 'use client' // Không cần 'use client' ở đây nữa nếu AdminAuthWrapper xử lý client logic

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import QueryProvider from '@/components/providers/QueryProvider';
import AdminAuthWrapper from '@/components/auth/AdminAuthWrapper'; // Import AdminAuthWrapper

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    // Logic xác thực và redirect giờ đây nằm trong AdminAuthWrapper
    return (
        <AdminAuthWrapper>
            <QueryProvider>
                <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
                    <AdminSidebar />
                    <div className="flex-1 flex flex-col">
                        <AdminHeader />
                        <main className="flex-1 p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </QueryProvider>
        </AdminAuthWrapper>
    );
};

export default AdminLayout;
