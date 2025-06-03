'use client';

import { useState } from 'react';
import {
    Home,
    Info,
    Star,
    Map,
    DollarSign,
    Mail,
    ChevronDown,
    ChevronRight,
    Globe,
    AlertCircle
} from 'lucide-react';

interface ContentSidebarProps {
    selectedPage: string;
    currentLanguage: 'vi' | 'en';
    onPageChange: (page: string) => void;
    onLanguageChange: (language: 'vi' | 'en') => void;
    hasChanges: boolean;
}

interface PageItem {
    id: string;
    title: string;
    icon: React.ReactNode;
    description: string;
    sections?: string[];
}

export default function ContentSidebar({
    selectedPage,
    currentLanguage,
    onPageChange,
    onLanguageChange,
    hasChanges
}: ContentSidebarProps) {
    const [expandedSections, setExpandedSections] = useState<string[]>(['pages', 'global']);

    const pages: PageItem[] = [
        {
            id: 'homepage',
            title: 'Trang chủ',
            icon: <Home className="h-5 w-5" />,
            description: 'Trang chủ chính của website',
            sections: ['hero', 'statistics', 'features', 'testimonials', 'pricing', 'cta']
        },
        {
            id: 'about',
            title: 'Giới thiệu',
            icon: <Info className="h-5 w-5" />,
            description: 'Thông tin về công ty và sản phẩm'
        },
        {
            id: 'features',
            title: 'Tính năng',
            icon: <Star className="h-5 w-5" />,
            description: 'Danh sách các tính năng chính'
        },
        {
            id: 'roadmap',
            title: 'Lộ trình',
            icon: <Map className="h-5 w-5" />,
            description: 'Kế hoạch phát triển sản phẩm'
        },
        {
            id: 'pricing',
            title: 'Bảng giá',
            icon: <DollarSign className="h-5 w-5" />,
            description: 'Thông tin về các gói dịch vụ'
        },
        {
            id: 'contact',
            title: 'Liên hệ',
            icon: <Mail className="h-5 w-5" />,
            description: 'Thông tin liên hệ và form'
        }
    ];

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const handlePageClick = (pageId: string) => {
        if (hasChanges) {
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển trang không?')) {
                onPageChange(pageId);
            }
        } else {
            onPageChange(pageId);
        }
    };

    const handleLanguageClick = (language: 'vi' | 'en') => {
        if (hasChanges) {
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển ngôn ngữ không?')) {
                onLanguageChange(language);
            }
        } else {
            onLanguageChange(language);
        }
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Quản lý nội dung
                </h2>
                <p className="text-sm text-gray-600">
                    Chỉnh sửa nội dung trang web trực tiếp
                </p>

                {/* Changes Indicator */}
                {hasChanges && (
                    <div className="mt-3 flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Có thay đổi chưa lưu</span>
                    </div>
                )}
            </div>

            {/* Language Selector */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center mb-2">
                    <Globe className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Ngôn ngữ</span>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => handleLanguageClick('vi')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentLanguage === 'vi'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Tiếng Việt
                    </button>
                    <button
                        onClick={() => handleLanguageClick('en')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentLanguage === 'en'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        English
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
                {/* Pages Section */}
                <div className="p-4">
                    <button
                        onClick={() => toggleSection('pages')}
                        className="flex items-center justify-between w-full text-left mb-3"
                    >
                        <span className="text-sm font-medium text-gray-900">Trang web</span>
                        {expandedSections.includes('pages') ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                    </button>

                    {expandedSections.includes('pages') && (
                        <div className="space-y-1">
                            {pages.map((page) => (
                                <div key={page.id}>
                                    <button
                                        onClick={() => handlePageClick(page.id)}
                                        className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${selectedPage === page.id
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className={`mr-3 ${selectedPage === page.id ? 'text-blue-600' : 'text-gray-400'
                                            }`}>
                                            {page.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">{page.title}</div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {page.description}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Sub-sections for homepage - Removed to avoid API confusion */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Global Elements Section */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => toggleSection('global')}
                        className="flex items-center justify-between w-full text-left mb-3"
                    >
                        <span className="text-sm font-medium text-gray-900">Thành phần chung</span>
                        {expandedSections.includes('global') ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                    </button>

                    {expandedSections.includes('global') && (
                        <div className="space-y-1">
                            <button
                                onClick={() => handlePageClick('header')}
                                className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${selectedPage === 'header'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`mr-3 ${selectedPage === 'header' ? 'text-blue-600' : 'text-gray-400'}`}>
                                    🔝
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">Header</div>
                                    <div className="text-xs text-gray-500 truncate">
                                        Logo, menu điều hướng, nút đăng nhập
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => handlePageClick('footer')}
                                className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${selectedPage === 'footer'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`mr-3 ${selectedPage === 'footer' ? 'text-blue-600' : 'text-gray-400'}`}>
                                    🔻
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">Footer</div>
                                    <div className="text-xs text-gray-500 truncate">
                                        Thông tin công ty, liên kết, bản quyền
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-500 text-center">
                    <p>Content Management System</p>
                    <p className="mt-1">VanLang Budget Admin</p>
                </div>
            </div>
        </div>
    );
}
