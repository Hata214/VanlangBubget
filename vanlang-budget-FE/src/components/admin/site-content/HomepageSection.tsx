import React, { useState, useEffect } from 'react';
import { Edit, Save, X, RotateCcw, Eye } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';
import { toast } from 'react-hot-toast';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

interface HomepageSectionProps {
    section: string;
    title: string;
    defaultContent?: any;
    onUpdate?: () => void;
    id?: string;
}

interface ContentData {
    [key: string]: string | number | boolean;
}

export default function HomepageSection({ section, title, defaultContent, onUpdate, id }: HomepageSectionProps) {
    const [content, setContent] = useState<ContentData>(defaultContent || {});
    const [originalContent, setOriginalContent] = useState<ContentData>({});
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
        setContent((prev: ContentData) => ({
            ...prev,
            [key]: value
        }));
    };

    // Hàm lấy mô tả cho từng section
    const getSectionDescription = (sectionName: string): string => {
        const descriptions: Record<string, string> = {
            'hero': 'Phần banner chính ở đầu trang. Hiển thị tiêu đề, mô tả ngắn và hình ảnh chính của trang web.',
            'features': 'Phần hiển thị các tính năng chính của sản phẩm/dịch vụ. Mỗi tính năng bao gồm tiêu đề, mô tả và biểu tượng.',
            'testimonials': 'Phần hiển thị đánh giá từ khách hàng. Bao gồm nội dung đánh giá, tên và chức vụ của người đánh giá.',
            'pricing': 'Phần hiển thị các gói dịch vụ và giá cả. Bao gồm tên gói, giá, mô tả và danh sách tính năng.',
            'cta': 'Phần kêu gọi hành động (Call to Action). Hiển thị tiêu đề, mô tả và nút hành động.',
            'stats': 'Phần hiển thị các số liệu thống kê. Bao gồm con số và mô tả ngắn gọn.',
            'footer': 'Phần chân trang. Hiển thị logo, thông tin liên hệ, liên kết mạng xã hội và menu phụ.',
            'header': 'Phần đầu trang. Hiển thị logo, menu chính và các nút hành động.'
        };

        return descriptions[sectionName] || '';
    };

    // Hàm lấy mô tả cho từng trường
    const getFieldDescription = (key: string): string => {
        // Mô tả chung cho các trường phổ biến
        const commonDescriptions: Record<string, string> = {
            'title': 'Tiêu đề chính hiển thị ở phần đầu.',
            'subtitle': 'Tiêu đề phụ hoặc mô tả ngắn hiển thị dưới tiêu đề chính.',
            'description': 'Mô tả chi tiết về nội dung.',
            'imageUrl': 'Đường dẫn đến hình ảnh. Có thể là URL đầy đủ hoặc đường dẫn tương đối (ví dụ: /images/example.jpg).',
            'buttonText': 'Văn bản hiển thị trên nút.',
            'buttonUrl': 'Đường dẫn khi nhấp vào nút.',
            'enabled': 'Bật/tắt hiển thị phần này trên trang web.',
            'items': 'Danh sách các mục con.',
            'icon': 'Biểu tượng hiển thị (thường là tên biểu tượng hoặc URL hình ảnh).'
        };

        return commonDescriptions[key] || '';
    };

    const renderEditForm = () => {
        return (
            <div className="admin-section-edit-form space-y-4">
                {Object.keys(content).map(key => (
                    <div key={key} className="mb-4">
                        <div className="flex items-center mb-1">
                            <label className="block text-sm font-medium">
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                            </label>
                            {getFieldDescription(key) && (
                                <HelpTooltip text={getFieldDescription(key)} />
                            )}
                        </div>
                        {typeof content[key] === 'string' && !content[key].startsWith('http') && content[key].length > 100 ? (
                            <div>
                                <textarea
                                    value={content[key]}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    rows={5}
                                />
                                <p className="text-xs text-gray-500 mt-1">Văn bản dài. Hỗ trợ nhiều dòng.</p>
                            </div>
                        ) : typeof content[key] === 'string' && (content[key].startsWith('http') || content[key].includes('/images/')) ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={content[key]}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="URL hình ảnh"
                                />
                                <p className="text-xs text-gray-500">Nhập URL hình ảnh hoặc đường dẫn tương đối (ví dụ: /images/example.jpg)</p>
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
                            <div>
                                <select
                                    value={content[key].toString()}
                                    onChange={(e) => handleInputChange(key, e.target.value === 'true')}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="true">Có</option>
                                    <option value="false">Không</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Chọn "Có" để bật hoặc "Không" để tắt.</p>
                            </div>
                        ) : typeof content[key] === 'number' ? (
                            <div>
                                <input
                                    type="number"
                                    value={content[key]}
                                    onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
                                    className="w-full p-2 border rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">Nhập giá trị số.</p>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    value={content[key]}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">Văn bản ngắn. Chỉ hỗ trợ một dòng.</p>
                            </div>
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
        <div id={id} className="admin-homepage-section border rounded-md overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <div className="flex items-center">
                    <h3 className="font-medium">{title}</h3>
                    {getSectionDescription(section) && (
                        <HelpTooltip text={getSectionDescription(section)} size="md" />
                    )}
                </div>
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