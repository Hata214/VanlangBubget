import React, { useState, useEffect } from 'react';
import { Edit, Save, X, RotateCcw, Eye } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';
import { toast } from 'react-hot-toast';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import './wysiwyg-editor.css'; // Import CSS cho WYSIWYG Editor

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
    const [currentLanguage, setCurrentLanguage] = useState('vi'); // Mặc định là tiếng Việt
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [changedFields, setChangedFields] = useState<string[]>([]);
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';

    useEffect(() => {
        loadSectionContent();
    }, [section, currentLanguage]);

    useEffect(() => {
        if (defaultContent) {
            setContent(defaultContent);
            setOriginalContent(defaultContent);
        }
    }, [defaultContent]);

    const loadSectionContent = async () => {
        try {
            setIsLoading(true);

            let response;

            // Kiểm tra xem section có phải là "homepage" không
            if (section === "homepage") {
                // Nếu là homepage, sử dụng getContentByType để lấy toàn bộ nội dung trang chủ
                response = await siteContentService.getContentByType("homepage");
                console.log(`Đã tải nội dung cho homepage:`, response);
            } else {
                // Với các section khác, sử dụng getHomepageSection
                response = await siteContentService.getHomepageSection(section);
                console.log(`Đã tải nội dung cho section ${section}:`, response);
            }

            if (response && response.data) {
                setContent(response.data);
                setOriginalContent(response.data);

                // Hiển thị thông báo nếu đang sử dụng dữ liệu fallback
                if (response.meta && response.meta.source === 'fallback') {
                    toast(`Đang sử dụng dữ liệu mẫu cho phần ${title}. Các thay đổi sẽ được lưu vào cơ sở dữ liệu.`);
                }
            } else {
                // Nếu không có dữ liệu, tạo dữ liệu mẫu cơ bản
                const basicContent = {
                    title: title,
                    description: `Mô tả cho phần ${title}`,
                    enabled: true
                };

                setContent(basicContent);
                setOriginalContent(basicContent);
                console.warn(`Không có dữ liệu cho section ${section}, sử dụng dữ liệu mẫu`);
            }
        } catch (error) {
            console.error(`Lỗi khi tải nội dung section ${section}:`, error);

            // Tạo dữ liệu mẫu cơ bản trong trường hợp lỗi
            const fallbackContent = {
                title: title,
                description: `Mô tả cho phần ${title}`,
                enabled: true
            };

            setContent(fallbackContent);
            setOriginalContent(fallbackContent);
            toast.error(`Không thể tải nội dung phần ${title}. Đang sử dụng dữ liệu mẫu.`);
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

            let response;

            // Kiểm tra xem section có phải là "homepage" không
            if (section === "homepage") {
                // Nếu là homepage, sử dụng updateContentByType để cập nhật toàn bộ nội dung trang chủ
                response = await siteContentService.updateContentByType("homepage", content);
                console.log(`Đã lưu nội dung cho homepage:`, response);
            } else {
                // Với các section khác, sử dụng updateHomepageSection
                response = await siteContentService.updateHomepageSection(section, content);
                console.log(`Đã lưu nội dung cho section ${section}:`, response);
            }

            setOriginalContent(content);
            setIsEditing(false);
            setHasUnsavedChanges(false); // Đặt lại trạng thái thay đổi chưa lưu
            setChangedFields([]); // Đặt lại danh sách các trường đã thay đổi

            toast.success(isSuperAdmin
                ? `Đã lưu thành công phần ${title}!`
                : `Đã gửi nội dung phần ${title} để SuperAdmin phê duyệt!`);

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error(`Lỗi khi cập nhật section ${section}:`, error);
            toast.error(`Không thể lưu nội dung phần ${title}. Vui lòng thử lại sau.`);
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

        // Kiểm tra xem nội dung đã thay đổi so với ban đầu chưa
        const newContent = {
            ...content,
            [key]: value
        };

        // Kiểm tra xem trường này có thay đổi so với giá trị ban đầu không
        const fieldChanged = JSON.stringify(value) !== JSON.stringify(originalContent[key]);

        // Cập nhật danh sách các trường đã thay đổi
        if (fieldChanged) {
            if (!changedFields.includes(key)) {
                setChangedFields([...changedFields, key]);
            }
        } else {
            // Nếu trường này đã quay lại giá trị ban đầu, loại bỏ khỏi danh sách
            setChangedFields(changedFields.filter(field => field !== key));
        }

        // So sánh với nội dung ban đầu để xác định có thay đổi chưa lưu không
        const hasChanges = JSON.stringify(newContent) !== JSON.stringify(originalContent);
        setHasUnsavedChanges(hasChanges);

        if (hasChanges) {
            // Hiển thị chỉ báo nhỏ cho người dùng biết có thay đổi chưa lưu
            console.log('Có thay đổi chưa lưu:', changedFields);
        }
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
                                <ImageEditor
                                    value={content[key]}
                                    onChange={(url) => handleInputChange(key, url)}
                                    label={`Hình ảnh cho ${key}`}
                                    placeholder="Nhập URL hình ảnh hoặc tải lên"
                                />
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

    // State để theo dõi trường đang được chỉnh sửa
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string | boolean | number>('');
    const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

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

        // Hiển thị thông báo toast để hướng dẫn người dùng
        toast.success(`Đang chỉnh sửa trường "${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}". Nhấn Enter để lưu, Esc để hủy.`, {
            position: "bottom-center",
            duration: 3000,
            icon: '✏️'
        });
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

        toast.success(`Đã cập nhật "${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}"`, {
            position: "bottom-center",
            icon: '✅',
            duration: 2000
        });
    };

    // Hàm hủy chỉnh sửa
    const cancelInlineEdit = () => {
        setEditingField(null);
    };

    // Xử lý phím tắt khi chỉnh sửa inline
    const handleInlineKeyDown = (e: React.KeyboardEvent, key: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveInlineEdit(key);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            cancelInlineEdit();
        }
    };

    const renderPreview = () => {
        return (
            <div className="admin-section-preview p-4 bg-gray-50 rounded-md">
                <div className="flex flex-col mb-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Xem trước</h3>
                        <div className="flex items-center space-x-2">
                            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Nhấp vào nội dung để chỉnh sửa trực tiếp
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3 text-sm">
                        <div className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-blue-800">Hướng dẫn chỉnh sửa trực tiếp:</p>
                                        <ol className="list-decimal list-inside mt-1 space-y-1 text-blue-700">
                                            <li>Nhấp vào nút <span className="font-medium bg-blue-100 px-1 rounded">"Nhấp để chỉnh sửa"</span> bên cạnh mỗi trường</li>
                                            <li>Hoặc nhấp trực tiếp vào nội dung bạn muốn chỉnh sửa</li>
                                            <li>Nhập nội dung mới và nhấn <span className="font-medium bg-blue-100 px-1 rounded">Enter</span> hoặc nút <span className="font-medium bg-blue-100 px-1 rounded">"Lưu"</span></li>
                                            <li>Sau khi chỉnh sửa xong, nhấn nút <span className="font-medium bg-blue-100 px-1 rounded">"Lưu thay đổi"</span> ở trên cùng</li>
                                        </ol>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Tìm tất cả các phần tử có thể chỉnh sửa trong phần xem trước
                                            const editableElements = document.querySelectorAll('.admin-section-preview .editable-content');

                                            // Thêm class highlight-editable cho từng phần tử
                                            editableElements.forEach((element, index) => {
                                                setTimeout(() => {
                                                    element.classList.add('highlight-editable');

                                                    // Xóa class sau 3 giây
                                                    setTimeout(() => {
                                                        element.classList.remove('highlight-editable');
                                                    }, 3000);
                                                }, index * 200);
                                            });

                                            toast.success('Đã làm nổi bật các phần tử có thể chỉnh sửa', {
                                                position: "bottom-center",
                                                duration: 3000,
                                                icon: '✏️'
                                            });
                                        }}
                                        className="bg-blue-500 text-white text-xs px-3 py-2 rounded hover:bg-blue-600 transition-colors flex items-center shadow-sm animate-pulse"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Làm nổi bật các phần tử có thể chỉnh sửa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-3">
                        <div className="flex space-x-2">
                            {hasUnsavedChanges && (
                                <button
                                    onClick={() => {
                                        setContent(originalContent);
                                        setHasUnsavedChanges(false);
                                        setChangedFields([]);
                                        toast.success('Đã hủy tất cả thay đổi');
                                    }}
                                    className="bg-gray-500 text-white text-xs px-3 py-1 rounded hover:bg-gray-600 transition-colors flex items-center"
                                >
                                    <RotateCcw size={12} className="mr-1" />
                                    Hủy thay đổi
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className={`${hasUnsavedChanges ? 'animate-pulse bg-green-500 shadow-md' : 'bg-gray-400'} text-white text-xs px-3 py-1 rounded hover:bg-green-600 transition-colors flex items-center ${hasUnsavedChanges ? 'font-medium' : ''}`}
                                disabled={!hasUnsavedChanges}
                            >
                                <Save size={12} className="mr-1" />
                                {hasUnsavedChanges ? 'Lưu thay đổi' : 'Không có thay đổi'}
                                {hasUnsavedChanges && (
                                    <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full">{changedFields.length}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key} className={`mb-4 p-3 border ${changedFields.includes(key) ? 'border-orange-300 bg-orange-50' : 'border-gray-200'} rounded-md hover:border-blue-300 transition-colors ${changedFields.includes(key) ? 'relative' : ''}`}>
                            {changedFields.includes(key) && (
                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    Đã thay đổi
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-medium text-gray-700 flex items-center">
                                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                    {getFieldDescription(key) && (
                                        <HelpTooltip text={getFieldDescription(key)} />
                                    )}
                                </div>
                                <button
                                    onClick={() => startInlineEdit(key, value)}
                                    className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors flex items-center shadow-sm animate-pulse"
                                >
                                    <Edit size={12} className="mr-1" />
                                    Nhấp để chỉnh sửa
                                </button>
                            </div>

                            {editingField === key ? (
                                <div className="mt-1 border-2 border-blue-400 rounded-md p-2 bg-white animate-fadeIn">
                                    {typeof value === 'string' && (value as string).length > 100 ? (
                                        <textarea
                                            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                                            value={editValue as string}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => handleInlineKeyDown(e, key)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                            rows={Math.min(5, Math.max(2, ((value as string).match(/\n/g) || []).length + 2))}
                                            autoFocus
                                        />
                                    ) : typeof value === 'string' && ((value as string).startsWith('http') || (value as string).includes('/images/')) ? (
                                        <div className="space-y-2">
                                            <ImageEditor
                                                value={editValue as string}
                                                onChange={(url) => setEditValue(url)}
                                                placeholder="Nhập URL hình ảnh hoặc tải lên"
                                            />
                                            <div className="flex space-x-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleInlineSave(key)}
                                                >
                                                    Lưu
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={cancelInlineEdit}
                                                >
                                                    Hủy
                                                </Button>
                                            </div>
                                        </div>
                                    ) : typeof value === 'boolean' ? (
                                        <select
                                            ref={inputRef as React.RefObject<HTMLSelectElement>}
                                            value={String(editValue)}
                                            onChange={(e) => setEditValue(e.target.value === 'true')}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="true">Có</option>
                                            <option value="false">Không</option>
                                        </select>
                                    ) : typeof value === 'number' ? (
                                        <input
                                            ref={inputRef as React.RefObject<HTMLInputElement>}
                                            type="number"
                                            value={editValue as number}
                                            onChange={(e) => setEditValue(parseFloat(e.target.value))}
                                            onKeyDown={(e) => handleInlineKeyDown(e, key)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    ) : (
                                        <input
                                            ref={inputRef as React.RefObject<HTMLInputElement>}
                                            type="text"
                                            value={editValue as string}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => handleInlineKeyDown(e, key)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    )}

                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-gray-500">Nhấn Enter để lưu, Esc để hủy</p>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={cancelInlineEdit}
                                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center"
                                            >
                                                <X size={12} className="mr-1" />
                                                Hủy
                                            </button>
                                            <button
                                                onClick={() => saveInlineEdit(key)}
                                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                                            >
                                                <Save size={12} className="mr-1" />
                                                Lưu
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="mt-1 p-2 border border-dashed border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors relative editable-content"
                                    onClick={() => startInlineEdit(key, value)}
                                    data-field={key}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-blue-500 bg-opacity-10 rounded transition-opacity">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs shadow-sm border border-blue-200 flex items-center">
                                            <Edit size={10} className="mr-1" />
                                            Nhấp để chỉnh sửa
                                        </span>
                                    </div>
                                    {typeof value === 'string' && ((value as string).startsWith('http') || (value as string).includes('/images/')) ? (
                                        <div className="flex flex-col items-center">
                                            <img
                                                src={value as string}
                                                alt={key}
                                                className="max-h-40 object-contain border rounded-md"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/images/placeholder.png';
                                                }}
                                            />
                                            <div className="text-xs text-gray-500 mt-1">{value as string}</div>
                                        </div>
                                    ) : typeof value === 'boolean' ? (
                                        <div className={`inline-block px-2 py-1 rounded-full text-sm ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {value ? 'Có' : 'Không'}
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap relative group">
                                            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                Nhấp để chỉnh sửa
                                            </span>
                                            {String(value)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div >
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