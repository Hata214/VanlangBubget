import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAppSelector } from '@/redux/hooks';
import NotificationBell from '../notification/NotificationBell';

interface NavbarProps {
    onLogout?: () => void;
}

interface User {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
    const t = useTranslations();
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user } = useAppSelector((state) => state.auth);

    const isActive = (path: string) => {
        return pathname?.includes(path) ? 'text-primary' : 'text-gray-600 hover:text-primary';
    };

    // Format user display name
    const getUserDisplayName = () => {
        if (user && (user.firstName || user.lastName)) {
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
            return `${t('profile.userPrefix')} ${fullName}`;
        }
        return t('profile.account');
    };

    return (
        <nav className="bg-white shadow-md py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link href="/dashboard" className="text-2xl font-bold text-primary">
                    {t('app.name')}
                </Link>
                <div className="flex gap-4 items-center">
                    <Link href="/dashboard" className={isActive('/dashboard')}>
                        {t('navigation.dashboard')}
                    </Link>
                    <Link href="/incomes" className={isActive('/incomes')}>
                        {t('navigation.incomes')}
                    </Link>
                    <Link href="/expenses" className={isActive('/expenses')}>
                        {t('navigation.expenses')}
                    </Link>
                    <Link href="/loans" className={isActive('/loans')}>
                        {t('navigation.loans')}
                    </Link>
                    <Link href="/reports" className={isActive('/reports')}>
                        {t('navigation.reports')}
                    </Link>

                    <NotificationBell />

                    {/* Dropdown Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 text-gray-600 hover:text-primary focus:outline-none"
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {getUserDisplayName()}
                            </span>
                            <svg
                                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Content */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                <Link
                                    href="/vi/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    {t('profile.account')}
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        onLogout?.();
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    {t('profile.logout')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 