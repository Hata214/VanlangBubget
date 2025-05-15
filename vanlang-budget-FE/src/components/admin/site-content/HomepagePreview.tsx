'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, X } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';
import { useSiteContent } from '@/components/SiteContentProvider';

interface HomepagePreviewProps {
    content: any;
    onUpdate: () => void;
}

export default function HomepagePreview({ content, onUpdate }: HomepagePreviewProps) {
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

    const handleInputChange = (key: string, value: any) => {
        // Phân tích key để cập nhật đúng vị trí trong nested object
        const keys = key.split('.');
        const lastKey = keys.pop();

        setUpdatedContent((prev: any) => {
            const newContent = { ...prev };

            // Tìm đến object cần cập nhật
            let current = newContent;
            for (const k of keys) {
                if (!current[k]) current[k] = {};
                current = current[k];
            }

            // Cập nhật giá trị
            if (lastKey) current[lastKey] = value;

            return newContent;
        });

        // Kiểm tra xem trường này có thay đổi so với giá trị ban đầu không
        const originalValue = getNestedValue(content, key);
        const fieldChanged = value !== originalValue;

        // Cập nhật danh sách các trường đã thay đổi
        if (fieldChanged) {
            if (!changedFields.includes(key)) {
                setChangedFields([...changedFields, key]);
            }
        } else {
            setChangedFields(changedFields.filter(field => field !== key));
        }
    };

    // Hàm lấy giá trị từ nested object theo path (vd: "hero.title")
    const getNestedValue = (obj: any, path: string) => {
        const keys = path.split('.');
        return keys.reduce((o, k) => (o || {})[k], obj);
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
    const renderEditableField = (key: string, value: any, className: string = '') => {
        if (editingField === key) {
            return (
                <div className="inline-flex items-center bg-blue-50 p-1 rounded border border-blue-200">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveInlineEdit(key);
                            if (e.key === 'Escape') cancelInlineEdit();
                        }}
                        className="flex-1 p-1 text-sm border-none focus:ring-0 bg-transparent"
                        autoFocus
                    />
                    <button
                        onClick={() => saveInlineEdit(key)}
                        className="p-1 text-green-600 hover:text-green-800"
                    >
                        <Save size={16} />
                    </button>
                    <button
                        onClick={cancelInlineEdit}
                        className="p-1 text-red-600 hover:text-red-800"
                    >
                        <X size={16} />
                    </button>
                </div>
            );
        }

        return (
            <span
                className={`editable-content cursor-pointer hover:bg-blue-50 hover:border-dashed hover:border-blue-300 p-1 rounded ${className}`}
                onClick={() => startInlineEdit(key, value)}
                data-field={key}
            >
                {value}
                <Edit size={14} className="inline-block ml-1 text-gray-400 opacity-0 group-hover:opacity-100" />
            </span>
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



            {/* Navigation Menu */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center text-white font-bold text-xs">
                                    VLB
                                </div>
                                <span className="font-bold text-xl text-indigo-700">
                                    VanLang Budget
                                </span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium">
                                Trang chủ
                            </a>
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium">
                                Giới thiệu
                            </a>
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium">
                                Tính năng
                            </a>
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium">
                                Lộ trình
                            </a>
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium">
                                Bảng giá
                            </a>
                            <a href="#" className="text-gray-700 hover:text-indigo-600 font-medium">
                                Liên hệ
                            </a>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium">
                                VI
                            </button>
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                                Đăng nhập
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-bold mb-4 group">
                            {renderEditableField('hero.title', updatedContent?.hero?.title || 'Tiêu đề trang chủ', 'text-4xl font-bold')}
                        </h1>
                        <p className="text-xl mb-8 group">
                            {renderEditableField('hero.description', updatedContent?.hero?.description || 'Mô tả trang chủ', 'text-xl')}
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
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 group">
                            {renderEditableField('features.title', updatedContent?.features?.title || 'Tính năng nổi bật', 'text-3xl font-bold')}
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto group">
                            {renderEditableField('features.description', updatedContent?.features?.description || 'Mô tả các tính năng chính của ứng dụng', 'text-gray-600')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((index) => (
                            <div key={index} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-2 group">
                                    {renderEditableField(`features.items.${index - 1}.title`, updatedContent?.features?.items?.[index - 1]?.title || `Tính năng ${index}`, 'text-xl font-semibold')}
                                </h3>
                                <p className="text-gray-600 group">
                                    {renderEditableField(`features.items.${index - 1}.description`, updatedContent?.features?.items?.[index - 1]?.description || `Mô tả chi tiết về tính năng ${index}`, 'text-gray-600')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
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
                        <button className="bg-transparent border border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white/10 transition-colors group">
                            {renderEditableField('cta.loginButtonText', updatedContent?.cta?.loginButtonText || 'Đăng nhập')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                {renderEditableField('footer.companyTitle', updatedContent?.footer?.companyTitle || 'VanLang Budget')}
                            </h3>
                            <p className="text-gray-400 mb-4">
                                {renderEditableField('footer.companyDescription', updatedContent?.footer?.companyDescription || 'Giải pháp quản lý tài chính cá nhân thông minh giúp bạn kiểm soát chi tiêu và đạt được mục tiêu tài chính.')}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                {renderEditableField('footer.linksTitle', updatedContent?.footer?.linksTitle || 'Liên kết nhanh')}
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        {renderEditableField('footer.links.home', updatedContent?.footer?.links?.home || 'Trang chủ')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        {renderEditableField('footer.links.about', updatedContent?.footer?.links?.about || 'Giới thiệu')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        {renderEditableField('footer.links.features', updatedContent?.footer?.links?.features || 'Tính năng')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        {renderEditableField('footer.links.pricing', updatedContent?.footer?.links?.pricing || 'Bảng giá')}
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                {renderEditableField('footer.legalTitle', updatedContent?.footer?.legalTitle || 'Pháp lý')}
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        {renderEditableField('footer.legal.terms', updatedContent?.footer?.legal?.terms || 'Điều khoản sử dụng')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        {renderEditableField('footer.legal.privacy', updatedContent?.footer?.legal?.privacy || 'Chính sách bảo mật')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        {renderEditableField('footer.legal.cookies', updatedContent?.footer?.legal?.cookies || 'Chính sách cookie')}
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                {renderEditableField('footer.contactTitle', updatedContent?.footer?.contactTitle || 'Liên hệ')}
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-center text-gray-400">
                                    <span className="mr-2">📧</span>
                                    {renderEditableField('footer.contact.email', updatedContent?.footer?.contact?.email || 'support@vanlangbudget.com')}
                                </li>
                                <li className="flex items-center text-gray-400">
                                    <span className="mr-2">📱</span>
                                    {renderEditableField('footer.contact.phone', updatedContent?.footer?.contact?.phone || '(+84) 123 456 789')}
                                </li>
                                <li className="flex items-center text-gray-400">
                                    <span className="mr-2">🏢</span>
                                    {renderEditableField('footer.contact.address', updatedContent?.footer?.contact?.address || 'Văn Lang University, Hồ Chí Minh City')}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm group">
                            {renderEditableField('footer.copyright', updatedContent?.footer?.copyright || '© 2023 VanLang Budget. Tất cả các quyền được bảo lưu.')}
                        </p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                {renderEditableField('footer.social.facebook', updatedContent?.footer?.social?.facebook || 'Facebook')}
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                {renderEditableField('footer.social.twitter', updatedContent?.footer?.social?.twitter || 'Twitter')}
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                {renderEditableField('footer.social.linkedin', updatedContent?.footer?.social?.linkedin || 'LinkedIn')}
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                {renderEditableField('footer.social.instagram', updatedContent?.footer?.social?.instagram || 'Instagram')}
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
