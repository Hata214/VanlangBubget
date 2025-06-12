'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Save,
    RefreshCw,
    Eye,
    CheckCircle,
    XCircle,
    Edit3,
    Globe,
    Monitor,
    Smartphone,
    Tablet,
    ArrowUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import siteContentService from '@/services/siteContentService';
import { NextIntlClientProvider } from 'next-intl';
import messagesEn from '@/messages/en.json';
import messagesVi from '@/messages/vi.json';
import { useSiteContent as useGlobalSiteContent } from '@/components/SiteContentProvider'; // Alias to avoid naming conflict
import ContentSidebar from './ContentSidebar';
import PagePreview from './PagePreview';
import InlineEditor from './InlineEditor';

interface User {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

interface FullPageContentManagerProps {
    user: User | null;
}

interface ContentData {
    [key: string]: any;
}

const HOMEPAGE_SECTIONS = ['homepage', 'testimonials']; // 'testimonials' là ví dụ, cần xem lại các section thực tế của homepage

export default function FullPageContentManager({ user }: FullPageContentManagerProps) {
    const [selectedPage, setSelectedPage] = useState<string>('homepage');
    const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('vi');
    const [fullContent, setFullContent] = useState<ContentData | null>(null); // Stores the entire multi-language content object e.g., { vi: {...}, en: {...} }
    const [currentLangContent, setCurrentLangContent] = useState<ContentData>({}); // Stores content for the currently selected language
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [previewKey, setPreviewKey] = useState<number>(0);
    const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

    const previewAreaRef = useRef<HTMLDivElement>(null);
    const isSuperAdmin = user?.role === 'superadmin';
    const { refreshContent: refreshGlobalContent } = useGlobalSiteContent(); // Get the global refresh function

    useEffect(() => {
        loadContent();
    }, [selectedPage]); // Reload content when selectedPage changes

    useEffect(() => {
        console.log('🔄 useEffect triggered - fullContent:', fullContent, 'currentLanguage:', currentLanguage);

        if (fullContent && typeof fullContent === 'object') {
            // Check if fullContent has the expected multilingual structure
            if (fullContent[currentLanguage]) {
                console.log(`🌐 Setting currentLangContent for language: ${currentLanguage}`, fullContent[currentLanguage]);
                setCurrentLangContent(fullContent[currentLanguage]);
            } else {
                // Fallback: if current language doesn't exist, try to use the content directly
                // This handles cases where content might not be in multilingual format yet
                console.warn(`⚠️ No content found for language: ${currentLanguage}, available languages:`, Object.keys(fullContent));

                // Try to find any available language content
                const availableLanguages = Object.keys(fullContent);
                if (availableLanguages.length > 0 && typeof fullContent[availableLanguages[0]] === 'object') {
                    console.log(`🔄 Using fallback language: ${availableLanguages[0]}`);
                    setCurrentLangContent(fullContent[availableLanguages[0]]);
                } else {
                    // If no proper language structure, use fullContent directly (legacy format)
                    console.log('🔄 Using fullContent directly (legacy format)');
                    setCurrentLangContent(fullContent);
                }
            }
            setPreviewKey(prev => prev + 1); // Force preview update when language or full content changes
        } else {
            console.log('🔄 No fullContent available, setting empty currentLangContent');
            setCurrentLangContent({});
        }
    }, [currentLanguage, fullContent]);

    useEffect(() => {
        const previewArea = previewAreaRef.current;
        if (!previewArea) return;
        const handleScroll = () => setShowScrollTop(previewArea.scrollTop > 300);
        previewArea.addEventListener('scroll', handleScroll);
        return () => previewArea.removeEventListener('scroll', handleScroll);
    }, []);

    const loadContent = async () => {
        setIsLoading(true);
        setFullContent(null);
        setCurrentLangContent({});
        try {
            const validPages = ['homepage', 'about', 'features', 'roadmap', 'pricing', 'contact', 'header', 'footer'];
            const basePage = selectedPage.split('-')[0];

            if (!validPages.includes(basePage)) {
                console.warn(`Invalid page type: ${selectedPage}, defaulting to homepage`);
                setSelectedPage('homepage');
                setIsLoading(false);
                return;
            }

            const contentKeyForApi = basePage; // Use basePage (e.g., 'homepage', 'about') for API call
            console.log('🔄 Loading content for type:', contentKeyForApi);

            const response = await siteContentService.getContentByType(contentKeyForApi);
            console.log('✅ Loaded full SiteContent document:', response);

            if (response && response.data && response.data.content) {
                setFullContent(response.data.content); // response.data.content is the multi-lang object {vi: ..., en: ...}
            } else if (response && response.data && Object.keys(response.data).length > 0 && !response.data.content && (basePage === 'header' || basePage === 'footer')) {
                // Fallback for header/footer if content is directly in response.data (older structure)
                setFullContent(response.data);
                console.warn(`Content for ${basePage} might be in an older format. Using response.data directly.`);
            }
            else {
                setFullContent({});
                toast.error('Không có dữ liệu nội dung hoặc định dạng không đúng.');
            }
        } catch (error) {
            console.error('Lỗi khi tải nội dung:', error);
            toast.error('Không thể tải nội dung. Vui lòng thử lại sau.');
            setFullContent({});
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: string) => {
        if (hasChanges) {
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển trang không?')) {
                setSelectedPage(newPage);
                setHasChanges(false);
                setEditingField(null);
            }
        } else {
            setSelectedPage(newPage);
            setEditingField(null);
        }
    };

    const handleLanguageChange = (language: 'vi' | 'en') => {
        if (hasChanges) {
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn chuyển ngôn ngữ không?')) {
                setCurrentLanguage(language);
                setHasChanges(false);
                setEditingField(null);
            }
        } else {
            setCurrentLanguage(language);
            setEditingField(null);
        }
    };

    const handleContentChange = (field: string, value: any) => {
        // Update currentLangContent for immediate UI reflection
        const newCurrentLangContent = { ...currentLangContent };
        // Logic for nested updates
        let targetInCurrent = newCurrentLangContent;
        if (field.includes('.')) {
            const fieldParts = field.split('.');
            for (let i = 0; i < fieldParts.length - 1; i++) {
                targetInCurrent[fieldParts[i]] = { ...targetInCurrent[fieldParts[i]] } as ContentData;
                targetInCurrent = targetInCurrent[fieldParts[i]] as ContentData;
            }
            targetInCurrent[fieldParts[fieldParts.length - 1]] = value;
        } else {
            newCurrentLangContent[field] = value;
        }
        setCurrentLangContent(newCurrentLangContent);

        // Update fullContent (the master multi-language object)
        setFullContent(prevFullContent => {
            const newFullContent = { ...prevFullContent };
            newFullContent[currentLanguage] = newCurrentLangContent; // Assign the updated current language content
            console.log('📚 Updated fullContent state:', newFullContent);
            return newFullContent;
        });
        setHasChanges(true);
    };

    const handleSaveContent = async () => {
        if (!fullContent) {
            toast.error('Không có nội dung để lưu.');
            return;
        }
        setIsSaving(true);
        try {
            const basePage = selectedPage.split('-')[0];
            // For API, always use the base page type (e.g., 'homepage', 'about')
            const contentKeyForApi = basePage;

            console.log('💾 Saving content for type:', contentKeyForApi, 'Language being edited:', currentLanguage);
            console.log('💾 Full multi-language content to save:', JSON.stringify(fullContent, null, 2));

            // Backend's updateContentByType expects the full multi-language content object
            // and the language that was primarily edited.
            await siteContentService.updateContentByType(
                contentKeyForApi,
                fullContent, // Send the entire { vi: {...}, en: {...} } object
                currentLanguage // Language primarily being edited
            );

            toast.success(isSuperAdmin ? 'Đã lưu thành công!' : 'Đã gửi nội dung để SuperAdmin phê duyệt!');
            setHasChanges(false);
            setEditingField(null);
            await loadContent(); // Reload to get fresh data for admin preview

            // Refresh global content after local operations are done
            if (refreshGlobalContent) {
                console.log('Attempting to refresh global site content from FullPageContentManager...');
                await refreshGlobalContent();
                console.log('Global site content refresh triggered from FullPageContentManager.');
            }
        } catch (error) {
            console.error('Lỗi khi lưu nội dung:', error);
            toast.error('Không thể lưu nội dung. Vui lòng thử lại sau.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetToDefault = async () => {
        if (window.confirm('Bạn có chắc chắn muốn khôi phục nội dung mặc định? Điều này sẽ xóa tất cả các thay đổi tùy chỉnh.')) {
            setIsLoading(true);
            try {
                const basePage = selectedPage.split('-')[0];
                // Assuming initializeContentByType and initializeHomepageContent now handle multi-language reset correctly if needed,
                // or reset for the specified language. For simplicity, we might reset all languages to default.
                // The service call might need adjustment if it's language-specific for reset.
                // For now, let's assume it resets the current language or all if not specified.
                if (basePage === 'homepage') {
                    await siteContentService.initializeHomepageContent(); // Consider if this should be language specific
                } else {
                    await siteContentService.initializeContentByType(basePage); // Same consideration
                }
                toast.success(`Đã khôi phục nội dung mặc định cho trang ${getPageTitle(basePage)}`);
                setHasChanges(false);
                setEditingField(null);
                await loadContent();
            } catch (error) {
                console.error('Lỗi khi khôi phục nội dung mặc định:', error);
                toast.error('Không thể khôi phục nội dung mặc định.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleApproveContent = async () => {
        if (window.confirm('Bạn có chắc chắn muốn phê duyệt nội dung này?')) {
            setIsLoading(true);
            try {
                const basePage = selectedPage.split('-')[0];
                await siteContentService.approveContentByType(basePage); // approveContentByType handles homepage internally
                toast.success(`Đã phê duyệt nội dung cho trang ${getPageTitle(basePage)}`);
                await loadContent();
            } catch (error) {
                console.error('Lỗi khi phê duyệt nội dung:', error);
                toast.error('Không thể phê duyệt nội dung.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleRejectContent = async () => {
        const reason = prompt('Vui lòng nhập lý do từ chối:');
        if (reason !== null) {
            setIsLoading(true);
            try {
                const basePage = selectedPage.split('-')[0];
                await siteContentService.rejectContentByType(basePage, reason); // rejectContentByType handles homepage internally
                toast.success(`Đã từ chối nội dung cho trang ${getPageTitle(basePage)}`);
                await loadContent();
            } catch (error) {
                console.error('Lỗi khi từ chối nội dung:', error);
                toast.error('Không thể từ chối nội dung.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const getPageTitle = (page: string): string => {
        const titles: { [key: string]: string } = {
            homepage: 'Trang chủ',
            about: 'Giới thiệu',
            features: 'Tính năng',
            roadmap: 'Lộ trình',
            pricing: 'Bảng giá',
            contact: 'Liên hệ',
            header: 'Header',
            footer: 'Footer'
        };
        return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
    };

    const toggleEditMode = () => {
        if (isEditMode && hasChanges) {
            if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có muốn lưu trước khi thoát chế độ chỉnh sửa?')) {
                handleSaveContent();
            }
        }
        setIsEditMode(!isEditMode);
        setEditingField(null);
    };

    const highlightEditableElements = () => {
        const editableElements = document.querySelectorAll('.editable-content');
        editableElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('highlight-editable');
                setTimeout(() => {
                    element.classList.remove('highlight-editable');
                }, 3000);
            }, index * 200);
        });
        toast.success('Đã làm nổi bật các phần tử có thể chỉnh sửa');
    };

    const scrollToTop = () => {
        if (previewAreaRef.current) {
            previewAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <ContentSidebar
                selectedPage={selectedPage}
                currentLanguage={currentLanguage}
                onPageChange={handlePageChange}
                onLanguageChange={handleLanguageChange}
                hasChanges={hasChanges}
            />
            <div className="flex-1 flex flex-col min-h-screen">
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {getPageTitle(selectedPage)}
                            </h1>
                            <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                    {currentLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('desktop')}
                                    className={`p-2 rounded ${viewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                                    title="Desktop View"
                                >
                                    <Monitor className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('tablet')}
                                    className={`p-2 rounded ${viewMode === 'tablet' ? 'bg-white shadow-sm' : ''}`}
                                    title="Tablet View"
                                >
                                    <Tablet className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('mobile')}
                                    className={`p-2 rounded ${viewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                                    title="Mobile View"
                                >
                                    <Smartphone className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                onClick={toggleEditMode}
                                className={`flex items-center px-4 py-2 rounded-lg ${isEditMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                {isEditMode ? 'Thoát chỉnh sửa' : 'Chỉnh sửa'}
                            </button>
                            {isEditMode && (
                                <button
                                    onClick={highlightEditableElements}
                                    className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Làm nổi bật
                                </button>
                            )}
                            <button
                                onClick={() => { loadContent(); setPreviewKey(prev => prev + 1); }}
                                disabled={isLoading}
                                className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                                title="Làm mới preview"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>
                            <button
                                onClick={handleResetToDefault}
                                disabled={isSaving || isLoading}
                                className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Khôi phục
                            </button>
                            {isSuperAdmin && (
                                <>
                                    <button
                                        onClick={handleApproveContent}
                                        disabled={isSaving || isLoading}
                                        className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Phê duyệt
                                    </button>
                                    <button
                                        onClick={handleRejectContent}
                                        disabled={isSaving || isLoading}
                                        className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 disabled:opacity-50"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Từ chối
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleSaveContent}
                                disabled={isSaving || !hasChanges}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Lưu thay đổi
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    ref={previewAreaRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative"
                >
                    <NextIntlClientProvider
                        locale={currentLanguage}
                        messages={currentLanguage === 'en' ? messagesEn : messagesVi}
                    >
                        <PagePreview
                            key={`${selectedPage}-${currentLanguage}-${previewKey}`}
                            page={selectedPage}
                            language={currentLanguage}
                            content={currentLangContent}
                            viewMode={viewMode}
                            isEditMode={isEditMode}
                            editingField={editingField}
                            onContentChange={handleContentChange}
                            onEditField={setEditingField}
                            isLoading={isLoading}
                        />
                    </NextIntlClientProvider>
                    {showScrollTop && (
                        <button
                            onClick={scrollToTop}
                            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                            title="Cuộn lên đầu trang"
                        >
                            <ArrowUp className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
            {isEditMode && editingField && (
                <InlineEditor
                    field={editingField}
                    value={currentLangContent[editingField]}
                    onSave={(value) => {
                        handleContentChange(editingField, value);
                        setEditingField(null);
                    }}
                    onCancel={() => setEditingField(null)}
                />
            )}
        </div>
    );
}
