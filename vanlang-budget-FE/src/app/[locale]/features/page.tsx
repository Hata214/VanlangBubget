'use client';

import { useTranslations } from 'next-intl';
import PublicLayout from '@/components/layout/PublicLayout'; // Giả sử bạn muốn sử dụng layout chung
import { CheckCircle } from 'lucide-react'; // Ví dụ icon

// Giả sử bạn có một cấu trúc dữ liệu cho các tính năng
interface FeatureItem {
    id: string;
    title: string;
    description: string;
    icon?: React.ReactNode; // Icon là tùy chọn
}

export default function FeaturesPage() {
    const t = useTranslations('FeaturesPage'); // Namespace cho translations

    // Dữ liệu mẫu cho các tính năng - bạn có thể lấy từ API hoặc file JSON
    const featuresList: FeatureItem[] = [
        {
            id: 'expense-tracking',
            title: t('feature1.title'),
            description: t('feature1.description'),
            icon: <CheckCircle className="h-6 w-6 text-primary" />
        },
        {
            id: 'budget-management',
            title: t('feature2.title'),
            description: t('feature2.description'),
            icon: <CheckCircle className="h-6 w-6 text-primary" />
        },
        {
            id: 'financial-analysis',
            title: t('feature3.title'),
            description: t('feature3.description'),
            icon: <CheckCircle className="h-6 w-6 text-primary" />
        },
        // Thêm các tính năng khác nếu cần
    ];

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 text-center">{t('title')}</h1>
                <p className="text-lg text-muted-foreground mb-10 text-center">
                    {t('description')}
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuresList.map((feature) => (
                        <div key={feature.id} className="bg-card p-6 rounded-lg shadow-md border border-border">
                            <div className="flex items-center mb-3">
                                {feature.icon && <div className="mr-3">{feature.icon}</div>}
                                <h2 className="text-xl font-semibold text-primary">{feature.title}</h2>
                            </div>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}
