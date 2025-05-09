import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface NotificationBellProps {
    unreadCount?: number;
}

export function NotificationBellIcon({ unreadCount = 0 }: NotificationBellProps) {
    const router = useRouter();

    const handleClick = () => {
        router.push('/notifications');
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className="relative"
        >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 px-1.5 min-w-[20px] h-5 flex items-center justify-center text-xs"
                >
                    {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
            )}
        </Button>
    );
}
