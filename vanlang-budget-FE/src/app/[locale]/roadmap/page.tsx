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
    icon?: React.ReactNode;
}

export default function RoadmapPage() {
    const t = useTranslations();
    const locale = useLocale()
    const router = useRouter()
    const { content: roadmapContent, isLoading } = useAdminContent('roadmap', locale)

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
                {/* Language Switcher */}
                <div className="flex justify-end mb-6">
                    <div className="flex items-center space-x-2 bg-card border border-border rounded-lg p-1">
                        <Globe className="h-4 w-4 text-muted-foreground ml-2" />
                        <button
                            onClick={() => handleLanguageChange('vi')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${locale === 'vi'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Tiếng Việt
                        </button>
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${locale === 'en'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            English
                        </button>
                    </div>
                </div>

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
                    {(roadmapContent?.milestones || roadmapContent?.items || roadmapItems).map((item: any, index: number) => (
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
                                {item.icon && <div className="mr-2">{item.icon}</div>}
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
