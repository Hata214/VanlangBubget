'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAppSelector } from '@/redux/hooks';
import {
    Edit,
    Trash2,
    Save,
    Plus,
    X,
    FileText,
    Home,
    ScrollText,
    Mail,
    ImageIcon,
    Check,
    RotateCcw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import HomepageSection from '@/components/admin/site-content/HomepageSection';
import ContentHistory from '@/components/admin/site-content/ContentHistory';
import ContentApproval from '@/components/admin/site-content/ContentApproval';
import { toast } from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho nội dung trang web
interface ContentSection {
    id: string;
    name: string;
    key: string;
    section: string;
    type: 'text' | 'image' | 'rich_text' | 'link' | 'boolean';
    value: string;
    lastUpdated: string;
    updatedBy?: string;
}

export default function AdminSiteContentPage() {
    const t = useTranslations();
    const { user } = useAppSelector(state => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';

    const [selectedSection, setSelectedSection] = useState<string>('home');
    const [contentItems, setContentItems] = useState<ContentSection[]>([]);
    const [homepageContent, setHomepageContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editItem, setEditItem] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [expandedSection, setExpandedSection] = useState<string | null>('hero');
    const [searchTerm, setSearchTerm] = useState('');
    const [isUnsavedChanges, setIsUnsavedChanges] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Tải dữ liệu
    useEffect(() => {
        if (selectedSection === 'home') {
            fetchHomepageContent();
        } else {
            fetchSectionContent();
        }
    }, [selectedSection, refreshKey]);

    // Tải nội dung trang chủ
    const fetchHomepageContent = async () => {
        try {
            setLoading(true);
            const response = await siteContentService.getContentByType('homepage');

            if (response && response.data) {
                setHomepageContent(response.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải nội dung trang chủ:', error);
            toast.error('Không thể tải nội dung trang chủ');
        } finally {
            setLoading(false);
        }
    };

    // Tải nội dung các trang khác
    const fetchSectionContent = async () => {
        try {
            setLoading(true);
            const response = await siteContentService.getContentByType(selectedSection);

            if (response && response.data) {
                // Chuyển đổi dữ liệu từ API sang định dạng nội bộ
                const formattedContent = Object.entries(response.data).map(([key, value], index) => ({
                    id: `${selectedSection}-${index}`,
                    name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                    key: key,
                    section: selectedSection,
                    type: typeof value === 'string' && (value as string).includes('/images/') ? 'image' :
                        typeof value === 'string' && (value as string).length > 100 ? 'rich_text' : 'text',
                    value: value as string,
                    lastUpdated: response.meta?.updatedAt || new Date().toISOString()
                }));

                setContentItems(formattedContent);
            } else {
                setContentItems([]);
            }
        } catch (error) {
            console.error(`Lỗi khi tải nội dung ${selectedSection}:`, error);
            toast.error(`Không thể tải nội dung ${selectedSection}`);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý thay đổi section
    const handleSectionChange = (section: string) => {
        if (isUnsavedChanges) {
            if (confirm('Bạn có thay đổi chưa lưu. Bạn có muốn tiếp tục không?')) {
                setSelectedSection(section);
                setIsUnsavedChanges(false);
            }
        } else {
            setSelectedSection(section);
        }

        setShowHistory(false);
    };

    // Xử lý chỉnh sửa mục
    const handleEdit = (item: ContentSection) => {
        setEditItem(item.id);
        setEditValue(item.value);
    };

    // Xử lý hủy chỉnh sửa
    const handleCancelEdit = () => {
        setEditItem(null);
        setEditValue('');
    };

    // Xử lý lưu thay đổi
    const handleSave = async (item: ContentSection) => {
        try {
            // Cập nhật dữ liệu local trước
            setContentItems(prev =>
                prev.map(i =>
                    i.id === item.id
                        ? { ...i, value: editValue, lastUpdated: new Date().toISOString() }
                        : i
                )
            );

            setEditItem(null);
            setIsUnsavedChanges(false);

            // Chuẩn bị dữ liệu để gửi lên server
            const updatedContent = {};
            contentItems.forEach(item => {
                updatedContent[item.key] = item.value;
            });

            // Gửi yêu cầu cập nhật lên server
            await siteContentService.updateContentByType(selectedSection, updatedContent);

            toast.success(isSuperAdmin
                ? 'Cập nhật nội dung thành công!'
                : 'Đã gửi nội dung để SuperAdmin phê duyệt!');

        } catch (error) {
            console.error('Lỗi khi cập nhật nội dung:', error);
            toast.error('Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại.');
        }
    };

    // Xử lý đóng mở section
    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Xử lý khi nội dung được cập nhật
    const handleContentUpdated = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Lọc nội dung theo từ khóa tìm kiếm
    const filteredContent = searchTerm
        ? contentItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.key.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : contentItems;

    const homepageSections = homepageContent ? Object.keys(homepageContent) : [];

    // Render trang chủ
    const renderHomepageContent = () => {
        if (loading) {
            return (
                <div className="admin-loading-container">
                    <div className="admin-loading-spinner"></div>
                    <p>Đang tải nội dung...</p>
                </div>
            );
        }

        if (showHistory) {
            return (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium">Lịch sử chỉnh sửa trang chủ</h2>
                        <button
                            onClick={() => setShowHistory(false)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                        >
                            Quay lại nội dung
                        </button>
                    </div>
                    <ContentHistory contentType="homepage" onRestore={handleContentUpdated} />
                </div>
            );
        }

        return (
            <>
                <ContentApproval
                    contentType="homepage"
                    onApprove={handleContentUpdated}
                    onReject={handleContentUpdated}
                />

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Quản lý nội dung trang chủ</h2>
                    <div className="space-x-2">
                        <button
                            onClick={() => setShowHistory(true)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm"
                        >
                            Xem lịch sử chỉnh sửa
                        </button>
                    </div>
                </div>

                {homepageSections.length === 0 ? (
                    <div className="admin-empty-state">
                        <p>Chưa có nội dung nào cho trang chủ</p>
                        <p className="text-sm text-gray-500 mt-1">Vui lòng thêm nội dung mới</p>
                    </div>
                ) : (
                    <>
                        {homepageSections.map(section => (
                            <HomepageSection
                                key={section}
                                section={section}
                                title={section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}
                                defaultContent={homepageContent[section]}
                                onUpdate={handleContentUpdated}
                            />
                        ))}
                    </>
                )}
            </>
        );
    };

    return (
        <div className="admin-site-content-page p-6">
            <div className="admin-site-content-header">
                <h1 className="text-3xl font-bold tracking-tight">Quản lý nội dung trang web</h1>
                <p className="text-muted-foreground mt-2">
                    Chỉnh sửa và quản lý nội dung hiển thị trên trang web
                </p>
            </div>

            <div className="admin-site-content-container mt-6">
                {/* Sidebar điều hướng */}
                <div className="admin-site-content-sidebar">
                    <div className="admin-site-content-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm nội dung..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="admin-search-input w-full"
                        />
                    </div>
                    <nav className="admin-site-content-nav mt-4">
                        <ul>
                            <li className={`admin-site-content-nav-item ${selectedSection === 'home' ? 'active' : ''}`}>
                                <button
                                    onClick={() => handleSectionChange('home')}
                                    className="admin-site-content-nav-button"
                                >
                                    <Home size={18} />
                                    <span>Trang chủ</span>
                                </button>
                            </li>
                            <li className={`admin-site-content-nav-item ${selectedSection === 'about' ? 'active' : ''}`}>
                                <button
                                    onClick={() => handleSectionChange('about')}
                                    className="admin-site-content-nav-button"
                                >
                                    <FileText size={18} />
                                    <span>Giới thiệu</span>
                                </button>
                            </li>
                            <li className={`admin-site-content-nav-item ${selectedSection === 'features' ? 'active' : ''}`}>
                                <button
                                    onClick={() => handleSectionChange('features')}
                                    className="admin-site-content-nav-button"
                                >
                                    <ScrollText size={18} />
                                    <span>Tính năng</span>
                                </button>
                            </li>
                            <li className={`admin-site-content-nav-item ${selectedSection === 'contact' ? 'active' : ''}`}>
                                <button
                                    onClick={() => handleSectionChange('contact')}
                                    className="admin-site-content-nav-button"
                                >
                                    <Mail size={18} />
                                    <span>Liên hệ</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                {/* Nội dung chính */}
                <div className="admin-site-content-main">
                    <div className="admin-site-content-main-header">
                        <h2 className="admin-site-content-main-title">
                            {selectedSection === 'home' && 'Trang chủ'}
                            {selectedSection === 'about' && 'Giới thiệu'}
                            {selectedSection === 'features' && 'Tính năng'}
                            {selectedSection === 'contact' && 'Liên hệ'}
                        </h2>
                    </div>

                    {/* Nội dung trang chủ */}
                    {selectedSection === 'home' && renderHomepageContent()}

                    {/* Nội dung các phần khác */}
                    {selectedSection !== 'home' && (
                        <>
                            {loading ? (
                                <div className="admin-loading-container">
                                    <div className="admin-loading-spinner"></div>
                                    <p>Đang tải nội dung...</p>
                                </div>
                            ) : searchTerm ? (
                                // Hiển thị kết quả tìm kiếm
                                <div className="admin-search-results">
                                    <h3 className="admin-search-results-title">Kết quả tìm kiếm: {filteredContent.length} mục</h3>
                                    {filteredContent.length === 0 ? (
                                        <div className="admin-empty-state">
                                            <p>Không tìm thấy nội dung phù hợp</p>
                                        </div>
                                    ) : (
                                        <div className="admin-content-items">
                                            {filteredContent.map(item => (
                                                <div className="admin-content-item" key={item.id}>
                                                    <div className="admin-content-item-header">
                                                        <div className="admin-content-item-title">
                                                            <span>{item.name}</span>
                                                            <span className="admin-content-item-key">{item.key}</span>
                                                        </div>
                                                        <div className="admin-content-item-actions">
                                                            <button
                                                                className="admin-content-item-button"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="admin-content-item-body">
                                                        {editItem === item.id ? (
                                                            <div className="admin-content-item-edit">
                                                                {item.type === 'rich_text' ? (
                                                                    <textarea
                                                                        value={editValue}
                                                                        onChange={(e) => {
                                                                            setEditValue(e.target.value);
                                                                            setIsUnsavedChanges(true);
                                                                        }}
                                                                        className="admin-content-item-textarea"
                                                                        rows={5}
                                                                    />
                                                                ) : item.type === 'image' ? (
                                                                    <div className="admin-content-item-image-edit">
                                                                        <input
                                                                            type="text"
                                                                            value={editValue}
                                                                            onChange={(e) => {
                                                                                setEditValue(e.target.value);
                                                                                setIsUnsavedChanges(true);
                                                                            }}
                                                                            className="admin-content-item-input"
                                                                            placeholder="Đường dẫn hình ảnh"
                                                                        />
                                                                        <div className="admin-content-item-image-preview">
                                                                            {editValue && (
                                                                                <img
                                                                                    src={editValue}
                                                                                    alt="Preview"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={editValue}
                                                                        onChange={(e) => {
                                                                            setEditValue(e.target.value);
                                                                            setIsUnsavedChanges(true);
                                                                        }}
                                                                        className="admin-content-item-input"
                                                                    />
                                                                )}
                                                                <div className="admin-content-item-edit-actions">
                                                                    <button
                                                                        className="admin-content-item-button admin-content-item-button-save"
                                                                        onClick={() => handleSave(item)}
                                                                    >
                                                                        <Save size={16} />
                                                                        <span>Lưu</span>
                                                                    </button>
                                                                    <button
                                                                        className="admin-content-item-button"
                                                                        onClick={handleCancelEdit}
                                                                    >
                                                                        <X size={16} />
                                                                        <span>Hủy</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="admin-content-item-value">
                                                                {item.type === 'image' ? (
                                                                    <div className="admin-content-item-image">
                                                                        <ImageIcon size={16} className="admin-content-item-image-icon" />
                                                                        <span>{item.value}</span>
                                                                    </div>
                                                                ) : (
                                                                    <p>
                                                                        {item.value.length > 100
                                                                            ? `${item.value.substring(0, 100)}...`
                                                                            : item.value}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="admin-content-item-footer">
                                                        <div className="admin-content-item-meta">
                                                            <span className="admin-content-item-type">
                                                                {item.type === 'text' && 'Văn bản'}
                                                                {item.type === 'rich_text' && 'Văn bản phong phú'}
                                                                {item.type === 'image' && 'Hình ảnh'}
                                                                {item.type === 'link' && 'Liên kết'}
                                                                {item.type === 'boolean' && 'Có/Không'}
                                                            </span>
                                                            <span className="admin-content-item-date">
                                                                Cập nhật: {formatDate(item.lastUpdated)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Hiển thị nội dung theo section
                                <div className="admin-content-sections">
                                    {filteredContent.length === 0 ? (
                                        <div className="admin-empty-state">
                                            <p>Không có nội dung cho phần này</p>
                                        </div>
                                    ) : (
                                        <div className="admin-content-items">
                                            {filteredContent.map(item => (
                                                <div className="admin-content-item" key={item.id}>
                                                    <div className="admin-content-item-header">
                                                        <div className="admin-content-item-title">
                                                            <span>{item.name}</span>
                                                            <span className="admin-content-item-key">{item.key}</span>
                                                        </div>
                                                        <div className="admin-content-item-actions">
                                                            <button
                                                                className="admin-content-item-button"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="admin-content-item-body">
                                                        {editItem === item.id ? (
                                                            <div className="admin-content-item-edit">
                                                                {item.type === 'rich_text' ? (
                                                                    <textarea
                                                                        value={editValue}
                                                                        onChange={(e) => {
                                                                            setEditValue(e.target.value);
                                                                            setIsUnsavedChanges(true);
                                                                        }}
                                                                        className="admin-content-item-textarea"
                                                                        rows={5}
                                                                    />
                                                                ) : item.type === 'image' ? (
                                                                    <div className="admin-content-item-image-edit">
                                                                        <input
                                                                            type="text"
                                                                            value={editValue}
                                                                            onChange={(e) => {
                                                                                setEditValue(e.target.value);
                                                                                setIsUnsavedChanges(true);
                                                                            }}
                                                                            className="admin-content-item-input"
                                                                            placeholder="Đường dẫn hình ảnh"
                                                                        />
                                                                        <div className="admin-content-item-image-preview">
                                                                            {editValue && (
                                                                                <img
                                                                                    src={editValue}
                                                                                    alt="Preview"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={editValue}
                                                                        onChange={(e) => {
                                                                            setEditValue(e.target.value);
                                                                            setIsUnsavedChanges(true);
                                                                        }}
                                                                        className="admin-content-item-input"
                                                                    />
                                                                )}
                                                                <div className="admin-content-item-edit-actions">
                                                                    <button
                                                                        className="admin-content-item-button admin-content-item-button-save"
                                                                        onClick={() => handleSave(item)}
                                                                    >
                                                                        <Save size={16} />
                                                                        <span>Lưu</span>
                                                                    </button>
                                                                    <button
                                                                        className="admin-content-item-button"
                                                                        onClick={handleCancelEdit}
                                                                    >
                                                                        <X size={16} />
                                                                        <span>Hủy</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="admin-content-item-value">
                                                                {item.type === 'image' ? (
                                                                    <div className="admin-content-item-image">
                                                                        <ImageIcon size={16} className="admin-content-item-image-icon" />
                                                                        <span>{item.value}</span>
                                                                    </div>
                                                                ) : (
                                                                    <p>
                                                                        {item.value.length > 100
                                                                            ? `${item.value.substring(0, 100)}...`
                                                                            : item.value}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="admin-content-item-footer">
                                                        <div className="admin-content-item-meta">
                                                            <span className="admin-content-item-type">
                                                                {item.type === 'text' && 'Văn bản'}
                                                                {item.type === 'rich_text' && 'Văn bản phong phú'}
                                                                {item.type === 'image' && 'Hình ảnh'}
                                                                {item.type === 'link' && 'Liên kết'}
                                                                {item.type === 'boolean' && 'Có/Không'}
                                                            </span>
                                                            <span className="admin-content-item-date">
                                                                Cập nhật: {formatDate(item.lastUpdated)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // Hàm định dạng ngày tháng
    function formatDate(dateString: string) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}
