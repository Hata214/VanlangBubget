'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, X, ChevronLeft, Target, Star, Users, Award } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';
import { useSiteContent } from '@/components/SiteContentProvider';

interface AboutPreviewProps {
    content: any;
    onUpdate: () => void;
}

export default function AboutPreview({ content, onUpdate }: AboutPreviewProps) {
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
        if (siteContent && siteContent['about-' + language]) {
            setUpdatedContent(siteContent['about-' + language]);
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

    // Hàm lấy giá trị từ nested object theo path (vd: "title")
    const getNestedValue = (obj: any, path: string) => {
        const keys = path.split('.');
        return keys.reduce((o, k) => (o || {})[k], obj);
    };

    // Hàm lưu tất cả thay đổi
    const saveAllChanges = async () => {
        if (changedFields.length === 0) {
            toast('Không có thay đổi để lưu');
            return;
        }

        setIsSaving(true);
        try {
            await siteContentService.updateContentByType('about-' + language, updatedContent);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công nội dung trang Giới thiệu!'
                : 'Đã gửi nội dung trang Giới thiệu để SuperAdmin phê duyệt!');

            setChangedFields([]);

            // Cập nhật lại dữ liệu trong SiteContentProvider
            refreshContent();

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật nội dung trang Giới thiệu:', error);
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
        <div className="about-preview">
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

            <div className="container mx-auto py-12 px-4">
                <div className="mb-8">
                    <a href="#" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        <span>Quay lại trang chủ</span>
                    </a>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 group">
                        {renderEditableField('title', updatedContent?.title || 'Về chúng tôi', 'text-4xl font-bold')}
                    </h1>
                    <p className="text-xl text-gray-600 group">
                        {renderEditableField('subtitle', updatedContent?.subtitle || 'Hành trình của VanLang Budget', 'text-xl')}
                    </p>
                </div>

                {/* Giới thiệu */}
                <div className="mb-16">
                    <div className="bg-white p-8 rounded-lg shadow">
                        <p className="text-lg leading-relaxed group">
                            {renderEditableField('description', updatedContent?.description || 'VanLang Budget được phát triển bởi một nhóm các nhà phát triển đam mê tài chính cá nhân với mục tiêu giúp mọi người quản lý tài chính hiệu quả hơn.', 'text-lg')}
                        </p>
                    </div>
                </div>

                {/* Sứ mệnh & Tầm nhìn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-white p-8 rounded-lg shadow">
                        <div className="flex items-center mb-4">
                            <Target className="h-8 w-8 text-indigo-600 mr-3" />
                            <h2 className="text-2xl font-bold group">
                                {renderEditableField('mission.title', updatedContent?.mission?.title || 'Sứ mệnh của chúng tôi', 'text-2xl font-bold')}
                            </h2>
                        </div>
                        <p className="text-lg leading-relaxed group">
                            {renderEditableField('mission.content', updatedContent?.mission?.content || 'Giúp mọi người đạt được sự tự do tài chính thông qua các công cụ quản lý tài chính thông minh và trực quan.', 'text-lg')}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-lg shadow">
                        <div className="flex items-center mb-4">
                            <Star className="h-8 w-8 text-indigo-600 mr-3" />
                            <h2 className="text-2xl font-bold group">
                                {renderEditableField('vision.title', updatedContent?.vision?.title || 'Tầm nhìn', 'text-2xl font-bold')}
                            </h2>
                        </div>
                        <p className="text-lg leading-relaxed group">
                            {renderEditableField('vision.content', updatedContent?.vision?.content || 'Trở thành ứng dụng quản lý tài chính cá nhân hàng đầu tại Việt Nam, giúp hàng triệu người kiểm soát chi tiêu, tiết kiệm hiệu quả và đạt được các mục tiêu tài chính.', 'text-lg')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
