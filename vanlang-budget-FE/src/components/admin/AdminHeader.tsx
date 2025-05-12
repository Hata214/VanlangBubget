import React from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, User, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AdminHeaderProps {
    title?: string;
    userName?: string;
    userEmail?: string;
    userRole?: string;
    onLogout?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
    title = 'Dashboard',
    userName,
    userEmail,
    userRole,
    onLogout
}) => {
    const t = useTranslations('admin');

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
            <div className="text-xl font-semibold text-gray-800 dark:text-white">
                {title || t('header.title')}
            </div>

            <div className="flex items-center space-x-4">
                <ThemeToggle />

                {(userName || userEmail) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                    {userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden md:inline-block">{userName || userEmail}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <div className="px-2 py-1.5">
                                <p className="text-sm font-medium">{userName || userEmail}</p>
                                {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
                                {userRole && (
                                    <p className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 mt-1 inline-block">
                                        {userRole === 'superadmin' ? t('users.roleSuperadmin') : t('users.roleAdmin')}
                                    </p>
                                )}
                            </div>
                            <DropdownMenuItem onClick={onLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                <span>{t('logout') || 'Logout'}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
};

export default AdminHeader;
