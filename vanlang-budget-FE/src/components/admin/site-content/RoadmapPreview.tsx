'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, X, Lightbulb, ArrowLeft, CheckCircle } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';

interface RoadmapPreviewProps {
    content: any;
    onUpdate: () => void;
}

export default function RoadmapPreview({ content, onUpdate }: RoadmapPreviewProps) {
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
            await siteContentService.updateContentByType('roadmap', updatedContent);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công nội dung trang Lộ trình!'
                : 'Đã gửi nội dung trang Lộ trình để SuperAdmin phê duyệt!');
            
            setChangedFields([]);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật nội dung trang Lộ trình:', error);
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
        <div className="roadmap-preview">
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

            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center mb-4">
                            <Lightbulb className="h-16 w-16 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4 group">
                            {renderEditableField('title', updatedContent?.title || 'Lộ trình phát triển', 'text-4xl font-bold')}
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto group">
                            {renderEditableField('description', updatedContent?.description || 'Khám phá lộ trình phát triển của VanLang Budget và các tính năng sắp ra mắt trong tương lai.', 'text-xl')}
                        </p>
                    </div>

                    {/* Biểu đồ thời gian */}
                    <div className="mb-16">
                        <div className="relative">
                            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-indigo-200"></div>
                            <div className="space-y-12">
                                {[0, 1, 2, 3].map((index) => {
                                    const milestone = updatedContent?.milestones?.[index] || {
                                        date: `Q${index + 1} 2024`,
                                        title: `Cột mốc ${index + 1}`,
                                        description: `Mô tả chi tiết về cột mốc ${index + 1} và các tính năng sẽ được phát triển.`,
                                        completed: index === 0
                                    };
                                    
                                    return (
                                        <div key={index} className={`relative ${index % 2 === 0 ? 'ml-auto pl-16 pr-4' : 'mr-auto pr-16 pl-4'} w-1/2`}>
                                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/3">
                                                <div className={`w-8 h-8 rounded-full ${milestone.completed ? 'bg-green-500' : 'bg-indigo-500'} flex items-center justify-center`}>
                                                    {milestone.completed ? (
                                                        <CheckCircle className="w-5 h-5 text-white" />
                                                    ) : (
                                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-lg shadow-md">
                                                <div className="text-sm font-semibold text-indigo-600 mb-2 group">
                                                    {renderEditableField(`milestones.${index}.date`, milestone.date, 'text-sm font-semibold text-indigo-600')}
                                                </div>
                                                <h3 className="text-xl font-bold mb-3 group">
                                                    {renderEditableField(`milestones.${index}.title`, milestone.title, 'text-xl font-bold')}
                                                </h3>
                                                <p className="text-gray-600 group">
                                                    {renderEditableField(`milestones.${index}.description`, milestone.description, 'text-gray-600')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center mt-12">
                        <h2 className="text-2xl font-bold mb-4 group">
                            {renderEditableField('cta.title', updatedContent?.cta?.title || 'Bạn muốn đóng góp ý kiến?', 'text-2xl font-bold')}
                        </h2>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto group">
                            {renderEditableField('cta.description', updatedContent?.cta?.description || 'Chúng tôi luôn lắng nghe ý kiến đóng góp từ người dùng để cải thiện sản phẩm. Hãy chia sẻ ý tưởng của bạn với chúng tôi!', 'text-gray-600')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors">
                                {renderEditableField('cta.buttonText', updatedContent?.cta?.buttonText || 'Gửi phản hồi')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
