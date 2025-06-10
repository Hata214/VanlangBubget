'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    Edit, Save, X, BarChart3, PieChart, Target, Wallet, Clock,
    Shield, CreditCard, LineChart, PiggyBank, BellRing, Landmark,
    BarChart, ChartPie, Calendar, DollarSign
} from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';
import { useSiteContent } from '@/components/SiteContentProvider';

interface ComingSoonFeature {
    id?: string;
    icon: string;
    title: string;
    description: string;
    eta: string;
}

interface FeaturesPreviewProps {
    content: any;
    onUpdate: () => void;
}

export default function FeaturesPreview({ content, onUpdate }: FeaturesPreviewProps) {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [updatedContent, setUpdatedContent] = useState<any>(content || {});
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [changedFields, setChangedFields] = useState<string[]>([]);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAppSelector((state) => state.auth);
    const isSuperAdmin = user?.role === 'superadmin';
    const { refreshContent } = useSiteContent();

    useEffect(() => {
        console.log('🔄 FeaturesPreview content updated:', content);
        setUpdatedContent(content || {});
        // Reset changed fields khi content thay đổi từ bên ngoài
        setChangedFields([]);
    }, [content]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S để save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (changedFields.length > 0) {
                    saveAllChanges();
                }
            }
            // Escape để cancel editing
            if (e.key === 'Escape' && editingField) {
                cancelInlineEdit();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [changedFields.length, editingField]);

    // Early return if no content
    if (!content && !updatedContent) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Đang tải nội dung...</p>
                </div>
            </div>
        );
    }

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
            // Features được xử lý như content type riêng biệt, cần wrap trong language object
            const dataToSave = {
                vi: updatedContent
            };

            console.log('💾 Saving features content:', dataToSave);
            const saveResponse = await siteContentService.updateContentByType('features', dataToSave);
            console.log('✅ Save response:', saveResponse);

            toast.success(isSuperAdmin
                ? 'Đã lưu thành công nội dung trang Tính năng!'
                : 'Đã gửi nội dung trang Tính năng để SuperAdmin phê duyệt!');

            // Set success state và timestamp
            setLastSaved(new Date());
            setSaveSuccess(true);
            setChangedFields([]);

            // Reset success animation sau 3 giây
            setTimeout(() => setSaveSuccess(false), 3000);

            // Force reload fresh content từ server
            console.log('🔄 Force reloading features content...');
            try {
                const freshContent = await siteContentService.getContentByType('features');
                console.log('🔄 Fresh content loaded:', freshContent);

                if (freshContent && freshContent.data && freshContent.data.vi) {
                    console.log('🔄 Updating local state with fresh content');
                    setUpdatedContent(freshContent.data.vi);
                }
            } catch (reloadError) {
                console.error('Error reloading fresh content:', reloadError);
            }

            // Refresh content trong SiteContentProvider
            await refreshContent();

            // Force update parent component
            if (onUpdate) {
                console.log('🔄 Calling parent onUpdate...');
                onUpdate();
            }

            // Additional force refresh after a short delay
            setTimeout(async () => {
                console.log('🔄 Additional refresh after delay...');
                await refreshContent();
            }, 1000);
        } catch (error) {
            console.error('Lỗi khi cập nhật nội dung trang Tính năng:', error);
            toast.error('Không thể lưu nội dung. Vui lòng thử lại sau.');
        } finally {
            setIsSaving(false);
        }
    };

    // Render một trường có thể chỉnh sửa
    const renderEditableField = (key: string, value: any, className: string = '') => {
        // Safe value handling
        const safeValue = value || '';

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

        const isChanged = changedFields.includes(key);

        return (
            <span
                className={`editable-content cursor-pointer hover:bg-blue-50 hover:border-dashed hover:border-blue-300 p-2 rounded transition-all duration-300 relative ${className} ${isChanged ? 'bg-green-50 border-2 border-green-300 shadow-sm' : ''
                    }`}
                onClick={() => startInlineEdit(key, safeValue)}
                data-field={key}
                title={isChanged ? "Đã thay đổi - Nhấp để chỉnh sửa" : "Nhấp để chỉnh sửa"}
                style={{
                    position: 'relative',
                    display: 'inline-block'
                }}
            >
                {safeValue || `[Chưa có nội dung cho ${key}]`}
                <Edit size={14} className="inline-block ml-1 text-gray-400 opacity-0 group-hover:opacity-100" />
                {isChanged && (
                    <span
                        className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold animate-pulse"
                        title="Đã thay đổi"
                    >
                        ✓
                    </span>
                )}
            </span>
        );
    };

    // Hàm thêm Coming Soon feature mới
    const addComingSoonFeature = () => {
        const newFeature = {
            id: `coming-soon-${Date.now()}`,
            icon: '🚀',
            title: 'Tính năng mới',
            description: 'Mô tả về tính năng sắp ra mắt',
            eta: 'Q1 2025'
        };

        setUpdatedContent((prev: any) => ({
            ...prev,
            comingSoon: [...(prev.comingSoon || []), newFeature]
        }));

        // Đánh dấu là đã thay đổi
        const newFieldKey = `comingSoon.${(updatedContent?.comingSoon || []).length}`;
        setChangedFields([...changedFields, `${newFieldKey}.title`, `${newFieldKey}.description`, `${newFieldKey}.eta`, `${newFieldKey}.icon`]);

        toast.success('Đã thêm tính năng sắp ra mắt mới!');
    };

    // Hàm xóa Coming Soon feature
    const removeComingSoonFeature = (index: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tính năng này?')) {
            setUpdatedContent((prev: any) => ({
                ...prev,
                comingSoon: (prev.comingSoon || []).filter((_: any, i: number) => i !== index)
            }));

            // Cập nhật changed fields để loại bỏ các field của feature đã xóa
            const fieldsToRemove = changedFields.filter(field =>
                !field.startsWith(`comingSoon.${index}.`)
            );
            setChangedFields(fieldsToRemove);

            toast.success('Đã xóa tính năng sắp ra mắt!');
        }
    };

    // Hàm lấy icon tương ứng
    const getFeatureIcon = (iconName: string) => {
        const iconClass = "h-6 w-6 text-indigo-600";
        switch (iconName) {
            case 'BarChart3': return <BarChart3 className={iconClass} />;
            case 'PieChart': return <PieChart className={iconClass} />;
            case 'ChartPie': return <ChartPie className={iconClass} />;
            case 'Target': return <Target className={iconClass} />;
            case 'Wallet': return <Wallet className={iconClass} />;
            case 'Clock': return <Clock className={iconClass} />;
            case 'Shield': return <Shield className={iconClass} />;
            case 'CreditCard': return <CreditCard className={iconClass} />;
            case 'LineChart': return <LineChart className={iconClass} />;
            case 'PiggyBank': return <PiggyBank className={iconClass} />;
            case 'BellRing': return <BellRing className={iconClass} />;
            case 'Landmark': return <Landmark className={iconClass} />;
            case 'BarChart': return <BarChart className={iconClass} />;
            case 'Calendar': return <Calendar className={iconClass} />;
            case 'DollarSign': return <DollarSign className={iconClass} />;
            default: return <BarChart3 className={iconClass} />;
        }
    };

    return (
        <div className="features-preview">
            {/* Status Bar */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 z-40 shadow-sm">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">
                            Features Content Management
                        </span>
                        {changedFields.length > 0 && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                {changedFields.length} thay đổi chưa lưu
                            </span>
                        )}
                        {saveSuccess && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                                ✅ Đã lưu thành công!
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {lastSaved && (
                            <span>
                                Lần cuối: {lastSaved.toLocaleTimeString('vi-VN')}
                            </span>
                        )}
                        {changedFields.length > 0 && (
                            <span className="text-xs">
                                Đã sửa: {changedFields.slice(0, 3).join(', ')}
                                {changedFields.length > 3 && ` +${changedFields.length - 3} khác`}
                            </span>
                        )}
                        <span className="text-xs text-gray-400">
                            Ctrl+S: Lưu | Esc: Hủy
                        </span>
                    </div>
                </div>
            </div>

            {/* Floating save button */}
            {changedFields.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button
                        onClick={saveAllChanges}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-md shadow-lg transition-all duration-300 flex items-center ${isSaving
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl'
                            }`}
                    >
                        <Save size={18} className="mr-2" />
                        {isSaving ? 'Đang lưu...' : `Lưu ${changedFields.length} thay đổi`}
                    </button>
                </div>
            )}

            <div className="container mx-auto py-12 px-4 pt-20">
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
                <h2 className="text-2xl font-bold mb-6 text-center group">
                    {renderEditableField('mainFeaturesTitle', updatedContent?.mainFeaturesTitle || 'Tính năng chính', 'text-2xl font-bold')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                        const feature = updatedContent?.mainFeatures?.[index] || {
                            id: `feature-${index + 1}`,
                            title: `Tính năng ${index + 1}`,
                            description: `Mô tả chi tiết về tính năng ${index + 1}`,
                            iconName: 'BarChart3',
                            benefits: [
                                `Lợi ích 1 của tính năng ${index + 1}`,
                                `Lợi ích 2 của tính năng ${index + 1}`,
                                `Lợi ích 3 của tính năng ${index + 1}`,
                                `Lợi ích 4 của tính năng ${index + 1}`
                            ]
                        };

                        return (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center mb-4">
                                    <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 mr-4">
                                        {getFeatureIcon(feature.iconName)}
                                    </div>
                                    <h3 className="text-xl font-bold group">
                                        {renderEditableField(`mainFeatures.${index}.title`, feature.title, 'text-xl font-bold')}
                                    </h3>
                                </div>
                                <p className="text-gray-600 mb-4 group">
                                    {renderEditableField(`mainFeatures.${index}.description`, feature.description, 'text-gray-600')}
                                </p>
                                <div className="space-y-2">
                                    <p className="font-medium mb-2">Lợi ích:</p>
                                    <ul className="space-y-2">
                                        {(feature.benefits || []).map((benefit: string, benefitIndex: number) => (
                                            <li key={benefitIndex} className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span className="text-gray-600 group">
                                                    {renderEditableField(`mainFeatures.${index}.benefits.${benefitIndex}`, benefit, 'text-gray-600')}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Coming Soon Features */}
                <div className="bg-gray-50 p-8 rounded-lg mb-16">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold group">
                            {renderEditableField('comingSoonTitle', updatedContent?.comingSoonTitle || 'Sắp ra mắt', 'text-2xl font-bold')}
                        </h2>
                        <button
                            onClick={addComingSoonFeature}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <span>+</span>
                            Thêm tính năng
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(updatedContent?.comingSoon || []).map((feature: ComingSoonFeature, index: number) => (
                            <div key={feature.id || index} className="bg-white p-5 rounded-md shadow-sm border-2 border-dashed border-indigo-200 relative">
                                {/* Delete button */}
                                <button
                                    onClick={() => removeComingSoonFeature(index)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                                    title="Xóa tính năng"
                                >
                                    ✕
                                </button>

                                {/* Icon field */}
                                <div className="mb-3 group">
                                    <label className="block text-xs text-gray-500 mb-1">Icon (emoji):</label>
                                    {renderEditableField(`comingSoon.${index}.icon`, feature.icon || '🚀', 'text-2xl')}
                                </div>

                                {/* Title field */}
                                <h3 className="text-lg font-semibold mb-2 group">
                                    {renderEditableField(`comingSoon.${index}.title`, feature.title || 'Tính năng mới', 'text-lg font-semibold')}
                                </h3>

                                {/* Description field */}
                                <p className="text-gray-600 mb-3 text-sm group">
                                    {renderEditableField(`comingSoon.${index}.description`, feature.description || 'Mô tả tính năng', 'text-gray-600 text-sm')}
                                </p>

                                {/* ETA field */}
                                <div className="text-indigo-600 text-sm font-medium group">
                                    <label className="block text-xs text-gray-500 mb-1">Thời gian dự kiến:</label>
                                    {renderEditableField(`comingSoon.${index}.eta`, feature.eta || 'Q1 2025', 'text-indigo-600 text-sm font-medium')}
                                </div>
                            </div>
                        ))}

                        {/* Add new feature placeholder */}
                        {(!updatedContent?.comingSoon || updatedContent.comingSoon.length === 0) && (
                            <div className="bg-white p-5 rounded-md shadow-sm border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[200px]">
                                <div className="text-center text-gray-500">
                                    <p className="mb-2">Chưa có tính năng sắp ra mắt</p>
                                    <button
                                        onClick={addComingSoonFeature}
                                        className="text-indigo-600 hover:text-indigo-800"
                                    >
                                        Thêm tính năng đầu tiên
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bảng giá */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 text-center group">
                        {renderEditableField('pricingTitle', updatedContent?.pricingTitle || 'Bảng giá', 'text-2xl font-bold')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[0, 1, 2].map((index) => {
                            const plan = updatedContent?.pricingPlans?.[index] || {
                                name: index === 0 ? 'Cơ bản' : (index === 1 ? 'Tiêu chuẩn' : 'Cao cấp'),
                                price: index === 0 ? '0' : (index === 1 ? '99.000' : '199.000'),
                                features: [
                                    index === 0 ? 'Theo dõi chi tiêu' : (index === 1 ? 'Tất cả tính năng cơ bản' : 'Tất cả tính năng tiêu chuẩn'),
                                    index === 0 ? 'Lập ngân sách cơ bản' : (index === 1 ? 'Báo cáo chi tiết' : 'Tư vấn tài chính cá nhân'),
                                    index === 0 ? 'Báo cáo hàng tháng' : (index === 1 ? 'Quản lý khoản vay' : 'Đồng bộ hóa với ngân hàng'),
                                    index === 0 ? 'Hỗ trợ qua email' : (index === 1 ? 'Hỗ trợ 24/7' : 'Ưu tiên hỗ trợ kỹ thuật')
                                ]
                            };

                            return (
                                <div key={index} className={`bg-white p-6 rounded-lg shadow-md ${index === 1 ? 'border-2 border-indigo-500 relative' : ''}`}>
                                    {index === 1 && (
                                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm">
                                            Phổ biến nhất
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold mb-3 text-center group">
                                        {renderEditableField(`pricingPlans.${index}.name`, plan.name, 'text-xl font-bold')}
                                    </h3>
                                    <div className="text-center mb-6">
                                        <span className="text-3xl font-bold group">
                                            {renderEditableField(`pricingPlans.${index}.price`, plan.price, 'text-3xl font-bold')}
                                        </span>
                                        <span className="text-gray-500">{plan.price === '0' ? '' : ' VNĐ/tháng'}</span>
                                    </div>
                                    <ul className="space-y-3 mb-6">
                                        {(plan.features || []).map((feature: string, featureIndex: number) => (
                                            <li key={featureIndex} className="flex items-start">
                                                <span className="text-green-500 mr-2">✓</span>
                                                <span className="text-gray-600 group">
                                                    {renderEditableField(`pricingPlans.${index}.features.${featureIndex}`, feature, 'text-gray-600')}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="text-center">
                                        <button className={`px-6 py-2 rounded-md ${index === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                            {index === 0 ? 'Dùng miễn phí' : 'Đăng ký ngay'}
                                        </button>
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
