import React from 'react';
import Link from 'next/link';

const AdminSidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-gray-800 text-white p-6 space-y-6">
            <div className="text-2xl font-bold">Admin Panel</div>
            <nav>
                <Link href="/admin" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Dashboard
                </Link>
                <Link href="/admin/users" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Quản lý người dùng
                </Link>
                <Link href="/admin/site-content" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Quản lý nội dung trang
                </Link>
                {/* Thêm các link quản lý khác tại đây */}
            </nav>
        </aside>
    );
};

export default AdminSidebar;
