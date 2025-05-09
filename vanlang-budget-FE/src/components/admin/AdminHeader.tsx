import React from 'react';

const AdminHeader: React.FC = () => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
            <div className="text-xl font-semibold text-gray-800 dark:text-white">
                Dashboard
            </div>
            {/* Các element header khác như user info, notifications */}
            <div>
                {/* User info hoặc nút logout */}
            </div>
        </header>
    );
};

export default AdminHeader;
