'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import React from 'react';

const AdminAuthWrapper = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Chỉ thực hiện redirect khi status không phải là 'loading'
        if (status !== 'loading') {
            if (status === "unauthenticated" || !session?.user || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'superadmin')) {
                router.push("/admin/login");
            }
        }
    }, [session, status, router]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading admin session...</p>
            </div>
        );
    }

    // Nếu đã xác thực và là admin/superadmin, render children
    if (status === 'authenticated' && session?.user && ((session.user as any).role === 'admin' || (session.user as any).role === 'superadmin')) {
        return <>{children}</>;
    }

    // Trường hợp không được phép truy cập (đã được xử lý bởi useEffect redirect)
    // Hoặc đang chờ redirect
    return null;
};

export default AdminAuthWrapper;
