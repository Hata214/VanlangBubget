import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackToHomeProps {
    className?: string;
}

const BackToHome: React.FC<BackToHomeProps> = ({ className = '' }) => {
    const router = useRouter();

    const handleBackToHome = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // Xóa tất cả các class liên quan đến admin
        document.body.classList.remove('admin-page');

        // Tạo một timeout nhỏ để đảm bảo CSS được xóa trước khi chuyển trang
        setTimeout(() => {
            // Sử dụng window.location.href để load lại trang hoàn toàn
            // thay vì router.push() để tránh vấn đề CSS còn sót lại
            window.location.href = '/';
        }, 10);
    };

    return (
        <button
            onClick={handleBackToHome}
            className={`inline-flex items-center gap-1 px-3 py-2 bg-white rounded-md shadow-sm border border-gray-200 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-all duration-200 ${className}`}
        >
            <ChevronLeft size={16} strokeWidth={2.5} />
            <span className="font-medium">Trang chủ</span>
        </button>
    );
};

export default BackToHome; 