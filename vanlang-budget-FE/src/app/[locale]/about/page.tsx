'use client';

import { useTranslations } from 'next-intl';
import PublicLayout from '@/components/layout/PublicLayout'; // Giả sử bạn muốn sử dụng layout chung

export default function AboutPage() {
    const t = useTranslations('AboutPage'); // Namespace cho translations

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
                <p>{t('description')}</p>
                {/* Thêm nội dung trang About ở đây */}
            </div>
        </PublicLayout>
    );
}
