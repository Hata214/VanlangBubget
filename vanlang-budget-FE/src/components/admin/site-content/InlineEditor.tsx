'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, X, Type, Image, Link, Bold, Italic, List } from 'lucide-react';

interface InlineEditorProps {
    field: string;
    value: any;
    onSave: (value: any) => void;
    onCancel: () => void;
}

export default function InlineEditor({ field, value, onSave, onCancel }: InlineEditorProps) {
    const [editValue, setEditValue] = useState(value || '');
    const [editorType, setEditorType] = useState<'text' | 'textarea' | 'rich'>('text');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Determine editor type based on field name and content
        if (field.includes('content') || field.includes('description') || (typeof value === 'string' && value.length > 100)) {
            setEditorType('textarea');
        } else if (field.includes('rich') || field.includes('html')) {
            setEditorType('rich');
        } else {
            setEditorType('text');
        }

        // Focus the input when component mounts
        setTimeout(() => {
            if (editorType === 'textarea' && textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.select();
            } else if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 100);
    }, [field, value, editorType]);

    const handleSave = () => {
        console.log('InlineEditor: Saving field', field, 'with value', editValue);
        onSave(editValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && editorType === 'text') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        } else if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSave();
        }
    };

    const getFieldDisplayName = (field: string): string => {
        const parts = field.split('.');
        const lastPart = parts[parts.length - 1];

        const displayNames: { [key: string]: string } = {
            title: 'Tiêu đề',
            subtitle: 'Phụ đề',
            description: 'Mô tả',
            content: 'Nội dung',
            button: 'Nút bấm',
            primaryButton: 'Nút chính',
            secondaryButton: 'Nút phụ',
            name: 'Tên',
            price: 'Giá',
            email: 'Email',
            phone: 'Điện thoại',
            address: 'Địa chỉ',
            logo: 'Logo',
            copyright: 'Bản quyền'
        };

        return displayNames[lastPart] || lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    };

    const renderTextEditor = () => (
        <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={`Nhập ${getFieldDisplayName(field).toLowerCase()}...`}
        />
    );

    const renderTextareaEditor = () => (
        <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
            placeholder={`Nhập ${getFieldDisplayName(field).toLowerCase()}...`}
        />
    );

    const renderRichEditor = () => (
        <div className="border border-gray-300 rounded-lg">
            {/* Rich text toolbar */}
            <div className="flex items-center space-x-2 p-2 border-b border-gray-200 bg-gray-50">
                <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded"
                    title="List"
                >
                    <List className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Link"
                >
                    <Link className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Image"
                >
                    <Image className="h-4 w-4" />
                </button>
            </div>

            {/* Rich text content area */}
            <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={6}
                className="w-full px-3 py-2 border-0 focus:ring-0 outline-none resize-vertical"
                placeholder={`Nhập ${getFieldDisplayName(field).toLowerCase()}...`}
            />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <Type className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Chỉnh sửa: {getFieldDisplayName(field)}
                        </h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trường: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{field}</code>
                        </label>

                        {/* Editor Type Selector */}
                        <div className="flex space-x-2 mb-3">
                            <button
                                onClick={() => setEditorType('text')}
                                className={`px-3 py-1 text-xs rounded ${editorType === 'text'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Văn bản
                            </button>
                            <button
                                onClick={() => setEditorType('textarea')}
                                className={`px-3 py-1 text-xs rounded ${editorType === 'textarea'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Đoạn văn
                            </button>
                            <button
                                onClick={() => setEditorType('rich')}
                                className={`px-3 py-1 text-xs rounded ${editorType === 'rich'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Rich Text
                            </button>
                        </div>

                        {/* Editor */}
                        {editorType === 'text' && renderTextEditor()}
                        {editorType === 'textarea' && renderTextareaEditor()}
                        {editorType === 'rich' && renderRichEditor()}
                    </div>

                    {/* Character count */}
                    <div className="text-xs text-gray-500 mb-4">
                        Số ký tự: {editValue.length}
                    </div>

                    {/* Preview */}
                    {editValue && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Xem trước:
                            </label>
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="text-gray-900 whitespace-pre-wrap">
                                    {editValue}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-500">
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + Enter</kbd> để lưu,{' '}
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd> để hủy
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
