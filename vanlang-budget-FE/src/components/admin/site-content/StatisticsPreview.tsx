'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';

interface StatItem {
    number: string;
    label: string;
    description: string;
}

interface StatisticsContent {
    title: string;
    subtitle: string;
    stats: StatItem[];
}

interface StatisticsPreviewProps {
    content: StatisticsContent;
    onUpdate: () => void;
}

export default function StatisticsPreview({ content, onUpdate }: StatisticsPreviewProps) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [updatedContent, setUpdatedContent] = useState<StatisticsContent>(content);
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

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 10);

        toast.success(`Đang chỉnh sửa "${key.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}"`);
    };

    // Hàm lưu thay đổi cho một trường
    const saveInlineEdit = (key: string) => {
        handleInputChange(key, editValue);
        setEditingField(null);

        toast.success(`Đã cập nhật "${key.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}"`);
    };

    // Hàm hủy chỉnh sửa
    const cancelInlineEdit = () => {
        setEditingField(null);
    };

    const handleInputChange = (key: string, value: any) => {
        const keys = key.split('.');
        const lastKey = keys.pop();

        setUpdatedContent((prev: StatisticsContent) => {
            const newContent = { ...prev };

            // Handle nested updates for stats array
            if (keys[0] === 'stats' && keys.length === 2) {
                const statIndex = parseInt(keys[1]);
                const statField = lastKey;

                if (newContent.stats[statIndex] && statField) {
                    newContent.stats[statIndex] = {
                        ...newContent.stats[statIndex],
                        [statField]: value
                    };
                }
            } else {
                // Handle direct field updates
                let current: any = newContent;
                for (const k of keys) {
                    if (!current[k]) current[k] = {};
                    current = current[k];
                }

                if (lastKey) current[lastKey] = value;
            }

            return newContent;
        });

        // Track changed fields
        if (!changedFields.includes(key)) {
            setChangedFields(prev => [...prev, key]);
        }
    };

    // Hàm thêm stat mới
    const addNewStat = () => {
        const newStat: StatItem = {
            number: '0',
            label: 'Nhãn mới',
            description: 'Mô tả mới'
        };

        setUpdatedContent(prev => ({
            ...prev,
            stats: [...prev.stats, newStat]
        }));

        setChangedFields(prev => [...prev, 'stats']);
        toast.success('Đã thêm thống kê mới');
    };

    // Hàm xóa stat
    const removeStat = (index: number) => {
        if (updatedContent.stats.length <= 1) {
            toast.error('Phải có ít nhất một thống kê');
            return;
        }

        setUpdatedContent(prev => ({
            ...prev,
            stats: prev.stats.filter((_, i) => i !== index)
        }));

        setChangedFields(prev => [...prev, 'stats']);
        toast.success('Đã xóa thống kê');
    };

    // Hàm lưu tất cả thay đổi
    const saveAllChanges = async () => {
        if (changedFields.length === 0) {
            toast('Không có thay đổi để lưu', { icon: 'ℹ️' });
            return;
        }

        setIsSaving(true);
        try {
            // Get current homepage content
            const homepageResponse = await siteContentService.getContentByType('homepage');
            const currentHomepage = homepageResponse.data;

            // Update statistics section
            const updatedHomepage = {
                ...currentHomepage,
                statistics: updatedContent
            };

            await siteContentService.updateContentByType('homepage', updatedHomepage);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công thống kê!'
                : 'Đã gửi thống kê để SuperAdmin phê duyệt!');

            setChangedFields([]);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật thống kê:', error);
            toast.error('Không thể lưu thống kê. Vui lòng thử lại sau.');
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
        <div className="statistics-preview">
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

            {/* Statistics Section Preview */}
            <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 group">
                        {renderEditableField('title', updatedContent.title, 'text-3xl md:text-4xl font-bold text-white')}
                    </h2>
                    <p className="text-lg mb-12 group">
                        {renderEditableField('subtitle', updatedContent.subtitle, 'text-lg text-white')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {updatedContent.stats.map((stat, index) => (
                            <div key={index} className="relative bg-white/10 backdrop-blur-sm rounded-lg p-6 group">
                                {/* Delete button */}
                                {updatedContent.stats.length > 1 && (
                                    <button
                                        onClick={() => removeStat(index)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="text-4xl md:text-5xl font-bold mb-2 group">
                                    {renderEditableField(`stats.${index}.number`, stat.number, 'text-4xl md:text-5xl font-bold text-white')}
                                </div>
                                <div className="text-xl font-semibold mb-2 group">
                                    {renderEditableField(`stats.${index}.label`, stat.label, 'text-xl font-semibold text-white')}
                                </div>
                                <div className="text-sm opacity-90 group">
                                    {renderEditableField(`stats.${index}.description`, stat.description, 'text-sm text-white opacity-90')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add new stat button */}
                    <div className="mt-8">
                        <button
                            onClick={addNewStat}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors flex items-center mx-auto"
                        >
                            <Plus size={18} className="mr-2" />
                            Thêm thống kê
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
