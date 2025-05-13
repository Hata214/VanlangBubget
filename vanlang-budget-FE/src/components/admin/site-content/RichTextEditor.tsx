'use client';

import { useState } from 'react';

// Props cho component RichTextEditor
interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
    // Các tab để chuyển đổi giữa chế độ xem và chỉnh sửa
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

    return (
        <div className="rich-text-editor border rounded overflow-hidden">
            <div className="tabs flex border-b">
                <button
                    className={`px-4 py-2 ${activeTab === 'edit' ? 'bg-blue-50 border-b-2 border-blue-500' : 'bg-gray-50'}`}
                    onClick={() => setActiveTab('edit')}
                >
                    Chỉnh sửa
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'preview' ? 'bg-blue-50 border-b-2 border-blue-500' : 'bg-gray-50'}`}
                    onClick={() => setActiveTab('preview')}
                >
                    Xem trước
                </button>
            </div>

            {activeTab === 'edit' ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full p-4 min-h-[200px] focus:outline-none"
                    placeholder="Nhập nội dung văn bản phong phú ở đây..."
                />
            ) : (
                <div
                    className="preview p-4 min-h-[200px]"
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            )}
        </div>
    );
};

export default RichTextEditor; 