import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Giả định sử dụng react-hot-toast cho thông báo

// Giả định service fetch data
const fetchSiteContent = async (type: string) => {
    const { data } = await axios.get(`/api/site-content/${type}`);
    return data.data; // Dựa vào cấu trúc response từ backend
};

// Giả định service update data
const updateSiteContent = async ({ type, content }: { type: string; content: any }) => {
    const { data } = await axios.put(`/api/site-content/${type}`, { content });
    return data.data; // Dựa vào cấu trúc response từ backend
};

const AdminSiteContentPage: React.FC = () => {
    const [selectedType, setSelectedType] = useState('homepage'); // Mặc định chọn homepage
    const queryClient = useQueryClient();

    const contentTypes = [
        { value: 'homepage', label: 'Trang chủ' },
        { value: 'about', label: 'Giới thiệu' },
        { value: 'contact', label: 'Liên hệ' },
        { value: 'footer', label: 'Footer' },
        { value: 'terms', label: 'Điều khoản sử dụng' },
        { value: 'privacy', label: 'Chính sách bảo mật' },
        { value: 'faq', label: 'FAQ' },
    ];

    const { data: siteContent, isLoading, error } = useQuery({
        queryKey: ['siteContent', selectedType],
        queryFn: () => fetchSiteContent(selectedType),
        enabled: !!selectedType, // Chỉ fetch khi selectedType có giá trị
    });

    const updateMutation = useMutation({
        mutationFn: updateSiteContent,
        onSuccess: () => {
            // Invalidate cache để refetch dữ liệu mới sau khi cập nhật thành công
            queryClient.invalidateQueries({ queryKey: ['siteContent', selectedType] });
            toast.success('Cập nhật nội dung thành công!');
        },
        onError: (err) => {
            toast.error(`Lỗi khi cập nhật nội dung: ${(err as Error).message}`);
        },
    });

    const handleSaveContent = (data: any) => {
        updateMutation.mutate({ type: selectedType, content: data });
    };

    if (isLoading) {
        return <div>Đang tải nội dung...</div>;
    }

    if (error) {
        return <div>Lỗi khi tải nội dung: {(error as Error).message}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Quản lý nội dung trang</h1>

            <div className="mb-6">
                <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chọn loại nội dung:
                </label>
                <select
                    id="contentType"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {contentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Form chỉnh sửa nội dung sẽ hiển thị ở đây dựa trên selectedType */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Nội dung ({selectedType})</h2>
                {siteContent && (
                    <SiteContentForm
                        type={selectedType}
                        initialData={siteContent}
                        onSubmit={handleSaveContent}
                        isSaving={updateMutation.isPending}
                    />
                )}
            </div>
        </div>
    );
};

// Component Form chỉnh sửa (Placeholder)
interface SiteContentFormProps {
    type: string;
    initialData: any; // Cần định nghĩa type cụ thể hơn sau
    onSubmit: (data: any) => void;
    isSaving: boolean;
}

const SiteContentForm: React.FC<SiteContentFormProps> = ({ type, initialData, onSubmit, isSaving }) => {
    const [formData, setFormData] = useState(initialData);

    // Cập nhật form data khi initialData thay đổi (khi chọn loại nội dung khác)
    React.useEffect(() => {
        setFormData(initialData);
    }, [initialData]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Đây là form placeholder, cần xây dựng form động dựa trên cấu trúc dữ liệu thực tế
    // Ví dụ: nếu initialData là object { title: '...', description: '...' }
    // Cần render input cho title và textarea cho description

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-md">
            <h3 className="text-lg font-semibold mb-4">Chỉnh sửa nội dung {type}</h3>
            {/* Render form fields based on formData structure */}
            {/* Hiện tại chỉ hiển thị JSON string */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dữ liệu (JSON):
                </label>
                <textarea
                    value={JSON.stringify(formData, null, 2)}
                    onChange={(e) => {
                        try {
                            setFormData(JSON.parse(e.target.value));
                        } catch (error) {
                            console.error("Invalid JSON:", error);
                            // Xử lý lỗi JSON không hợp lệ
                        }
                    }}
                    rows={10}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            <button
                onClick={() => onSubmit(formData)}
                disabled={isSaving}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isSaving ? 'Đang lưu...' : 'Lưu nội dung'}
            </button>
        </div>
    );
};

export default AdminSiteContentPage;
