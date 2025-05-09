'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // Kiểm tra token trong localStorage hoặc cookie
        const token = localStorage.getItem('auth_token') ||
            document.cookie.split('; ')
                .find(row => row.startsWith('auth_token='))?.split('=')[1];

        if (token) {
            // Đã đăng nhập, chuyển hướng đến admin dashboard
            console.log('Đã đăng nhập, chuyển hướng đến /admin/dashboard');
            router.push('/admin/dashboard');
        } else {
            // Chưa đăng nhập, chuyển hướng đến trang đăng nhập
            console.log('Chưa đăng nhập, chuyển hướng đến /admin/login');
            router.push('/admin/login');
        }
    }, [router]);

    // Hiển thị trang loading trong khi chuyển hướng
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
                Đang chuyển hướng...
            </p>
        </div>
    );
}
