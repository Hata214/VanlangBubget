'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, RefreshCw, Eye } from 'lucide-react';
import SectionTabs from '@/components/admin/site-content/SectionTabs';
import HomepageSection from '@/components/admin/site-content/HomepageSection';
import HomepagePreview from '@/components/admin/site-content/HomepagePreview';
import AboutPreview from '@/components/admin/site-content/AboutPreview';
import FeaturesPreview from '@/components/admin/site-content/FeaturesPreview';
import RoadmapPreview from '@/components/admin/site-content/RoadmapPreview';
import PricingPreview from '@/components/admin/site-content/PricingPreview';
import ContactPreview from '@/components/admin/site-content/ContactPreview';
import FooterPreview from '@/components/admin/site-content/FooterPreview';
import siteContentService from '@/services/siteContentService';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/redux/hooks';
import '@/components/admin/site-content/wysiwyg-editor.css';

interface ApiResponse {
    data: any;
    success: boolean;
    meta?: {
        updatedAt?: string;
        source?: string;
    };
}

export default function SiteContentPage() {
    const [selectedSection, setSelectedSection] = useState<string>('homepage-vi');
    const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('vi');
    const [content, setContent] = useState<any>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [showFullPreview, setShowFullPreview] = useState<boolean>(false);
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';

    useEffect(() => {
        loadContent();
    }, [selectedSection]);

    const loadContent = async () => {
        setIsLoading(true);
        try {
            const response: ApiResponse = await siteContentService.getContentByType(selectedSection);
            setContent(response.data || {});
        } catch (error) {
            console.error('Lỗi khi tải nội dung:', error);
            toast.error('Không thể tải nội dung. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSectionChange = (newSection: string) => {
        if (hasChanges) {
            // Hiển thị xác nhận nếu có thay đổi chưa lưu
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển sang phần khác không?')) {
                setSelectedSection(newSection);
                setHasChanges(false);
            }
        } else {
            setSelectedSection(newSection);
        }
    };

    const handleSaveContent = async () => {
        setIsSaving(true);
        try {
            await siteContentService.updateContentByType(selectedSection, content);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công!'
                : 'Đã gửi nội dung để SuperAdmin phê duyệt!');
            setHasChanges(false);
        } catch (error) {
            console.error('Lỗi khi lưu nội dung:', error);
            toast.error('Không thể lưu nội dung. Vui lòng thử lại sau.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = (newContent: any) => {
        setContent(newContent);
        setHasChanges(true);
    };

    const handleLanguageChange = (language: 'vi' | 'en') => {
        if (hasChanges) {
            // Hiển thị xác nhận nếu có thay đổi chưa lưu
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển ngôn ngữ không?')) {
                setCurrentLanguage(language);
                // Cập nhật lại selectedSection với ngôn ngữ mới
                const sectionBase = selectedSection.split('-')[0];
                setSelectedSection(`${sectionBase}-${language}`);
                setHasChanges(false);
            }
        } else {
            setCurrentLanguage(language);
            // Cập nhật lại selectedSection với ngôn ngữ mới
            const sectionBase = selectedSection.split('-')[0];
            setSelectedSection(`${sectionBase}-${language}`);
        }
    };

    // Hàm lấy tiêu đề trang dựa trên section
    const getPageTitle = (section: string): string => {
        const sectionBase = section.split('-')[0];

        switch (sectionBase) {
            case 'homepage':
            case 'home':
            case 'hero':
            case 'features':
            case 'testimonials':
            case 'cta':
                return 'Trang chủ';
            case 'about':
                return 'Giới thiệu';
            case 'roadmap':
                return 'Lộ trình';
            case 'pricing':
                return 'Bảng giá';
            case 'contact':
                return 'Liên hệ';
            default:
                return sectionBase.charAt(0).toUpperCase() + sectionBase.slice(1);
        }
    };

    // Hàm lấy đường dẫn trang dựa trên section
    const getPagePath = (section: string): string => {
        const sectionBase = section.split('-')[0];

        switch (sectionBase) {
            case 'homepage':
            case 'home':
            case 'hero':
            case 'features':
            case 'testimonials':
            case 'cta':
                return ''; // Trang chủ là /
            case 'about':
                return '/about';
            case 'roadmap':
                return '/roadmap';
            case 'pricing':
                return '/pricing';
            case 'contact':
                return '/contact';
            default:
                return `/${sectionBase}`;
        }
    };

    const handleResetToFallback = async () => {
        if (window.confirm('Bạn có chắc chắn muốn khôi phục nội dung mặc định? Điều này sẽ xóa tất cả các thay đổi tùy chỉnh.')) {
            setIsLoading(true);
            try {
                await siteContentService.initializeHomepageContent(currentLanguage);
                toast.success('Đã khôi phục nội dung mặc định');
                await loadContent();
            } catch (error) {
                console.error('Lỗi khi khôi phục nội dung mặc định:', error);
                toast.error('Không thể khôi phục nội dung mặc định. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const renderSectionContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            );
        }

        // Xác định section hiện tại từ selectedSection
        const [sectionName] = selectedSection.split('-');

        // Render dựa trên section hiện tại
        switch (sectionName) {
            case 'home':
            case 'homepage':
            case 'hero':
            case 'features':
            case 'testimonials':
            case 'cta':
                // Các section thuộc trang chủ
                return (
                    <HomepageSection
                        section={sectionName}
                        title={sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
                        defaultContent={content}
                        currentLanguage={currentLanguage}
                        onUpdate={() => {
                            loadContent();
                            setHasChanges(false);
                        }}
                    />
                );
            case 'about':
                // Trang Giới thiệu
                return (
                    <HomepageSection
                        section={sectionName}
                        title="Giới thiệu"
                        defaultContent={content}
                        currentLanguage={currentLanguage}
                        onUpdate={() => {
                            loadContent();
                            setHasChanges(false);
                        }}
                    />
                );
            case 'roadmap':
                // Trang Lộ trình
                return (
                    <HomepageSection
                        section={sectionName}
                        title="Lộ trình"
                        defaultContent={content}
                        currentLanguage={currentLanguage}
                        onUpdate={() => {
                            loadContent();
                            setHasChanges(false);
                        }}
                    />
                );
            case 'pricing':
                // Trang Bảng giá
                return (
                    <HomepageSection
                        section={sectionName}
                        title="Bảng giá"
                        defaultContent={content}
                        currentLanguage={currentLanguage}
                        onUpdate={() => {
                            loadContent();
                            setHasChanges(false);
                        }}
                    />
                );
            case 'contact':
                // Trang Liên hệ
                return (
                    <HomepageSection
                        section={sectionName}
                        title="Liên hệ"
                        defaultContent={content}
                        currentLanguage={currentLanguage}
                        onUpdate={() => {
                            loadContent();
                            setHasChanges(false);
                        }}
                    />
                );
            default:
                // Các section khác
                return (
                    <div className="p-4 space-y-4">
                        <h2 className="text-2xl font-bold">{sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}</h2>
                        <p className="text-gray-500">Đang phát triển...</p>
                    </div>
                );
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Quản lý nội dung trang web</h1>
                <div className="flex space-x-4">
                    {/* Nút xem trước toàn trang */}
                    {(selectedSection.startsWith('homepage') ||
                        selectedSection.startsWith('about') ||
                        selectedSection.startsWith('features') ||
                        selectedSection.startsWith('roadmap') ||
                        selectedSection.startsWith('pricing') ||
                        selectedSection.startsWith('contact') ||
                        selectedSection.startsWith('footer')) && (
                            <button
                                onClick={() => setShowFullPreview(!showFullPreview)}
                                className={`flex items-center px-4 py-2 rounded-md ${showFullPreview ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'}`}
                            >
                                <Eye size={16} className="mr-2" />
                                <span>{showFullPreview ? 'Đóng xem trước' : 'Xem trước toàn trang'}</span>
                            </button>
                        )}

                    <button
                        onClick={handleResetToFallback}
                        disabled={isSaving || isLoading}
                        className="flex items-center px-4 py-2 rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        <span>Khôi phục mặc định</span>
                    </button>

                    <button
                        onClick={handleSaveContent}
                        disabled={isSaving || !hasChanges}
                        className="flex items-center px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2" />
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                <span>Lưu thay đổi</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {showFullPreview ? (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="mb-4 p-4 bg-blue-50 rounded-md">
                        <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold mb-2">Xem trước trang {getPageTitle(selectedSection)}</h2>
                                    <p className="text-sm text-gray-600">
                                        Đây là bản xem trước của trang {getPageTitle(selectedSection).toLowerCase()}. Bạn có thể chỉnh sửa nội dung trực tiếp bằng cách nhấp vào các phần tử.
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            // Tìm tất cả các phần tử có thể chỉnh sửa trong phần xem trước
                                            const editableElements = document.querySelectorAll('.preview-container .editable-content');

                                            // Thêm class highlight-editable cho từng phần tử
                                            editableElements.forEach((element, index) => {
                                                setTimeout(() => {
                                                    element.classList.add('highlight-editable');

                                                    // Xóa class sau 3 giây
                                                    setTimeout(() => {
                                                        element.classList.remove('highlight-editable');
                                                    }, 3000);
                                                }, index * 200);
                                            });

                                            toast.success('Đã làm nổi bật các phần tử có thể chỉnh sửa');
                                        }}
                                        className="bg-blue-500 text-white text-xs px-3 py-2 rounded hover:bg-blue-600 transition-colors flex items-center shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Làm nổi bật các phần tử có thể chỉnh sửa
                                    </button>
                                </div>
                            </div>

                            {/* Nút chuyển đổi giữa các trang */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                <button
                                    onClick={() => handleSectionChange('homepage-' + currentLanguage)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedSection.startsWith('homepage') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                >
                                    Trang chủ
                                </button>
                                <button
                                    onClick={() => handleSectionChange('about-' + currentLanguage)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedSection.startsWith('about') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                >
                                    Giới thiệu
                                </button>
                                <button
                                    onClick={() => handleSectionChange('features-' + currentLanguage)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedSection.startsWith('features') && !selectedSection.includes('homepage') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                >
                                    Tính năng
                                </button>
                                <button
                                    onClick={() => handleSectionChange('roadmap-' + currentLanguage)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedSection.startsWith('roadmap') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                >
                                    Lộ trình
                                </button>
                                <button
                                    onClick={() => handleSectionChange('pricing-' + currentLanguage)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedSection.startsWith('pricing') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                >
                                    Bảng giá
                                </button>
                                <button
                                    onClick={() => handleSectionChange('contact-' + currentLanguage)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${selectedSection.startsWith('contact') ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                        }`}
                                >
                                    Liên hệ
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-md p-4 preview-container">
                        {(() => {
                            // Xác định component xem trước dựa trên section
                            if (selectedSection.startsWith('homepage') ||
                                selectedSection.startsWith('hero') ||
                                selectedSection.startsWith('features') ||
                                selectedSection.startsWith('testimonials') ||
                                selectedSection.startsWith('cta')) {
                                return <HomepagePreview content={content} onUpdate={loadContent} />;
                            } else if (selectedSection.startsWith('about')) {
                                return <AboutPreview content={content} onUpdate={loadContent} />;
                            } else if (selectedSection.startsWith('features')) {
                                return <FeaturesPreview content={content} onUpdate={loadContent} />;
                            } else if (selectedSection.startsWith('roadmap')) {
                                return <RoadmapPreview content={content} onUpdate={loadContent} />;
                            } else if (selectedSection.startsWith('pricing')) {
                                return <PricingPreview content={content} onUpdate={loadContent} />;
                            } else if (selectedSection.startsWith('contact')) {
                                return <ContactPreview content={content} onUpdate={loadContent} />;
                            } else if (selectedSection.startsWith('footer')) {
                                return <FooterPreview content={content} onUpdate={loadContent} />;
                            } else {
                                return (
                                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
                                        <div className="text-center">
                                            <p className="text-gray-500 mb-4">Chức năng chỉnh sửa trực tiếp đang được phát triển cho trang này.</p>
                                            <iframe
                                                src={`/${currentLanguage}${getPagePath(selectedSection)}`}
                                                className="w-full h-[600px] border-0"
                                                title={`Xem trước trang ${getPageTitle(selectedSection)}`}
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        })()}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <SectionTabs
                            onSectionChange={handleSectionChange}
                            selectedSection={selectedSection}
                            currentLanguage={currentLanguage}
                            onLanguageChange={handleLanguageChange}
                            className="sticky top-20"
                        />
                    </div>

                    <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md">
                        {renderSectionContent()}
                    </div>
                </div>
            )}
        </div>
    );
}