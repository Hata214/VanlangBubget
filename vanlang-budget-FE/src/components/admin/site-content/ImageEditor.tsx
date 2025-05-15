'use client';

import React, { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import api from '@/services/api';

interface ImageEditorProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function ImageEditor({
  value,
  onChange,
  label = 'Hình ảnh',
  placeholder = 'Nhập URL hình ảnh hoặc tải lên',
  className = '',
}: ImageEditorProps) {
  const [imageUrl, setImageUrl] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);

  useEffect(() => {
    setImageUrl(value || '');
  }, [value]);

  // Xử lý khi chọn tệp
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsLoading(true);
      // Gọi API backend để tải lên hình ảnh
      const response = await api.post('/api/admin/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.url) {
        const newImageUrl = response.data.url;
        setImageUrl(newImageUrl);
        onChange(newImageUrl);
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
    setImageUrl('');
    onChange('');
    toast('Đã xóa hình ảnh.', { icon: '🗑️' });
  };

  // Xử lý khi thay đổi URL hình ảnh
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setImageUrl(newUrl);
    onChange(newUrl);
  };

  // Tải danh sách hình ảnh có sẵn
  const loadAvailableImages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/images');
      if (response.data && Array.isArray(response.data)) {
        // Lọc các URL hình ảnh hợp lệ
        const validImages = response.data.filter((url: string) =>
          url && (url.startsWith('/images/') || url.startsWith('/uploads/'))
        );
        setAvailableImages(validImages);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hình ảnh:', error);
      toast.error('Không thể tải danh sách hình ảnh.');

      // Sử dụng một số hình ảnh mẫu trong trường hợp lỗi
      setAvailableImages([
        '/images/placeholder.png',
        '/images/logos/logo.png',
        '/images/homepage/hero.png'
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mở trình chọn hình ảnh
  const handleOpenImagePicker = () => {
    setShowImagePicker(true);
    loadAvailableImages();
  };

  // Chọn hình ảnh từ danh sách
  const handleSelectImage = (url: string) => {
    setImageUrl(url);
    onChange(url);
    setShowImagePicker(false);
    toast.success('Đã chọn hình ảnh!');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Hiển thị hình ảnh nếu có */}
      {imageUrl && (
        <div className="relative border rounded-md p-2 bg-gray-50">
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6 rounded-full absolute top-2 right-2 z-10"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex justify-center p-2">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-h-48 object-contain rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder.png';
              }}
            />
          </div>
        </div>
      )}

      {/* Input URL và nút tải lên */}
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          value={imageUrl}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="flex-1"
        />
        <div className="flex space-x-1">
          <label htmlFor={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}>
            <Button variant="outline" disabled={isLoading} type="button">
              <span className="flex items-center cursor-pointer">
                {isLoading ? (
                  <span className="animate-spin mr-2">⚙️</span>
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Tải lên
              </span>
              <input
                id={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
                disabled={isLoading}
              />
            </Button>
          </label>
          <Button
            variant="outline"
            type="button"
            onClick={handleOpenImagePicker}
            disabled={isLoading}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Chọn
          </Button>
        </div>
      </div>

      {/* Trình chọn hình ảnh */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Chọn hình ảnh</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowImagePicker(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : availableImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableImages.map((url, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-2 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleSelectImage(url)}
                  >
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.png';
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không có hình ảnh nào. Hãy tải lên hình ảnh trước.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
