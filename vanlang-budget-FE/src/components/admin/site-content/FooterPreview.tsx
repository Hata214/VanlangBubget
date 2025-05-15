'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, X } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';

interface FooterPreviewProps {
    content: any;
    onUpdate: () => void;
}

export default function FooterPreview({ content, onUpdate }: FooterPreviewProps) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [updatedContent, setUpdatedContent] = useState<any>(content);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [changedFields, setChangedFields] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';

    useEffect(() => {
        setUpdatedContent(content);
    }, [content]);

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

    // Hàm lấy giá trị từ nested object theo path (vd: "title")
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
            await siteContentService.updateContentByType('footer', updatedContent);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công nội dung Footer!'
                : 'Đã gửi nội dung Footer để SuperAdmin phê duyệt!');
            
            setChangedFields([]);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật nội dung Footer:', error);
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
        <div className="footer-preview">
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

            <footer className="bg-gray-800 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 group">
                                {renderEditableField('companyTitle', updatedContent?.companyTitle || 'VanLang Budget', 'text-lg font-semibold')}
                            </h3>
                            <p className="text-gray-400 mb-4 group">
                                {renderEditableField('companyDescription', updatedContent?.companyDescription || 'Giải pháp quản lý tài chính cá nhân thông minh giúp bạn kiểm soát chi tiêu và đạt được mục tiêu tài chính.', 'text-gray-400')}
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4 group">
                                {renderEditableField('linksTitle', updatedContent?.linksTitle || 'Liên kết nhanh', 'text-lg font-semibold')}
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                        {renderEditableField('links.home', updatedContent?.links?.home || 'Trang chủ', 'text-gray-400 hover:text-white')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                        {renderEditableField('links.about', updatedContent?.links?.about || 'Giới thiệu', 'text-gray-400 hover:text-white')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                        {renderEditableField('links.features', updatedContent?.links?.features || 'Tính năng', 'text-gray-400 hover:text-white')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                        {renderEditableField('links.pricing', updatedContent?.links?.pricing || 'Bảng giá', 'text-gray-400 hover:text-white')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4 group">
                                {renderEditableField('legalTitle', updatedContent?.legalTitle || 'Pháp lý', 'text-lg font-semibold')}
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                        {renderEditableField('legal.terms', updatedContent?.legal?.terms || 'Điều khoản sử dụng', 'text-gray-400 hover:text-white')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                        {renderEditableField('legal.privacy', updatedContent?.legal?.privacy || 'Chính sách bảo mật', 'text-gray-400 hover:text-white')}
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                        {renderEditableField('legal.cookies', updatedContent?.legal?.cookies || 'Chính sách cookie', 'text-gray-400 hover:text-white')}
                                    </a>
                                </li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold mb-4 group">
                                {renderEditableField('contactTitle', updatedContent?.contactTitle || 'Liên hệ', 'text-lg font-semibold')}
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-center text-gray-400 group">
                                    <span className="mr-2">📧</span>
                                    {renderEditableField('contact.email', updatedContent?.contact?.email || 'support@vanlangbudget.com', 'text-gray-400')}
                                </li>
                                <li className="flex items-center text-gray-400 group">
                                    <span className="mr-2">📱</span>
                                    {renderEditableField('contact.phone', updatedContent?.contact?.phone || '(+84) 123 456 789', 'text-gray-400')}
                                </li>
                                <li className="flex items-center text-gray-400 group">
                                    <span className="mr-2">🏢</span>
                                    {renderEditableField('contact.address', updatedContent?.contact?.address || 'Văn Lang University, Hồ Chí Minh City', 'text-gray-400')}
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm group">
                            {renderEditableField('copyright', updatedContent?.copyright || '© 2023 VanLang Budget. Tất cả các quyền được bảo lưu.', 'text-gray-400 text-sm')}
                        </p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                {renderEditableField('social.facebook', updatedContent?.social?.facebook || 'Facebook', 'text-gray-400 hover:text-white')}
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                {renderEditableField('social.twitter', updatedContent?.social?.twitter || 'Twitter', 'text-gray-400 hover:text-white')}
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                {renderEditableField('social.linkedin', updatedContent?.social?.linkedin || 'LinkedIn', 'text-gray-400 hover:text-white')}
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors group">
                                {renderEditableField('social.instagram', updatedContent?.social?.instagram || 'Instagram', 'text-gray-400 hover:text-white')}
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
