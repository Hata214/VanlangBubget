'use client';

import { useTranslations } from 'next-intl';
import PublicLayout from '@/components/layout/PublicLayout'; // Giả sử bạn muốn sử dụng layout chung
import { Calendar, CheckSquare, Zap } from 'lucide-react'; // Ví dụ icons

interface RoadmapItem {
    id: string;
    quarter: string; // Ví dụ: Q1 2024
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'planned';
    icon?: React.ReactNode;
}

export default function RoadmapPage() {
    const t = useTranslations('RoadmapPage'); // Namespace cho translations

    // Dữ liệu mẫu cho roadmap - bạn có thể lấy từ API hoặc file JSON
    const roadmapItems: RoadmapItem[] = [
        {
            id: 'q1-feature',
            quarter: t('q1.quarter'),
            title: t('q1.item1.title'),
            description: t('q1.item1.description'),
            status: 'completed',
            icon: <CheckSquare className="h-6 w-6 text-green-500" />
        },
        {
            id: 'q2-enhancement',
            quarter: t('q2.quarter'),
            title: t('q2.item1.title'),
            description: t('q2.item1.description'),
            status: 'in-progress',
            icon: <Zap className="h-6 w-6 text-yellow-500" />
        },
        {
            id: 'q3-new-module',
            quarter: t('q3.quarter'),
            title: t('q3.item1.title'),
            description: t('q3.item1.description'),
            status: 'planned',
            icon: <Calendar className="h-6 w-6 text-blue-500" />
        },
        // Thêm các mục roadmap khác nếu cần
    ];

    const getStatusColor = (status: RoadmapItem['status']) => {
        switch (status) {
            case 'completed': return 'border-green-500';
            case 'in-progress': return 'border-yellow-500';
            case 'planned': return 'border-blue-500';
            default: return 'border-gray-300';
        }
    };

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 text-center">{t('title')}</h1>
                <p className="text-lg text-muted-foreground mb-10 text-center max-w-2xl mx-auto">
                    {t('description')}
                </p>
                <div className="space-y-8">
                    {roadmapItems.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-card p-6 rounded-lg shadow-md border-l-4 ${getStatusColor(item.status)}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-semibold text-primary">{item.title}</h2>
                                <span className="text-sm font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                    {item.quarter}
                                </span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mb-3">
                                {item.icon && <div className="mr-2">{item.icon}</div>}
                                <span>{t(`status.${item.status}`)}</span>
                            </div>
                            <p className="text-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}
