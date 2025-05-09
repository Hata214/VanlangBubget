import React, { useState, useEffect } from 'react';
import { Edit, Save, X, RotateCcw, Eye } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';
import { toast } from 'react-hot-toast';

interface HomepageSectionProps {
    section: string;
    title: string;
    defaultContent?: any;
    onUpdate?: () => void;
}

export default function HomepageSection({ section, title, defaultContent, onUpdate }: HomepageSectionProps) {
    const [content, setContent] = useState<any>(defaultContent || {});
    const [originalContent, setOriginalContent] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';

    useEffect(() => {
        loadSectionContent();
    }, [section]);

    useEffect(() => {
        if (defaultContent) {
            setContent(defaultContent);
            setOriginalContent(defaultContent);
        }
    }, [defaultContent]);

    const loadSectionContent = async () => {
        try {
            setIsLoading(true);
            const response = await siteContentService.getHomepageSection(section);
            if (response.data) {
                setContent(response.data);
                setOriginalContent(response.data);
            }
        } catch (error) {
            console.error(`Lỗi khi tải nội dung section ${section}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartEdit = () => {
        setIsEditing(true);
        setPreviewMode(false);
    };

    const handleCancelEdit = () => {
        setContent(originalContent);
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            await siteContentService.updateHomepageSection(section, content);
            setOriginalContent(content);
            setIsEditing(false);

            toast.success(isSuperAdmin
                ? 'Đã lưu thành công!'
                : 'Đã gửi nội dung để SuperAdmin phê duyệt!');

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error(`Lỗi khi cập nhật section ${section}:`, error);
            toast.error('Không thể lưu nội dung. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePreview = () => {
        setPreviewMode(!previewMode);
    };

    const handleInputChange = (key: string, value: any) => {
        setContent(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const renderEditForm = () => {
        return (
            <div className="admin-section-edit-form space-y-4">
                {Object.keys(content).map(key => (
                    <div key={key} className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </label>
                        {typeof content[key] === 'string' && !content[key].startsWith('http') && content[key].length > 100 ? (
                            <textarea
                                value={content[key]}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                className="w-full p-2 border rounded-md"
                                rows={5}
                            />
                        ) : typeof content[key] === 'string' && (content[key].startsWith('http') || content[key].includes('/images/')) ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={content[key]}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="URL hình ảnh"
                                />
                                {content[key] && (
                                    <div className="mt-2 border rounded-md p-2">
                                        <img
                                            src={content[key]}
                                            alt={`Preview for ${key}`}
                                            className="max-h-40 object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/images/placeholder.png';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : typeof content[key] === 'boolean' ? (
                            <select
                                value={content[key].toString()}
                                onChange={(e) => handleInputChange(key, e.target.value === 'true')}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="true">Có</option>
                                <option value="false">Không</option>
                            </select>
                        ) : typeof content[key] === 'number' ? (
                            <input
                                type="number"
                                value={content[key]}
                                onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
                                className="w-full p-2 border rounded-md"
                            />
                        ) : (
                            <input
                                type="text"
                                value={content[key]}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                className="w-full p-2 border rounded-md"
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderPreview = () => {
        return (
            <div className="admin-section-preview p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium mb-2">Xem trước</h3>
                <div className="space-y-2">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key} className="mb-4">
                            <div className="text-sm font-medium text-gray-500">{key}:</div>
                            {typeof value === 'string' && (value as string).startsWith('http') || (value as string).includes('/images/') ? (
                                <div className="mt-1">
                                    <img
                                        src={value as string}
                                        alt={key}
                                        className="max-h-40 object-contain border rounded-md"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/placeholder.png';
                                        }}
                                    />
                                </div>
                            ) : typeof value === 'boolean' ? (
                                <div className="mt-1">{value ? 'Có' : 'Không'}</div>
                            ) : (
                                <div className="mt-1 whitespace-pre-wrap">{String(value)}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="admin-homepage-section border rounded-md overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <h3 className="font-medium">{title}</h3>
                <div className="flex space-x-2">
                    {!isEditing ? (
                        <>
                            <button
                                className="p-1 text-gray-500 hover:text-indigo-600"
                                onClick={togglePreview}
                                title={previewMode ? "Ẩn xem trước" : "Xem trước"}
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                className="p-1 text-gray-500 hover:text-indigo-600"
                                onClick={handleStartEdit}
                                title="Chỉnh sửa"
                                disabled={isLoading}
                            >
                                <Edit size={18} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="p-1 text-gray-500 hover:text-green-600"
                                onClick={handleSave}
                                title="Lưu"
                                disabled={isLoading}
                            >
                                <Save size={18} />
                            </button>
                            <button
                                className="p-1 text-gray-500 hover:text-red-600"
                                onClick={handleCancelEdit}
                                title="Hủy"
                                disabled={isLoading}
                            >
                                <X size={18} />
                            </button>
                            <button
                                className="p-1 text-gray-500 hover:text-indigo-600"
                                onClick={togglePreview}
                                title={previewMode ? "Ẩn xem trước" : "Xem trước"}
                            >
                                <Eye size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="p-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {previewMode ? (
                            renderPreview()
                        ) : (
                            isEditing ? renderEditForm() : (
                                <div className="text-gray-500 text-sm italic">
                                    Nhấn nút chỉnh sửa để thay đổi nội dung.
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
} 