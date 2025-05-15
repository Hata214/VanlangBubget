'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, X, BarChart3, PieChart, Target, Wallet, Clock } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';

interface FeaturesPreviewProps {
    content: any;
    onUpdate: () => void;
}

export default function FeaturesPreview({ content, onUpdate }: FeaturesPreviewProps) {
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
            await siteContentService.updateContentByType('features', updatedContent);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công nội dung trang Tính năng!'
                : 'Đã gửi nội dung trang Tính năng để SuperAdmin phê duyệt!');
            
            setChangedFields([]);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật nội dung trang Tính năng:', error);
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

    // Hàm lấy icon tương ứng
    const getFeatureIcon = (iconName: string) => {
        switch (iconName) {
            case 'BarChart3': return <BarChart3 className="h-12 w-12 text-indigo-600" />;
            case 'PieChart': return <PieChart className="h-12 w-12 text-indigo-600" />;
            case 'Target': return <Target className="h-12 w-12 text-indigo-600" />;
            case 'Wallet': return <Wallet className="h-12 w-12 text-indigo-600" />;
            case 'Clock': return <Clock className="h-12 w-12 text-indigo-600" />;
            default: return <BarChart3 className="h-12 w-12 text-indigo-600" />;
        }
    };

    return (
        <div className="features-preview">
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
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4 group">
                        {renderEditableField('title', updatedContent?.title || 'Tính năng', 'text-4xl font-bold')}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto group">
                        {renderEditableField('description', updatedContent?.description || 'VanLang Budget cung cấp đầy đủ các tính năng cần thiết để giúp bạn kiểm soát tài chính cá nhân một cách hiệu quả.', 'text-xl')}
                    </p>
                </div>

                {/* Main Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {[0, 1, 2].map((index) => {
                        const feature = updatedContent?.mainFeatures?.[index] || {
                            id: `feature-${index + 1}`,
                            title: `Tính năng ${index + 1}`,
                            description: `Mô tả chi tiết về tính năng ${index + 1}`,
                            iconName: 'BarChart3'
                        };
                        
                        return (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                                <div className="mb-4">
                                    {getFeatureIcon(feature.iconName)}
                                </div>
                                <h3 className="text-xl font-bold mb-3 group">
                                    {renderEditableField(`mainFeatures.${index}.title`, feature.title, 'text-xl font-bold')}
                                </h3>
                                <p className="text-gray-600 mb-4 group">
                                    {renderEditableField(`mainFeatures.${index}.description`, feature.description, 'text-gray-600')}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Coming Soon Features */}
                <div className="bg-gray-50 p-8 rounded-lg">
                    <h2 className="text-2xl font-bold mb-6 text-center group">
                        {renderEditableField('comingSoonTitle', updatedContent?.comingSoonTitle || 'Tính năng sắp ra mắt', 'text-2xl font-bold')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[0, 1, 2].map((index) => {
                            const feature = updatedContent?.comingSoonFeatures?.[index] || {
                                title: `Tính năng sắp ra mắt ${index + 1}`,
                                description: `Mô tả về tính năng sắp ra mắt ${index + 1}`,
                                eta: `Quý ${index + 1}/2025`
                            };
                            
                            return (
                                <div key={index} className="bg-white p-5 rounded-md shadow-sm">
                                    <h3 className="text-lg font-semibold mb-2 group">
                                        {renderEditableField(`comingSoonFeatures.${index}.title`, feature.title, 'text-lg font-semibold')}
                                    </h3>
                                    <p className="text-gray-600 mb-3 text-sm group">
                                        {renderEditableField(`comingSoonFeatures.${index}.description`, feature.description, 'text-gray-600 text-sm')}
                                    </p>
                                    <div className="text-indigo-600 text-sm font-medium group">
                                        {renderEditableField(`comingSoonFeatures.${index}.eta`, feature.eta, 'text-indigo-600 text-sm font-medium')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
