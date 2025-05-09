import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Thông báo | VanLang Budget',
    description: 'Xem tất cả thông báo của bạn',
}

export default function NotificationsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {children}
        </>
    )
} 