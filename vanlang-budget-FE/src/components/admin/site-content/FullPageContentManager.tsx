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
import { NextIntlClientProvider } from 'next-intl'; // Thêm import
import messagesEn from '@/messages/en.json';      // Thêm import
import messagesVi from '@/messages/vi.json';      // Thêm import
import ContentSidebar from './ContentSidebar';
import PagePreview from './PagePreview';
import InlineEditor from './InlineEditor';

interface User {
    _id: string;
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

// Các sections thuộc homepage
const HOMEPAGE_SECTIONS = ['homepage', 'testimonials'];

export default function FullPageContentManager({ user }: FullPageContentManagerProps) {
    // State management
    const [selectedPage, setSelectedPage] = useState<string>('homepage');
    const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('vi');
    const [content, setContent] = useState<ContentData>({});
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

    // Load content when page or language changes
    useEffect(() => {
        loadContent();
    }, [selectedPage, currentLanguage]);

    // Handle scroll to show/hide scroll to top button
    useEffect(() => {
        const previewArea = previewAreaRef.current;
        if (!previewArea) return;

        const handleScroll = () => {
            setShowScrollTop(previewArea.scrollTop > 300);
        };

        previewArea.addEventListener('scroll', handleScroll);
        return () => previewArea.removeEventListener('scroll', handleScroll);
    }, []);

    const loadContent = async () => {
        setIsLoading(true);
        try {
            // Ensure we only use valid page types for API calls
            const validPages = ['homepage', 'about', 'features', 'roadmap', 'pricing', 'contact', 'header', 'footer'];
            const basePage = selectedPage.split('-')[0]; // Remove any sub-section suffixes

            if (!validPages.includes(basePage)) {
                console.warn(`Invalid page type: ${selectedPage}, defaulting to homepage`);
                setSelectedPage('homepage');
                return;
            }

            // Đối với homepage và các sections của nó, luôn sử dụng 'homepage' làm contentKey
            // Đối với các trang khác, chỉ sử dụng basePage (backend xử lý language qua query param)
            const contentKey = HOMEPAGE_SECTIONS.includes(basePage) ? 'homepage' : basePage;
            console.log('🔍 DEBUG - basePage:', basePage);
            console.log('🔍 DEBUG - HOMEPAGE_SECTIONS:', HOMEPAGE_SECTIONS);
            console.log('🔍 DEBUG - HOMEPAGE_SECTIONS.includes(basePage):', HOMEPAGE_SECTIONS.includes(basePage));
            console.log('🔍 DEBUG - contentKey:', contentKey);
            console.log('🔄 Loading content for:', contentKey, 'language:', currentLanguage);

            let response;
            if (basePage === 'features') {
                // Features cần xử lý đặc biệt
                response = await siteContentService.getContentByType('features', currentLanguage);
                console.log('🔍 Features response:', response);

                // Extract language specific content
                if (response && response.data && response.data[currentLanguage]) {
                    response.data = response.data[currentLanguage];
                    console.log('🔍 Extracted features content for', currentLanguage, ':', response.data);
                }
            } else if (basePage === 'roadmap') {
                // Roadmap cần xử lý đặc biệt
                response = await siteContentService.getContentByType('roadmap', currentLanguage);
                console.log('🗺️ Roadmap response:', response);
                console.log('🗺️ Roadmap response data:', response?.data);
                console.log('🗺️ Roadmap response data type:', typeof response?.data);
                console.log('🗺️ Roadmap response data structure:', JSON.stringify(response?.data, null, 2));

                // Extract language specific content for roadmap
                if (response && response.data && response.data[currentLanguage]) {
                    response.data = response.data[currentLanguage];
                    console.log('🗺️ Extracted roadmap content for', currentLanguage, ':', response.data);
                }
            } else if (basePage === 'contact') {
                // Contact cần xử lý đặc biệt
                response = await siteContentService.getContentByType('contact', currentLanguage);
                console.log('📞 Contact response:', response);
                console.log('📞 Contact response data:', response?.data);
                console.log('📞 Contact response data type:', typeof response?.data);
                console.log('📞 Contact response data structure:', JSON.stringify(response?.data, null, 2));

                // Extract language specific content for contact
                if (response && response.data && response.data[currentLanguage]) {
                    response.data = response.data[currentLanguage];
                    console.log('📞 Extracted contact content for', currentLanguage, ':', response.data);
                }
            } else if (basePage === 'header') {
                // Header cần xử lý đặc biệt
                response = await siteContentService.getContentByType('header', currentLanguage);
                console.log('🔝 Header response:', response);
                console.log('🔝 Header response data:', response?.data);
                console.log('🔝 Header response data type:', typeof response?.data);
                console.log('🔝 Header response data structure:', JSON.stringify(response?.data, null, 2));

                // Extract language specific content for header
                if (response && response.data && response.data[currentLanguage]) {
                    response.data = response.data[currentLanguage];
                    console.log('🔝 Extracted header content for', currentLanguage, ':', response.data);
                }
            } else if (basePage === 'footer') {
                // Footer cần xử lý đặc biệt
                response = await siteContentService.getContentByType('footer', currentLanguage);
                console.log('🔻 Footer response:', response);
                console.log('🔻 Footer response data:', response?.data);
                console.log('🔻 Footer response data type:', typeof response?.data);
                console.log('🔻 Footer response data structure:', JSON.stringify(response?.data, null, 2));

                // Extract language specific content for footer
                if (response && response.data && response.data[currentLanguage]) {
                    response.data = response.data[currentLanguage];
                    console.log('🔻 Extracted footer content for', currentLanguage, ':', response.data);
                }
            } else {
                response = await siteContentService.getContentByType(contentKey, currentLanguage);
            }
            console.log('✅ Loaded content response:', response);
            console.log('📝 Response data:', response?.data);
            console.log('📝 Response data type:', typeof response?.data);

            // Extract content from response structure
            // For roadmap, features, pricing, contact, header, and footer, after language extraction, data is already the content
            let contentData;
            if (basePage === 'roadmap' || basePage === 'features' || basePage === 'pricing' || basePage === 'contact' || basePage === 'header' || basePage === 'footer') {
                contentData = response.data || {};
            } else {
                contentData = response.data?.content || response.data || {};
            }

            // Nếu đang load một section cụ thể của homepage, extract section đó
            if (HOMEPAGE_SECTIONS.includes(basePage) && basePage !== 'homepage') {
                contentData = contentData[basePage] || contentData;
            }

            // Clean up any flat field duplicates (e.g., remove "hero.title" if hero.title exists)
            const cleanedContent = { ...contentData };
            Object.keys(cleanedContent).forEach(key => {
                if (key.includes('.')) {
                    const [section, field] = key.split('.');
                    if (cleanedContent[section] && cleanedContent[section][field]) {
                        delete cleanedContent[key]; // Remove duplicate flat field
                    }
                }
            });

            setContent(cleanedContent);
            console.log('Content set to state:', cleanedContent);

            // Force re-render of preview
            setPreviewKey(prev => prev + 1);
        } catch (error) {
            console.error('Lỗi khi tải nội dung:', error);
            toast.error('Không thể tải nội dung. Vui lòng thử lại sau.');
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
        console.log('Content change:', field, value);
        setContent(prev => {
            const newContent = { ...prev };

            // Handle nested field updates (e.g., "hero.title" -> hero: { title: value })
            if (field.includes('.')) {
                const fieldParts = field.split('.');
                let current = newContent;

                // Navigate to the parent object
                for (let i = 0; i < fieldParts.length - 1; i++) {
                    if (!current[fieldParts[i]]) {
                        current[fieldParts[i]] = {};
                    }
                    current = current[fieldParts[i]];
                }

                // Set the final value
                current[fieldParts[fieldParts.length - 1]] = value;
            } else {
                // Handle direct field updates
                newContent[field] = value;
            }

            console.log('New content state:', newContent);
            return newContent;
        });
        setHasChanges(true);
    };

    const handleSaveContent = async () => {
        setIsSaving(true);
        try {
            const basePage = selectedPage.split('-')[0]; // Remove any sub-section suffixes

            // Đối với homepage và các sections của nó, luôn sử dụng 'homepage' làm contentKey
            // Đối với các trang khác, chỉ sử dụng basePage (backend xử lý language qua query param)
            const contentKey = HOMEPAGE_SECTIONS.includes(basePage) ? 'homepage' : basePage;
            console.log('🔍 SAVE DEBUG - basePage:', basePage);
            console.log('🔍 SAVE DEBUG - HOMEPAGE_SECTIONS:', HOMEPAGE_SECTIONS);
            console.log('🔍 SAVE DEBUG - HOMEPAGE_SECTIONS.includes(basePage):', HOMEPAGE_SECTIONS.includes(basePage));
            console.log('🔍 SAVE DEBUG - contentKey:', contentKey);

            let contentToSave = content;

            // Nếu đang save một section cụ thể của homepage, cần merge vào toàn bộ homepage content
            if (HOMEPAGE_SECTIONS.includes(basePage) && basePage !== 'homepage') {
                // Load toàn bộ homepage content hiện tại
                const currentHomepage = await siteContentService.getContentByType('homepage');
                const fullHomepageContent = currentHomepage.data?.content || {};

                // Merge section content vào homepage content
                contentToSave = {
                    ...fullHomepageContent,
                    [basePage]: content
                };
            }

            console.log('💾 Saving content with key:', contentKey);
            console.log('💾 Content to save:', JSON.stringify(contentToSave, null, 2));

            let saveResponse;
            if (basePage === 'features') {
                // Features cần wrap trong language object
                const dataToSave = {
                    [currentLanguage]: contentToSave
                };
                saveResponse = await siteContentService.updateContentByType('features', dataToSave);
            } else if (basePage === 'roadmap') {
                // Roadmap cần wrap trong language object giống features
                const dataToSave = {
                    [currentLanguage]: contentToSave
                };
                console.log('🗺️ Saving roadmap content:', JSON.stringify(dataToSave, null, 2));
                saveResponse = await siteContentService.updateContentByType('roadmap', dataToSave);
                console.log('🗺️ Roadmap save response:', saveResponse);
            } else if (basePage === 'pricing') {
                // Pricing cần wrap trong language object giống features và roadmap
                const dataToSave = {
                    [currentLanguage]: contentToSave
                };
                console.log('💰 Saving pricing content:', JSON.stringify(dataToSave, null, 2));
                saveResponse = await siteContentService.updateContentByType('pricing', dataToSave);
                console.log('💰 Pricing save response:', saveResponse);
            } else if (basePage === 'contact') {
                // Contact cần wrap trong language object giống features, roadmap và pricing
                const dataToSave = {
                    [currentLanguage]: contentToSave
                };
                console.log('📞 Saving contact content:', JSON.stringify(dataToSave, null, 2));
                saveResponse = await siteContentService.updateContentByType('contact', dataToSave);
                console.log('📞 Contact save response:', saveResponse);
            } else if (basePage === 'header') {
                // Header cần wrap trong language object
                const dataToSave = {
                    [currentLanguage]: contentToSave
                };
                console.log('🔝 Saving header content:', JSON.stringify(dataToSave, null, 2));
                saveResponse = await siteContentService.updateContentByType('header', dataToSave);
                console.log('🔝 Header save response:', saveResponse);
            } else if (basePage === 'footer') {
                // Footer cần wrap trong language object
                const dataToSave = {
                    [currentLanguage]: contentToSave
                };
                console.log('🔻 Saving footer content:', JSON.stringify(dataToSave, null, 2));
                saveResponse = await siteContentService.updateContentByType('footer', dataToSave);
                console.log('🔻 Footer save response:', saveResponse);
            } else {
                saveResponse = await siteContentService.updateContentByType(contentKey, contentToSave);
            }
            console.log('✅ Save response:', saveResponse);

            toast.success(isSuperAdmin
                ? 'Đã lưu thành công!'
                : 'Đã gửi nội dung để SuperAdmin phê duyệt!');
            setHasChanges(false);
            setEditingField(null);

            // Force reload content with cache busting to ensure fresh data
            console.log('🔄 Content saved successfully, reloading with cache busting...');

            // Immediately reload content to refresh preview
            await loadContent();
            console.log('🔄 Content reloaded after save');

            // Force re-render of PagePreview component
            setPreviewKey(prev => prev + 1);
            console.log('🔄 Preview key updated to force re-render');
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
                const basePage = selectedPage.split('-')[0]; // Remove any sub-section suffixes

                if (HOMEPAGE_SECTIONS.includes(basePage)) {
                    await siteContentService.initializeHomepageContent(currentLanguage);
                } else {
                    // Xử lý đặc biệt cho pricing, features, roadmap, contact, header, footer
                    if (['pricing', 'features', 'roadmap', 'contact', 'header', 'footer'].includes(basePage)) {
                        console.log(`🔄 Initializing ${basePage} content...`);
                        await siteContentService.initializeContentByType(basePage, currentLanguage);
                    } else {
                        await siteContentService.initializeContentByType(basePage, currentLanguage);
                    }
                }

                toast.success(`Đã khôi phục nội dung mặc định cho trang ${getPageTitle(basePage)}`);

                // Reset states để tránh interface bị reset
                setHasChanges(false);
                setEditingField(null);

                // Reload content và force re-render
                await loadContent();
                setPreviewKey(prev => prev + 1);

                console.log('🔄 Reset to default completed successfully');
            } catch (error) {
                console.error('Lỗi khi khôi phục nội dung mặc định:', error);
                toast.error('Không thể khôi phục nội dung mặc định. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleApproveContent = async () => {
        if (window.confirm('Bạn có chắc chắn muốn phê duyệt nội dung này?')) {
            setIsLoading(true);
            try {
                const basePage = selectedPage.split('-')[0]; // Remove any sub-section suffixes

                if (HOMEPAGE_SECTIONS.includes(basePage)) {
                    await siteContentService.approveHomepageContent();
                } else {
                    await siteContentService.approveContentByType(basePage);
                }
                toast.success(`Đã phê duyệt nội dung cho trang ${getPageTitle(basePage)}`);
                await loadContent();
            } catch (error) {
                console.error('Lỗi khi phê duyệt nội dung:', error);
                toast.error('Không thể phê duyệt nội dung. Vui lòng thử lại sau.');
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
                const basePage = selectedPage.split('-')[0]; // Remove any sub-section suffixes

                if (HOMEPAGE_SECTIONS.includes(basePage)) {
                    await siteContentService.rejectHomepageContent(reason);
                } else {
                    await siteContentService.rejectContentByType(basePage, reason);
                }
                toast.success(`Đã từ chối nội dung cho trang ${getPageTitle(basePage)}`);
                await loadContent();
            } catch (error) {
                console.error('Lỗi khi từ chối nội dung:', error);
                toast.error('Không thể từ chối nội dung. Vui lòng thử lại sau.');
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
            previewAreaRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <ContentSidebar
                selectedPage={selectedPage}
                currentLanguage={currentLanguage}
                onPageChange={handlePageChange}
                onLanguageChange={handleLanguageChange}
                hasChanges={hasChanges}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Toolbar */}
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
                            {/* View Mode Toggle */}
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

                            {/* Edit Mode Toggle */}
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

                            {/* Highlight Button */}
                            {isEditMode && (
                                <button
                                    onClick={highlightEditableElements}
                                    className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Làm nổi bật
                                </button>
                            )}



                            {/* Refresh Preview Button */}
                            <button
                                onClick={() => {
                                    console.log('🔄 Manual refresh clicked');
                                    loadContent();
                                    setPreviewKey(prev => prev + 1);
                                }}
                                disabled={isLoading}
                                className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                                title="Làm mới preview"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>



                            {/* Action Buttons */}
                            <button
                                onClick={handleResetToDefault}
                                disabled={isSaving || isLoading}
                                className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Khôi phục
                            </button>

                            {/* SuperAdmin Actions */}
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

                            {/* Save Button */}
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

                {/* Preview Area */}
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
                            content={content}
                            viewMode={viewMode}
                            isEditMode={isEditMode}
                            editingField={editingField}
                            onContentChange={handleContentChange}
                            onEditField={setEditingField}
                            isLoading={isLoading}
                        />
                    </NextIntlClientProvider>

                    {/* Scroll to Top Button */}
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

            {/* Inline Editor Modal */}
            {isEditMode && editingField && (
                <InlineEditor
                    field={editingField}
                    value={content[editingField]}
                    onSave={(value) => {
                        console.log('Inline editor save:', editingField, value);
                        handleContentChange(editingField, value);
                        setEditingField(null);

                        // Don't auto-save - let user save manually to avoid conflicts
                        console.log('Content updated in state, ready to save manually');
                    }}
                    onCancel={() => setEditingField(null)}
                />
            )}
        </div>
    );
}
