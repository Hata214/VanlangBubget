'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Save, X, Mail, Phone, MapPin, HelpCircle } from 'lucide-react';
import siteContentService from '@/services/siteContentService';
import { useAppSelector } from '@/redux/hooks';

interface ContactPreviewProps {
    content: any;
    onUpdate: () => void;
}

export default function ContactPreview({ content, onUpdate }: ContactPreviewProps) {
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
            toast('Không có thay đổi để lưu');
            return;
        }

        setIsSaving(true);
        try {
            await siteContentService.updateContentByType('contact', updatedContent);
            toast.success(isSuperAdmin
                ? 'Đã lưu thành công nội dung trang Liên hệ!'
                : 'Đã gửi nội dung trang Liên hệ để SuperAdmin phê duyệt!');

            setChangedFields([]);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật nội dung trang Liên hệ:', error);
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
        <div className="contact-preview">
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
                        {renderEditableField('title', updatedContent?.title || 'Liên hệ với chúng tôi', 'text-4xl font-bold')}
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto group">
                        {renderEditableField('description', updatedContent?.description || 'Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào, đừng ngần ngại liên hệ với chúng tôi. Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.', 'text-xl')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
                    {/* Thông tin liên hệ */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 group">
                            {renderEditableField('contactInfo.title', updatedContent?.contactInfo?.title || 'Thông tin liên hệ', 'text-2xl font-bold')}
                        </h2>
                        <div className="bg-white p-6 rounded-lg shadow space-y-6">
                            <div className="flex items-start">
                                <Mail className="w-5 h-5 text-indigo-600 mt-1 mr-3" />
                                <div>
                                    <p className="font-medium group">
                                        {renderEditableField('contactInfo.emailLabel', updatedContent?.contactInfo?.emailLabel || 'Email', 'font-medium')}
                                    </p>
                                    <a href="#" className="text-indigo-600 hover:text-indigo-800 group">
                                        {renderEditableField('contactInfo.email', updatedContent?.contactInfo?.email || 'support@vanlangbudget.com', 'text-indigo-600 hover:text-indigo-800')}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Phone className="w-5 h-5 text-indigo-600 mt-1 mr-3" />
                                <div>
                                    <p className="font-medium group">
                                        {renderEditableField('contactInfo.phoneLabel', updatedContent?.contactInfo?.phoneLabel || 'Điện thoại', 'font-medium')}
                                    </p>
                                    <p className="text-gray-600 group">
                                        {renderEditableField('contactInfo.phone', updatedContent?.contactInfo?.phone || '(+84) 123 456 789', 'text-gray-600')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <MapPin className="w-5 h-5 text-indigo-600 mt-1 mr-3" />
                                <div>
                                    <p className="font-medium group">
                                        {renderEditableField('contactInfo.addressLabel', updatedContent?.contactInfo?.addressLabel || 'Địa chỉ', 'font-medium')}
                                    </p>
                                    <p className="text-gray-600 group">
                                        {renderEditableField('contactInfo.address', updatedContent?.contactInfo?.address || 'Văn Lang University, Hồ Chí Minh City', 'text-gray-600')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form liên hệ */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-6 group">
                            {renderEditableField('contactForm.title', updatedContent?.contactForm?.title || 'Gửi tin nhắn cho chúng tôi', 'text-2xl font-bold')}
                        </h2>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 group">
                                        {renderEditableField('contactForm.nameLabel', updatedContent?.contactForm?.nameLabel || 'Họ và tên', 'text-sm font-medium text-gray-700')}
                                    </label>
                                    <input type="text" className="w-full p-2 border border-gray-300 rounded-md" placeholder="Nhập họ và tên" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 group">
                                        {renderEditableField('contactForm.emailLabel', updatedContent?.contactForm?.emailLabel || 'Email', 'text-sm font-medium text-gray-700')}
                                    </label>
                                    <input type="email" className="w-full p-2 border border-gray-300 rounded-md" placeholder="Nhập email" />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1 group">
                                    {renderEditableField('contactForm.subjectLabel', updatedContent?.contactForm?.subjectLabel || 'Tiêu đề', 'text-sm font-medium text-gray-700')}
                                </label>
                                <input type="text" className="w-full p-2 border border-gray-300 rounded-md" placeholder="Nhập tiêu đề" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1 group">
                                    {renderEditableField('contactForm.messageLabel', updatedContent?.contactForm?.messageLabel || 'Nội dung tin nhắn', 'text-sm font-medium text-gray-700')}
                                </label>
                                <textarea className="w-full p-2 border border-gray-300 rounded-md h-32" placeholder="Nhập nội dung tin nhắn"></textarea>
                            </div>
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                                {renderEditableField('contactForm.submitButton', updatedContent?.contactForm?.submitButton || 'Gửi tin nhắn')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Câu hỏi thường gặp */}
                <div>
                    <div className="flex items-center mb-8">
                        <HelpCircle className="h-7 w-7 text-indigo-600 mr-3" />
                        <h2 className="text-2xl font-bold group">
                            {renderEditableField('faq.title', updatedContent?.faq?.title || 'Câu hỏi thường gặp', 'text-2xl font-bold')}
                        </h2>
                    </div>
                    <div className="space-y-6">
                        {[0, 1, 2].map((index) => {
                            const faq = updatedContent?.faq?.questions?.[index] || {
                                question: `Câu hỏi thường gặp ${index + 1}?`,
                                answer: `Câu trả lời cho câu hỏi thường gặp ${index + 1}.`
                            };

                            return (
                                <div key={index} className="bg-white p-6 rounded-lg shadow">
                                    <h3 className="text-lg font-bold mb-2 group">
                                        {renderEditableField(`faq.questions.${index}.question`, faq.question, 'text-lg font-bold')}
                                    </h3>
                                    <p className="text-gray-700 group">
                                        {renderEditableField(`faq.questions.${index}.answer`, faq.answer, 'text-gray-700')}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
