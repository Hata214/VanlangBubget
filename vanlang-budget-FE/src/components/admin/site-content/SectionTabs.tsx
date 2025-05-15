'use client';

import { useState, useEffect } from 'react';
import { Home, FileText, ScrollText, Mail, DollarSign } from 'lucide-react';
import ContentTabs from './ContentTabs';
import { toast } from 'react-hot-toast';

interface SectionTabsProps {
    onSectionChange: (section: string) => void;
    selectedSection: string;
    currentLanguage: 'vi' | 'en';
    onLanguageChange: (language: 'vi' | 'en') => void;
    className?: string;
}

export default function SectionTabs({
    onSectionChange,
    selectedSection,
    currentLanguage,
    onLanguageChange,
    className
}: SectionTabsProps) {
    // Cấu trúc sections - mỗi section chính có các sub-section
    const sections = [
        {
            id: 'homepage',
            label: currentLanguage === 'vi' ? 'Trang chủ' : 'Home',
            icon: <Home size={18} />,
            subsections: [
                { id: 'hero', label: currentLanguage === 'vi' ? 'Banner chính' : 'Hero' },
                { id: 'features', label: currentLanguage === 'vi' ? 'Tính năng' : 'Features' },
                { id: 'testimonials', label: currentLanguage === 'vi' ? 'Đánh giá' : 'Testimonials' },
                { id: 'cta', label: currentLanguage === 'vi' ? 'Kêu gọi hành động' : 'Call to Action' }
            ]
        },
        {
            id: 'about',
            label: currentLanguage === 'vi' ? 'Giới thiệu' : 'About',
            icon: <FileText size={18} />,
            subsections: []
        },
        {
            id: 'features',
            label: currentLanguage === 'vi' ? 'Tính năng' : 'Features',
            icon: <ScrollText size={18} />,
            subsections: []
        },
        {
            id: 'roadmap',
            label: currentLanguage === 'vi' ? 'Lộ trình' : 'Roadmap',
            icon: <ScrollText size={18} />,
            subsections: []
        },
        {
            id: 'pricing',
            label: currentLanguage === 'vi' ? 'Bảng giá' : 'Pricing',
            icon: <DollarSign size={18} />,
            subsections: []
        },
        {
            id: 'contact',
            label: currentLanguage === 'vi' ? 'Liên hệ' : 'Contact',
            icon: <Mail size={18} />,
            subsections: []
        }
    ];

    // Lấy section hiện tại và subsection
    const [activeMainSection, setActiveMainSection] = useState<string>('homepage');
    const [activeSubSection, setActiveSubSection] = useState<string | null>(null);

    // Tìm section chính từ selectedSection
    useEffect(() => {
        // Format của selectedSection: 'section-lang' hoặc 'subsection-lang'
        const parts = selectedSection.split('-');
        const sectionName = parts[0];

        // Kiểm tra xem sectionName có phải là một subsection không
        const mainSection = sections.find(section =>
            section.subsections.some(sub => sub.id === sectionName)
        );

        if (mainSection) {
            setActiveMainSection(mainSection.id);
            setActiveSubSection(sectionName);
        } else {
            setActiveMainSection(sectionName);
            setActiveSubSection(null);
        }
    }, [selectedSection]);

    // Xử lý khi chọn một section hoặc subsection
    const handleSectionSelect = (sectionId: string, subSectionId?: string) => {
        setActiveMainSection(sectionId);
        setActiveSubSection(subSectionId || null);

        // Gửi sự kiện thay đổi section lên component cha
        const selectedId = subSectionId || sectionId;
        onSectionChange(`${selectedId}-${currentLanguage}`);
    };

    // Tạo tab chính
    const mainTabs = sections.map(section => ({
        id: section.id,
        label: (
            <div className="flex items-center space-x-2">
                {section.icon}
                <span>{section.label}</span>
            </div>
        ),
        content: section.subsections.length > 0 ? (
            <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">
                    {section.label} {currentLanguage === 'vi' ? 'Các phần' : 'Sections'}
                </h3>
                <div className="flex flex-wrap gap-2">
                    {/* Nút cho trang tổng thể */}
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeSubSection === null
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                            }`}
                        onClick={() => handleSectionSelect(section.id)}
                    >
                        {currentLanguage === 'vi' ? 'Tất cả' : 'All Content'}
                    </button>

                    {/* Các nút cho subsection */}
                    {section.subsections.map(subsection => (
                        <button
                            key={subsection.id}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${activeSubSection === subsection.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                                }`}
                            onClick={() => handleSectionSelect(section.id, subsection.id)}
                        >
                            {subsection.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800">
                    <p>
                        {currentLanguage === 'vi'
                            ? `Bạn đang chỉnh sửa nội dung "${section.label}" bằng Tiếng Việt`
                            : `You are editing "${section.label}" content in English`
                        }
                    </p>
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">
                    {section.label} {currentLanguage === 'vi' ? 'Nội dung' : 'Content'}
                </h3>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800">
                    <p>
                        {currentLanguage === 'vi'
                            ? `Bạn đang chỉnh sửa nội dung "${section.label}" bằng Tiếng Việt`
                            : `You are editing "${section.label}" content in English`
                        }
                    </p>
                </div>
            </div>
        )
    }));

    return (
        <ContentTabs
            tabs={mainTabs}
            defaultActiveTab={activeMainSection}
            orientation="vertical"
            className={className}
            withLanguageToggle={true}
            currentLanguage={currentLanguage}
            onLanguageChange={(newLanguage) => {
                onLanguageChange(newLanguage);

                // Hiển thị thông báo
                toast.success(
                    newLanguage === 'vi'
                        ? 'Đã chuyển sang tiếng Việt'
                        : 'Switched to English'
                );
            }}
        />
    );
}