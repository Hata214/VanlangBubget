'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, X } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';
import { useSiteContent } from '@/components/SiteContentProvider';
import ImageEditor from './ImageEditor';
import PreviewImage from './PreviewImage';

interface HomepagePreviewProps {
    content: any;
    onUpdate: () => void;
    section?: string; // Thêm prop section để hiển thị một section cụ thể
}

export default function HomepagePreview({ content, onUpdate, section }: HomepagePreviewProps) {
    const { content: siteContent, language, refreshContent } = useSiteContent();
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [updatedContent, setUpdatedContent] = useState<any>(content);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [changedFields, setChangedFields] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';

    useEffect(() => {
        // Ưu tiên sử dụng dữ liệu từ SiteContentProvider nếu có
        if (siteContent && siteContent['homepage-' + language]) {
            setUpdatedContent(siteContent['homepage-' + language]);
        } else {
            setUpdatedContent(content);
        }
    }, [content, siteContent, language]);

    // Hàm bắt đầu chỉnh sửa một trường
    const startInlineEdit = (key: string, value: any) => {
        setEditingField(key);
        setEditValue(value);

        // Focus vào input sau khi render
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 10);

        // Hiển thị hiệu ứng khi bắt đầu chỉnh sửa
        const element = document.querySelector(`[data-field="${key}"]`);
        if (element) {
            element.classList.add('highlight-editable');
            setTimeout(() => {
                element.classList.remove('highlight-editable');
            }, 1000);
        }

        toast.success(`Đang chỉnh sửa "${key.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}"`);
    };

    // Hàm lưu thay đổi cho một trường
    const saveInlineEdit = (key: string) => {
        handleInputChange(key, editValue);
        setEditingField(null);

        // Hiển thị hiệu ứng khi lưu thành công
        const element = document.querySelector(`[data-field="${key}"]`);
        if (element) {
            element.classList.add('saved-highlight');
            setTimeout(() => {
                element.classList.remove('saved-highlight');
            }, 2000);
        }

        toast.success(`Đã cập nhật "${key.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}"`);
    };

    // Hàm hủy chỉnh sửa
    const cancelInlineEdit = () => {
        setEditingField(null);
    };

    // Hàm xử lý thay đổi giá trị
    const handleInputChange = (key: string, value: any) => {
        // Tạo một bản sao của updatedContent
        const newContent = { ...updatedContent };

        // Phân tách key thành các phần (ví dụ: 'hero.title' -> ['hero', 'title'])
        const keyParts = key.split('.');

        // Tạo hoặc cập nhật giá trị trong newContent
        let current = newContent;
        for (let i = 0; i < keyParts.length - 1; i++) {
            if (!current[keyParts[i]]) {
                current[keyParts[i]] = {};
            }
            current = current[keyParts[i]];
        }

        // Cập nhật giá trị cuối cùng
        current[keyParts[keyParts.length - 1]] = value;

        // Cập nhật state
        setUpdatedContent(newContent);

        // Thêm key vào danh sách các trường đã thay đổi nếu chưa có
        if (!changedFields.includes(key)) {
            setChangedFields([...changedFields, key]);
        }
    };

    // Hàm lưu tất cả thay đổi
    const saveAllChanges = async () => {
        if (changedFields.length === 0) {
            toast.info('Không có thay đổi để lưu');
            return;
        }

        setIsSaving(true);
        try {
            await siteContentService.updateHomepageContent(updatedContent, language);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công nội dung trang chủ!'
                : 'Đã gửi nội dung trang chủ để SuperAdmin phê duyệt!');

            setChangedFields([]);

            // Cập nhật lại dữ liệu trong SiteContentProvider
            refreshContent();

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật nội dung trang chủ:', error);
            toast.error('Không thể lưu nội dung. Vui lòng thử lại sau.');
        } finally {
            setIsSaving(false);
        }
    };

    // Render một trường có thể chỉnh sửa
    const renderEditableField = (key: string, value: any, className: string = '', type: string = 'text') => {
        if (editingField === key) {
            if (type === 'image') {
                return (
                    <div className="p-2 bg-white rounded-lg shadow-md border border-blue-200">
                        <ImageEditor
                            value={editValue as string}
                            onChange={(url) => setEditValue(url)}
                            placeholder="Nhập URL hình ảnh hoặc tải lên"
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                            <button
                                onClick={() => saveInlineEdit(key)}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center"
                            >
                                <Save size={14} className="mr-1" />
                                Lưu
                            </button>
                            <button
                                onClick={cancelInlineEdit}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm flex items-center"
                            >
                                <X size={14} className="mr-1" />
                                Hủy
                            </button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="p-2 bg-white rounded-lg shadow-md border border-blue-200">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập nội dung..."
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button
                            onClick={() => saveInlineEdit(key)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center"
                        >
                            <Save size={14} className="mr-1" />
                            Lưu
                        </button>
                        <button
                            onClick={cancelInlineEdit}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm flex items-center"
                        >
                            <X size={14} className="mr-1" />
                            Hủy
                        </button>
                    </div>
                </div>
            );
        }

        if (type === 'image') {
            return (
                <div
                    className={`editable-content cursor-pointer hover:shadow-lg transition-all ${className}`}
                    onClick={() => startInlineEdit(key, value)}
                    data-field={key}
                >
                    <div className="relative group">
                        <PreviewImage
                            src={value}
                            alt={key.split('.').pop() || 'Image'}
                            maxHeight="300px"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center">
                                <Edit size={16} className="mr-2" />
                                Chỉnh sửa hình ảnh
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <span
                className={`editable-content cursor-pointer hover:bg-blue-50 hover:shadow-sm transition-all px-1 py-0.5 rounded ${className}`}
                onClick={() => startInlineEdit(key, value)}
                data-field={key}
            >
                {value || <span className="text-gray-400 italic">Nhấp để thêm nội dung</span>}
            </span>
        );
    };

    // Hàm render từng section riêng biệt
    const renderSection = () => {
        switch (section) {
            case 'hero':
                return renderHeroSection();
            case 'features':
                return renderFeaturesSection();
            case 'testimonials':
                return renderTestimonialsSection();
            case 'cta':
                return renderCtaSection();
            case 'stats':
                return renderStatsSection();
            case 'pricing':
                return renderPricingSection();
            case 'screenshots':
                return renderScreenshotsSection();
            default:
                return null;
        }
    };

    // Hàm render Hero Section
    function renderHeroSection() {
        return (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-8 md:mb-0">
                            <h1 className="text-4xl font-bold mb-4 group">
                                {renderEditableField('hero.title', updatedContent?.hero?.title || 'Quản lý tài chính cá nhân một cách thông minh', 'text-4xl font-bold')}
                            </h1>
                            <p className="text-xl mb-8 group">
                                {renderEditableField('hero.description', updatedContent?.hero?.description || 'VanLang Budget giúp bạn theo dõi thu chi, quản lý ngân sách và đạt được mục tiêu tài chính một cách dễ dàng', 'text-xl')}
                            </p>
                            <div className="flex space-x-4">
                                <button className="bg-white text-indigo-700 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
                                    {renderEditableField('hero.primaryButtonText', updatedContent?.hero?.primaryButtonText || 'Bắt đầu ngay')}
                                </button>
                                <button className="border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition-colors">
                                    {renderEditableField('hero.secondaryButtonText', updatedContent?.hero?.secondaryButtonText || 'Tìm hiểu thêm')}
                                </button>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <div className="w-full max-w-md">
                                {renderEditableField('hero.image', updatedContent?.hero?.image || '/images/homepage/hero.png', 'rounded-lg shadow-xl', 'image')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Features Section
    function renderFeaturesSection() {
        return (
            <div className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 group">
                            {renderEditableField('features.title', updatedContent?.features?.title || 'Tính năng', 'text-3xl font-bold')}
                        </h1>
                        <p className="text-gray-600 group">
                            {renderEditableField('features.description', updatedContent?.features?.description || 'Công cụ quản lý tài chính thông minh', 'text-gray-600')}
                        </p>
                    </div>

                    <div className="border rounded-lg p-6 mb-8">
                        <p className="text-gray-700 group">
                            {renderEditableField('features.overview', updatedContent?.features?.overview || 'VanLang Budget cung cấp các công cụ tài chính hiện đại để kiểm soát thu chi, lập kế hoạch và theo dõi mục tiêu.', 'text-gray-700')}
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold mb-6 text-center group">
                        {renderEditableField('features.mainFeaturesTitle', updatedContent?.features?.mainFeaturesTitle || 'Tính năng chính', 'text-2xl font-bold')}
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Feature 1: Theo dõi thu chi */}
                        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold group">
                                    {renderEditableField('features.feature1.title', updatedContent?.features?.feature1?.title || 'Theo dõi thu chi', 'text-lg font-semibold')}
                                </h3>
                            </div>
                            <p className="text-gray-600 mb-4 ml-14 group">
                                {renderEditableField('features.feature1.description', updatedContent?.features?.feature1?.description || 'Ghi lại và phân loại các khoản thu chi, tạo báo cáo tổng hợp, theo dõi lịch sử giao dịch và phân tích xu hướng chi tiêu.', 'text-gray-600')}
                            </p>
                        </div>

                        {/* Thêm các tính năng khác ở đây */}
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Stats Section
    function renderStatsSection() {
        return (
            <div className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('stats.title', updatedContent?.stats?.title || 'Dữ liệu tài chính toàn diện', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('stats.description', updatedContent?.stats?.description || 'Giúp bạn hiểu rõ tình hình tài chính cá nhân', 'text-gray-600')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Pricing Section
    function renderPricingSection() {
        return (
            <div className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('pricing.title', updatedContent?.pricing?.title || 'Bảng giá', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('pricing.description', updatedContent?.pricing?.description || 'Chọn gói phù hợp với nhu cầu của bạn', 'text-gray-600')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render CTA Section
    function renderCtaSection() {
        return (
            <div className="bg-indigo-700 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4 group">
                        {renderEditableField('cta.title', updatedContent?.cta?.title || 'Sẵn sàng bắt đầu?', 'text-3xl font-bold')}
                    </h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto group">
                        {renderEditableField('cta.description', updatedContent?.cta?.description || 'Đăng ký ngay hôm nay để trải nghiệm tất cả các tính năng', 'text-xl')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-white text-indigo-700 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors group">
                            {renderEditableField('cta.buttonText', updatedContent?.cta?.buttonText || 'Đăng ký ngay')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Testimonials Section
    function renderTestimonialsSection() {
        return (
            <div className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('testimonials.title', updatedContent?.testimonials?.title || 'Người dùng nói gì về chúng tôi', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('testimonials.description', updatedContent?.testimonials?.description || 'Khám phá trải nghiệm của người dùng với VanLang Budget', 'text-gray-600')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Screenshots Section
    function renderScreenshotsSection() {
        return (
            <div className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('screenshots.title', updatedContent?.screenshots?.title || 'Giao diện trực quan', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('screenshots.description', updatedContent?.screenshots?.description || 'Khám phá giao diện người dùng thân thiện và dễ sử dụng của VanLang Budget', 'text-gray-600')}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="homepage-preview">
            {/* Floating save button */}
            {changedFields.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button
                        onClick={saveAllChanges}
                        disabled={isSaving}
                        className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                        <Save size={18} className="mr-2" />
                        {isSaving ? 'Đang lưu...' : `Lưu ${changedFields.length} thay đổi`}
                    </button>
                </div>
            )}

            {/* Render section cụ thể hoặc toàn bộ trang */}
            {section ? renderSection() : (
                <>
                    {/* Hero Section */}
                    {renderHeroSection()}

                    {/* Features Section */}
                    {renderFeaturesSection()}

                    {/* Stats Section */}
                    {renderStatsSection()}

                    {/* Pricing Section */}
                    {renderPricingSection()}

                    {/* CTA Section */}
                    {renderCtaSection()}
                </>
            )}
        </div>
    );

    // Hàm render Hero Section
    function renderHeroSection() {
        return (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-8 md:mb-0">
                            <h1 className="text-4xl font-bold mb-4 group">
                                {renderEditableField('hero.title', updatedContent?.hero?.title || 'Quản lý tài chính cá nhân một cách thông minh', 'text-4xl font-bold')}
                            </h1>
                            <p className="text-xl mb-8 group">
                                {renderEditableField('hero.description', updatedContent?.hero?.description || 'VanLang Budget giúp bạn theo dõi thu chi, quản lý ngân sách và đạt được mục tiêu tài chính một cách dễ dàng', 'text-xl')}
                            </p>
                            <div className="flex space-x-4">
                                <button className="bg-white text-indigo-700 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
                                    {renderEditableField('hero.primaryButtonText', updatedContent?.hero?.primaryButtonText || 'Bắt đầu ngay')}
                                </button>
                                <button className="border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition-colors">
                                    {renderEditableField('hero.secondaryButtonText', updatedContent?.hero?.secondaryButtonText || 'Tìm hiểu thêm')}
                                </button>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <div className="w-full max-w-md">
                                {renderEditableField('hero.image', updatedContent?.hero?.image || '/images/homepage/hero.png', 'rounded-lg shadow-xl', 'image')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Stats Section
    function renderStatsSection() {
        return (
            <div className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('stats.title', updatedContent?.stats?.title || 'Dữ liệu tài chính toàn diện', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('stats.description', updatedContent?.stats?.description || 'Giúp bạn hiểu rõ tình hình tài chính cá nhân', 'text-gray-600')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Pricing Section
    function renderPricingSection() {
        return (
            <div className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('pricing.title', updatedContent?.pricing?.title || 'Bảng giá', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('pricing.description', updatedContent?.pricing?.description || 'Chọn gói phù hợp với nhu cầu của bạn', 'text-gray-600')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render CTA Section
    function renderCtaSection() {
        return (
            <div className="bg-indigo-700 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4 group">
                        {renderEditableField('cta.title', updatedContent?.cta?.title || 'Sẵn sàng bắt đầu?', 'text-3xl font-bold')}
                    </h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto group">
                        {renderEditableField('cta.description', updatedContent?.cta?.description || 'Đăng ký ngay hôm nay để trải nghiệm tất cả các tính năng', 'text-xl')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-white text-indigo-700 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors group">
                            {renderEditableField('cta.buttonText', updatedContent?.cta?.buttonText || 'Đăng ký ngay')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Testimonials Section
    function renderTestimonialsSection() {
        return (
            <div className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('testimonials.title', updatedContent?.testimonials?.title || 'Người dùng nói gì về chúng tôi', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('testimonials.description', updatedContent?.testimonials?.description || 'Khám phá trải nghiệm của người dùng với VanLang Budget', 'text-gray-600')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm render Screenshots Section
    function renderScreenshotsSection() {
        return (
            <div className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('screenshots.title', updatedContent?.screenshots?.title || 'Giao diện trực quan', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('screenshots.description', updatedContent?.screenshots?.description || 'Khám phá giao diện người dùng thân thiện và dễ sử dụng của VanLang Budget', 'text-gray-600')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}