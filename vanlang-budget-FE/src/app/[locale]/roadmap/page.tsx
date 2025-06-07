'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link'
import PublicLayout from '@/components/layout/PublicLayout';
import { Calendar, CheckSquare, Zap, Globe, ChevronLeft } from 'lucide-react';
import useAdminContent from '@/hooks/useAdminContent'

interface RoadmapItem {
    id: string;
    quarter: string; // Ví dụ: Q1 2024
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'planned';
    icon?: React.ReactNode; // API có thể trả về tên icon dạng string thay vì ReactNode
    iconName?: string; // Thêm để hỗ trợ tên icon từ API
    completed?: boolean; // API có thể dùng 'completed' thay cho 'status'
    date?: string; // API có thể dùng 'date' thay cho 'quarter'
}

interface RoadmapContent {
    title?: string;
    description?: string;
    milestones?: RoadmapItem[];
    items?: RoadmapItem[];
}

export default function RoadmapPage() {
    const t = useTranslations();
    const locale = useLocale()
    const router = useRouter()
    const { content: roadmapContent, isLoading } = useAdminContent<RoadmapContent>('roadmap', locale)

    // Language switcher handler
    const handleLanguageChange = (newLocale: 'vi' | 'en') => {
        router.push(`/${newLocale}/roadmap`)
    }

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

    if (isLoading) {
        return (
            <PublicLayout>
                <div className="container mx-auto py-12">
                    <div className="flex justify-center items-center min-h-[50vh]">
                        <div className="animate-pulse text-xl">{t('common.loading')}</div>
                    </div>
                </div>
            </PublicLayout>
        )
    }

    return (
        <PublicLayout>
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span>{t('common.backToHome')}</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                        {roadmapContent?.title || t('roadmap.title')}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 text-center max-w-3xl mx-auto">
                        {roadmapContent?.description || t('roadmap.description')}
                    </p>
                </div>
                <div className="space-y-8">
                    {/* Sử dụng roadmap items từ admin content nếu có, nếu không dùng fallback */}
                    {(roadmapContent?.milestones || roadmapContent?.items || roadmapItems).map((item: RoadmapItem, index: number) => (
                        <div
                            key={item.id || index}
                            className={`bg-card p-6 rounded-lg shadow-md border-l-4 ${getStatusColor(item.status || (item.completed ? 'completed' : 'planned'))}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-semibold text-primary">{item.title}</h2>
                                <span className="text-sm font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                    {item.quarter || item.date}
                                </span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mb-3">
                                {item.iconName ? (
                                    // Render icon từ iconName nếu có (từ API)
                                    // Giả sử bạn có một hàm renderIcon tương tự như trang Features
                                    // Nếu không, bạn cần tạo hoặc điều chỉnh hàm getStatusColor/icon logic
                                    <Zap className="h-5 w-5 mr-2" /> // Placeholder, thay thế bằng logic render icon thực tế
                                ) : item.icon ? (
                                    <div className="mr-2">{item.icon}</div> // Fallback cho icon ReactNode từ dữ liệu mẫu
                                ) : null}
                                <span>
                                    {(item.status === 'completed' || item.completed) ? (locale === 'vi' ? 'Hoàn thành' : 'Completed') :
                                        item.status === 'in-progress' ? (locale === 'vi' ? 'Đang thực hiện' : 'In Progress') :
                                            (locale === 'vi' ? 'Đã lên kế hoạch' : 'Planned')}
                                </span>
                            </div>
                            <p className="text-foreground">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}
