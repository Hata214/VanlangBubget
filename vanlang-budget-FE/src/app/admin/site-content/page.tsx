'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import SectionTabs from '@/components/admin/site-content/SectionTabs';
import HomepageSection from '@/components/admin/site-content/HomepageSection';
import siteContentService from '@/services/siteContentService';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '@/redux/hooks';

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
            case 'pricing':
                return (
                    <HomepageSection
                        section={sectionName}
                        title={sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
                        defaultContent={content}
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
        <AdminLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Quản lý nội dung trang web</h1>
                    <div className="flex space-x-4">
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
            </div>
        </AdminLayout>
    );
}