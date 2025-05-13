'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/services/api'; // Giả định có service api để gọi backend

interface ImageUploadProps {
    value: string; // URL hình ảnh hiện tại
    onChange: (url: string) => void; // Callback khi URL hình ảnh thay đổi
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(value);

    // Xử lý khi chọn tệp
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            setIsLoading(true);
            // Gọi API backend để tải lên hình ảnh
            // Giả định endpoint là /api/admin/upload/image và trả về { url: '...' }
            const response = await api.post('/api/admin/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.url) {
                const imageUrl = response.data.url;
                setPreviewUrl(imageUrl);
                onChange(imageUrl); // Cập nhật giá trị ở component cha
                toast.success('Tải lên hình ảnh thành công!');
            } else {
                toast.error('Tải lên hình ảnh thất bại.');
            }
        } catch (error) {
            console.error('Lỗi khi tải lên hình ảnh:', error);
            toast.error('Lỗi khi tải lên hình ảnh.');
        } finally {
            setIsLoading(false);
        }
    };

    // Xử lý khi xóa hình ảnh
    const handleRemoveImage = () => {
        setPreviewUrl('');
        onChange(''); // Xóa URL hình ảnh ở component cha
        toast('Đã xóa hình ảnh.', { icon: '🗑️' });
    };

    return (
        <div className="flex flex-col space-y-2">
            {previewUrl && (
                <div className="relative w-32 h-32 overflow-hidden rounded-md">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={handleRemoveImage}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
            <div className="flex items-center space-x-2">
                <Input
                    type="text"
                    value={previewUrl}
                    onChange={(e) => {
                        setPreviewUrl(e.target.value);
                        onChange(e.target.value); // Cập nhật giá trị ngay cả khi nhập URL thủ công
                    }}
                    placeholder="Nhập URL hình ảnh hoặc tải lên"
                    className="flex-1"
                />
                <label htmlFor="image-upload-input">
                    <Button variant="outline" disabled={isLoading}> {/* Loại bỏ asChild */}
                        <span className="flex items-center cursor-pointer"> {/* Bọc nội dung bằng span */}
                            {isLoading ? (
                                <span className="animate-spin mr-2">⚙️</span>
                            ) : (
                                <Upload className="h-4 w-4 mr-2" />
                            )}
                            Tải lên
                            <input
                                id="image-upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="sr-only"
                                disabled={isLoading}
                            />
                        </span>
                    </Button>
                </label>
            </div>
        </div>
    );
}
