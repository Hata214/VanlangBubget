'use client';

import { useState, useEffect } from 'react';
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
    Tablet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import siteContentService from '@/services/siteContentService';
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
const HOMEPAGE_SECTIONS = ['homepage', 'features', 'pricing', 'testimonials', 'statistics'];

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

    const isSuperAdmin = user?.role === 'superadmin';

    // Load content when page or language changes
    useEffect(() => {
        loadContent();
    }, [selectedPage, currentLanguage]);

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
            const contentKey = HOMEPAGE_SECTIONS.includes(basePage) ? 'homepage' : `${basePage}-${currentLanguage}`;
            console.log('Loading content for:', contentKey);
            const response = await siteContentService.getContentByType(contentKey);
            console.log('Loaded content response:', response);

            // Extract content from response structure
            let contentData = response.data?.content || response.data || {};

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
            const contentKey = HOMEPAGE_SECTIONS.includes(basePage) ? 'homepage' : `${basePage}-${currentLanguage}`;

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

            console.log('Saving content:', contentKey, contentToSave);
            await siteContentService.updateContentByType(contentKey, contentToSave);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công!'
                : 'Đã gửi nội dung để SuperAdmin phê duyệt!');
            setHasChanges(false);
            setEditingField(null);

            // Force reload content with cache busting to ensure fresh data
            console.log('Content saved successfully, reloading with cache busting...');
            setTimeout(async () => {
                await loadContent();
            }, 500);
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
                    await siteContentService.initializeContentByType(basePage, currentLanguage);
                }
                toast.success(`Đã khôi phục nội dung mặc định cho trang ${getPageTitle(basePage)}`);
                await loadContent();
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

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <ContentSidebar
                selectedPage={selectedPage}
                currentLanguage={currentLanguage}
                onPageChange={handlePageChange}
                onLanguageChange={handleLanguageChange}
                hasChanges={hasChanges}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
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
                                onClick={loadContent}
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
                <div className="flex-1 overflow-hidden">
                    <PagePreview
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
